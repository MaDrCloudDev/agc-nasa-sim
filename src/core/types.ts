export interface DecodedInstruction {
  raw: number;
  opcode: number;
  mnemonic: string;
  operand: number;
}

export interface MachineState {
  pc: number;
  acc: number;
  l: number;
  q: number;
  z: number;
  running: boolean;
  halted: boolean;
  interruptEnabled: boolean;
  cycleCount: number;
  memory: Uint16Array;
  input: Record<number, number>;
  output: Record<number, number>;
  currentInstruction: DecodedInstruction | null;
}

export interface TraceEntry {
  cycle: number;
  address: number;
  raw: number;
  mnemonic: string;
  operand: number;
  result: string;
}

export interface ProgramData {
  name: string;
  startAddress: number;
  entryPoint: number;
  words: number[];
}

export class InvalidMemoryAccess extends Error {
  constructor(address: number, size: number) {
    super(`Invalid memory access: address ${address} (size ${size})`);
    this.name = 'InvalidMemoryAccess';
  }
}

export class InvalidOpcode extends Error {
  constructor(opcode: number) {
    super(`Invalid opcode: 0x${opcode.toString(16).toUpperCase()}`);
    this.name = 'InvalidOpcode';
  }
}

export class WriteToFixedMemory extends Error {
  constructor(address: number) {
    super(`Write to fixed memory: address ${address}`);
    this.name = 'WriteToFixedMemory';
  }
}

export class MalformedProgram extends Error {
  constructor(reason: string) {
    super(`Malformed program: ${reason}`);
    this.name = 'MalformedProgram';
  }
}

export class BreakpointHit extends Error {
  constructor(address: number) {
    super(`Breakpoint hit at address ${address}`);
    this.name = 'BreakpointHit';
  }
}

export class HaltedMachineStep extends Error {
  constructor() {
    super('Cannot step a halted machine');
    this.name = 'HaltedMachineStep';
  }
}
