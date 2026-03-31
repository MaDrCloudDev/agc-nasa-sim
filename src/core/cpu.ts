import { Memory } from './memory.js';
import { decodeInstruction } from './decoder.js';
import { executeInstruction } from './executor.js';
import { MAX_TRACE_ENTRIES } from './constants.js';
import { HaltedMachineStep, MalformedProgram } from './types.js';
import type { DecodedInstruction, MachineState, TraceEntry, ProgramData } from './types.js';

export class AgcCpu {
  pc: number = 0;
  acc: number = 0;
  l: number = 0;
  q: number = 0;
  z: number = 0;
  running: boolean = false;
  halted: boolean = false;
  interruptEnabled: boolean = false;
  cycleCount: number = 0;
  memory: Memory;
  input: Record<number, number> = {};
  output: Record<number, number> = {};
  currentInstruction: DecodedInstruction | null = null;
  trace: TraceEntry[] = [];

  constructor(memorySize?: number) {
    this.memory = new Memory(memorySize);
  }

  step(): void {
    if (this.halted) {
      throw new HaltedMachineStep();
    }

    this.z = this.pc;
    const rawWord = this.memory.read(this.pc);
    this.currentInstruction = decodeInstruction(rawWord);

    const result = executeInstruction(this, this.currentInstruction);

    this.trace.push({
      cycle: this.cycleCount,
      address: this.z,
      raw: rawWord,
      mnemonic: this.currentInstruction.mnemonic,
      operand: this.currentInstruction.operand,
      result,
    });

    if (this.trace.length > MAX_TRACE_ENTRIES) {
      this.trace.shift();
    }

    this.cycleCount++;
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

  reset(): void {
    this.pc = 0;
    this.acc = 0;
    this.l = 0;
    this.q = 0;
    this.z = 0;
    this.running = false;
    this.halted = false;
    this.interruptEnabled = false;
    this.cycleCount = 0;
    this.currentInstruction = null;
    this.input = {};
    this.output = {};
    this.trace = [];
    this.memory = new Memory(this.memory.size);
  }

  loadProgram(program: ProgramData): void {
    if (!program.name || typeof program.startAddress !== 'number' || !Array.isArray(program.words)) {
      throw new MalformedProgram('Missing required fields: name, startAddress, words');
    }
    if (program.words.length === 0) {
      throw new MalformedProgram('Program has no words');
    }
    this.memory.load(program.startAddress, program.words);
    this.pc = program.entryPoint ?? program.startAddress;
  }

  getState(): MachineState {
    return {
      pc: this.pc,
      acc: this.acc,
      l: this.l,
      q: this.q,
      z: this.z,
      running: this.running,
      halted: this.halted,
      interruptEnabled: this.interruptEnabled,
      cycleCount: this.cycleCount,
      memory: new Uint16Array(this.memory.dump(0, this.memory.size)),
      input: { ...this.input },
      output: { ...this.output },
      currentInstruction: this.currentInstruction,
      trace: [...this.trace],
    };
  }
}
