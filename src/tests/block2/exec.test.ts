import { describe, it, expect } from 'vitest';
import { AgcBlock2Cpu } from '../../core/block2/cpu.js';
import {
  encodeAD,
  encodeCA,
  encodeCCS,
  encodeMSK,
  encodeNDX,
  encodeTS,
  encodeXCH,
  SPECIAL_EXTEND,
  encodeTC,
  encodeTCF,
} from '../../core/block2/decoder.js';
import { data15FromWord, makeWordWithOddParity } from '../../core/block2/word.js';

function prog(words15: number[]) {
  return {
    name: 'p',
    startAddress: 0o2000,
    entryPoint: 0o2000,
    words: words15,
  };
}

describe('block2/executor', () => {
  it('CA loads A from erasable', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.memory.write(0o34, makeWordWithOddParity(0o00005));
    cpu.loadProgram(prog([encodeCA(0o34)]));
    cpu.step();
    expect(cpu.a).toBe(0o00005);
  });

  it('AD adds using ones-complement arithmetic', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.memory.write(0o10, makeWordWithOddParity(3));
    cpu.memory.write(0o11, makeWordWithOddParity(4));
    cpu.loadProgram(prog([
      encodeCA(0o10),
      encodeAD(0o11),
    ]));
    cpu.step();
    cpu.step();
    expect(cpu.a).toBe(7);
  });

  it('XCH exchanges A with erasable', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.a = 5;
    cpu.memory.write(0o20, makeWordWithOddParity(9));
    cpu.loadProgram(prog([encodeXCH(0o20)]));
    cpu.step();
    expect(cpu.a).toBe(9);
    expect(data15FromWord(cpu.memory.read(0o20, 0))).toBe(5);
  });

  it('TS stores A into erasable', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.a = 7;
    cpu.loadProgram(prog([encodeTS(0o30)]));
    cpu.step();
    expect(data15FromWord(cpu.memory.read(0o30, 0))).toBe(7);
  });

  it('NDXE indexes the next instruction word', () => {
    const cpu = new AgcBlock2Cpu();
    // index value = +1 in E01
    cpu.memory.write(0o01, makeWordWithOddParity(1));
    // value in E02 to be loaded after index increments the CA operand from 1->2
    cpu.memory.write(0o02, makeWordWithOddParity(8));

    cpu.loadProgram(prog([
      encodeNDX(0o01),
      encodeCA(0o01),
    ]));

    cpu.step(); // NDXE
    cpu.step(); // CA (should have been patched to CA E02)
    expect(cpu.a).toBe(8);
  });

  it('MSK ANDs A with K', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.a = 0o12345;
    cpu.memory.write(0o10, makeWordWithOddParity(0o00077));
    cpu.loadProgram(prog([encodeMSK(0o10)]));
    cpu.step();
    expect(cpu.a).toBe(0o00045);
  });

  it('CCS skips based on sign/zero and sets A = |E|-1', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.memory.write(0o10, makeWordWithOddParity(0o00005)); // positive nonzero
    cpu.loadProgram(prog([
      encodeCCS(0o10),
      0o77777,
      0o77777,
      0o77777,
      0o77777,
    ]));
    cpu.step();
    expect(cpu.z).toBe(0o2001);
    expect(cpu.a).toBe(0o00004);
  });

  it('EXTEND affects the next instruction decode only', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.memory.write(0o10, makeWordWithOddParity(1));
    cpu.loadProgram(prog([
      SPECIAL_EXTEND,
      encodeNDX(0o10),
      encodeCA(0o10),
    ]));
    cpu.step(); // EXTEND
    expect(cpu.currentInstruction?.mnemonic).toBe('EXTEND');
    cpu.step(); // should decode as NDXK
    expect(cpu.currentInstruction?.mnemonic).toBe('NDXK');
    cpu.step(); // next should not still be extended
    expect(cpu.currentInstruction?.mnemonic).toBe('CA');
  });

  it('TC transfers control and saves return address', () => {
    const cpu = new AgcBlock2Cpu();
    // TC with operand jumps to that erasable address
    // We'll put a TS instruction at address 5 in erasable
    cpu.memory.write(0o05, makeWordWithOddParity(encodeTS(0o43)));
    
    cpu.loadProgram(prog([
      encodeTC(0o05), // Jump to erasable address 5
    ]));
    cpu.a = 0x123;
    cpu.step();
    expect(cpu.z).toBe(0o05);
    expect(cpu.q).toBe(0o2001); // Return address saved
    cpu.step();
    expect(data15FromWord(cpu.memory.read(0o43, 0))).toBe(0x123);
  });

  it('TCF transfers control to fixed memory', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.loadProgram(prog([
      encodeTCF(0o045), // Jump to fixed: 2000 + 045 = 2045
    ]));
    cpu.step();
    expect(cpu.z).toBe(0o2045);
  });
});
