import type { AgcBlock2Cpu } from './cpu.js';
import type { Block2DecodedInstruction } from './types.js';
import type { Block2DecodeState } from './decoder.js';
import {
  addOnesComplement15,
  data15FromWord,
  isNegativeZero15,
  makeWordWithOddParity,
  onesComplementNegate15,
  subOnesComplement15,
} from './word.js';

export function executeBlock2Instruction(cpu: AgcBlock2Cpu, inst: Block2DecodedInstruction, state: Block2DecodeState): string {
  // Get the effective address (use address field or fall back to operand6)
  const addr = inst.address !== undefined ? inst.address : (inst.operand6 ?? 0);
  const ch = inst.channel !== undefined ? inst.channel : (inst.operand6 ?? 0);

  switch (inst.mnemonic) {
    case 'RELINT':
    case 'INHINT':
    case 'RESUME':
      cpu.z = (cpu.z + 1) & 0o7777;
      return inst.mnemonic;

    case 'EXTEND':
      state.extended = true;
      cpu.z = (cpu.z + 1) & 0o7777;
      return 'EXTEND';

    case 'TC':
      cpu.q = ((cpu.z + 1) & 0o7777) as any;
      cpu.z = addr & 0o7777;
      return `TC ${addr.toString(8)}`;

    case 'TCF':
      // TCF addresses are in fixed memory: map to 2000-3777
      cpu.z = (0o2000 + (addr & 0o1777)) & 0o7777;
      return `TCF ${addr.toString(8)}`;

    case 'CCS': {
      const e = data15FromWord(cpu.memory.read(addr, cpu.fb));

      let skip = 1;
      if (e === 0) skip = 2;
      else if (isNegativeZero15(e)) skip = 4;
      else if ((e & 0x4000) !== 0) skip = 3;

      const mag = (e & 0x4000) !== 0 ? (onesComplementNegate15(e) & 0x7fff) : (e & 0x7fff);
      cpu.a = subOnesComplement15(mag, 1);
      cpu.z = (cpu.z + skip) & 0o7777;
      return `CCS [${addr.toString(8)}]`;
    }

    case 'CA': {
      const w = cpu.memory.read(addr, cpu.fb);
      cpu.a = data15FromWord(w);
      cpu.z = (cpu.z + 1) & 0o7777;
      return `A = [${addr.toString(8)}]`;
    }

    case 'CS': {
      const w = cpu.memory.read(addr, cpu.fb);
      cpu.a = onesComplementNegate15(data15FromWord(w));
      cpu.z = (cpu.z + 1) & 0o7777;
      return `A = -[${addr.toString(8)}]`;
    }

    case 'TS': {
      cpu.memory.write(addr, makeWordWithOddParity(cpu.a));
      cpu.z = (cpu.z + 1) & 0o7777;
      return `[${addr.toString(8)}] = A`;
    }

    case 'XCH': {
      const w = cpu.memory.read(addr, cpu.fb);
      const mem = data15FromWord(w);
      cpu.memory.write(addr, makeWordWithOddParity(cpu.a));
      cpu.a = mem;
      cpu.z = (cpu.z + 1) & 0o7777;
      return `XCH [${addr.toString(8)}]`;
    }

    case 'DXCH': {
      // Double exchange: L with K, A with K+1
      const w1 = cpu.memory.read(addr, cpu.fb);
      const w2 = cpu.memory.read((addr + 1) & 0o7777, cpu.fb);
      const memK = data15FromWord(w1);
      const memK1 = data15FromWord(w2);
      const oldA = cpu.a;
      const oldL = cpu.l;
      cpu.memory.write(addr, makeWordWithOddParity(oldL));
      cpu.memory.write((addr + 1) & 0o7777, makeWordWithOddParity(oldA));
      cpu.l = memK;
      cpu.a = memK1;
      cpu.z = (cpu.z + 1) & 0o7777;
      return `DXCH [${addr.toString(8)}]`;
    }

    case 'AD': {
      const w = cpu.memory.read(addr, cpu.fb);
      cpu.a = addOnesComplement15(cpu.a, data15FromWord(w));
      cpu.z = (cpu.z + 1) & 0o7777;
      return `AD [${addr.toString(8)}]`;
    }

    case 'SU': {
      const w = cpu.memory.read(addr, cpu.fb);
      cpu.a = subOnesComplement15(cpu.a, data15FromWord(w));
      cpu.z = (cpu.z + 1) & 0o7777;
      return `SU [${addr.toString(8)}]`;
    }

    case 'MSK': {
      const w = cpu.memory.read(addr, cpu.fb);
      cpu.a = (cpu.a & data15FromWord(w)) & 0x7fff;
      cpu.z = (cpu.z + 1) & 0o7777;
      return `MSK [${addr.toString(8)}]`;
    }

    case 'READ': {
      cpu.a = cpu.readChannel(ch);
      cpu.z = (cpu.z + 1) & 0o7777;
      return `READ ${ch.toString(8)}`;
    }

    case 'WRITE': {
      cpu.writeChannel(ch, cpu.a);
      cpu.z = (cpu.z + 1) & 0o7777;
      return `WRITE ${ch.toString(8)}`;
    }

    case 'RAND': {
      cpu.a = (cpu.a & cpu.readChannel(ch)) & 0x7fff;
      cpu.z = (cpu.z + 1) & 0o7777;
      return `RAND ${ch.toString(8)}`;
    }

    case 'WAND': {
      cpu.writeChannel(ch, cpu.readChannel(ch) & cpu.a);
      cpu.z = (cpu.z + 1) & 0o7777;
      return `WAND ${ch.toString(8)}`;
    }

    case 'ROR': {
      cpu.a = (cpu.a | cpu.readChannel(ch)) & 0x7fff;
      cpu.z = (cpu.z + 1) & 0o7777;
      return `ROR ${ch.toString(8)}`;
    }

    case 'WOR': {
      cpu.writeChannel(ch, cpu.readChannel(ch) | cpu.a);
      cpu.z = (cpu.z + 1) & 0o7777;
      return `WOR ${ch.toString(8)}`;
    }

    case 'RXOR': {
      cpu.a = (cpu.a ^ cpu.readChannel(ch)) & 0x7fff;
      cpu.z = (cpu.z + 1) & 0o7777;
      return `RXOR ${ch.toString(8)}`;
    }

    case 'NDXE':
    case 'NDXK': {
      // Index: add c(E) to the next instruction's address field
      const idx = data15FromWord(cpu.memory.read(addr, cpu.fb));
      const nextAddr = (cpu.z + 1) & 0o7777;
      const nextWord = cpu.memory.read(nextAddr, cpu.fb);
      const nextData = data15FromWord(nextWord);
      const patched = addOnesComplement15(nextData, idx);
      cpu.patchNextInstruction(nextAddr, patched);
      cpu.z = nextAddr;
      return `${inst.mnemonic} [${addr.toString(8)}]`;
    }

    default:
      cpu.z = (cpu.z + 1) & 0o7777;
      return 'NOP';
  }
}
