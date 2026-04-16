import type { ProgramData } from '../types.js';
import { MAX_TRACE_ENTRIES } from '../constants.js';
import type { AgcData15, AgcWord16 } from './word.js';
import { data15FromWord, makeWordWithOddParity, mask15 } from './word.js';
import { Block2Memory } from './memory.js';
import type { Block2DecodedInstruction, Block2MachineState, Block2TraceEntry } from './types.js';
import { decodeBlock2Instruction, type Block2DecodeState } from './decoder.js';
import { executeBlock2Instruction } from './executor.js';
import { Block2Io } from './io.js';

export class AgcBlock2Cpu {
  // Central registers
  a: AgcData15 = 0;
  l: AgcData15 = 0;
  q: AgcData15 = 0;
  z: number = 0;
  eb: number = 0;
  fb: number = 0;
  bb: number = 0;

  running: boolean = false;
  halted: boolean = false;
  cycleCount: number = 0;

  memory: Block2Memory;

  // Channels will be added in Phase 5; keep a placeholder for UI compatibility.
  io: Block2Io = new Block2Io();

  currentInstruction: Block2DecodedInstruction | null = null;
  trace: Block2TraceEntry[] = [];
  private _decodeState: Block2DecodeState = { extended: false };
  private _nextPatchedInstruction: { addr: number; data15: AgcData15 } | null = null;

  constructor(fixedBankCount?: number) {
    this.memory = new Block2Memory(fixedBankCount);
  }

  get pc(): number {
    return this.z;
  }

  get acc(): number {
    // UI compatibility: expose A as a number (15-bit)
    return this.a;
  }

  reset(): void {
    this.a = 0;
    this.l = 0;
    this.q = 0;
    this.z = 0;
    this.eb = 0;
    this.fb = 0;
    this.bb = 0;
    this.running = false;
    this.halted = false;
    this.cycleCount = 0;
    this.io = new Block2Io();
    this.currentInstruction = null;
    this.trace = [];
    this._decodeState = { extended: false };
    this._nextPatchedInstruction = null;
    this.memory = new Block2Memory(this.memory.fixedBanks.length);
  }

  loadProgram(program: ProgramData): void {
    // For the surgical path we accept the existing ProgramData shape.
    // The program's words are treated as raw 15-bit data (parity re-generated).
    this.memory.load(program.startAddress, program.words, this.fb);
    this.z = program.entryPoint ?? program.startAddress;
  }

  step(): void {
    if (this.halted) return;

    const address = this.z;
    let raw = this.memory.read(this.z, this.fb) as AgcWord16;
    if (this._nextPatchedInstruction && this._nextPatchedInstruction.addr === this.z) {
      raw = makeWordWithOddParity(this._nextPatchedInstruction.data15) as AgcWord16;
      this._nextPatchedInstruction = null;
    }
    const data15 = data15FromWord(raw);

    // EXTEND affects decode/execute of the *next* instruction only.
    const decoded = decodeBlock2Instruction(raw, this._decodeState);
    this.currentInstruction = decoded;
    const result = executeBlock2Instruction(this, decoded, this._decodeState);
    if (decoded.mnemonic !== 'EXTEND') {
      this._decodeState.extended = false;
    }

    this.trace.push({
      cycle: this.cycleCount,
      address,
      z: this.z,
      raw,
      mnemonic: decoded.mnemonic,
      operand: decoded.address ?? decoded.channel ?? decoded.operand6,
      result,
    });
    if (this.trace.length > MAX_TRACE_ENTRIES) this.trace.shift();

    this.cycleCount++;
  }

  // Used by NDX/INDEX semantics: patch the next instruction word in-flight.
  patchNextInstruction(addr: number, data15: AgcData15): void {
    this._nextPatchedInstruction = { addr: addr & 0o7777, data15: mask15(data15) };
  }

  run(maxSteps: number = 10000): void {
    this.running = true;
    let steps = 0;
    while (!this.halted && steps < maxSteps) {
      this.step();
      steps++;
    }
    this.running = false;
  }

  getState(): Block2MachineState {
    return {
      a: mask15(this.a),
      l: mask15(this.l),
      q: mask15(this.q),
      z: this.z,
      eb: this.eb,
      fb: this.fb,
      bb: this.bb,
      running: this.running,
      halted: this.halted,
      cycleCount: this.cycleCount,
      memoryErasable: this.memory.dumpErasable(),
      fixedBank0: this.memory.dumpFixedBank0(),
      currentInstruction: this.currentInstruction,
      trace: [...this.trace],
    };
  }

  // Channel semantics (surgical): channel 01 maps to L, channel 02 maps to Q.
  readChannel(ch: number): AgcData15 {
    if (ch === 0o01) return this.l;
    if (ch === 0o02) return this.q;
    return this.io.read(ch);
  }

  writeChannel(ch: number, value: AgcData15): void {
    if (ch === 0o01) {
      this.l = mask15(value);
      return;
    }
    if (ch === 0o02) {
      this.q = mask15(value);
      return;
    }
    this.io.write(ch, value);
  }
}
