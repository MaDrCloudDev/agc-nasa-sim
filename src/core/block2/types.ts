import type { AgcData15, AgcWord16 } from './word.js';

export interface Block2DecodedInstruction {
  raw: AgcWord16;
  data15: AgcData15;
  mnemonic: string;
  // New authentic addressing fields
  address?: number;  // For memory-reference instructions (12/10/9-bit depending on code type)
  channel?: number;  // For I/O instructions
  // Legacy fields kept during the transition.
  orderCode9?: number;
  operand6?: number;
}

export interface Block2TraceEntry {
  cycle: number;
  address: number;
  z: number;
  raw: AgcWord16;
  mnemonic: string;
  operand?: number;
  result: string;
}

export interface Block2MachineState {
  // Central registers (Block II)
  a: AgcData15;
  l: AgcData15;
  q: AgcData15;
  z: number; // 12-bit-ish address in practice; kept as number
  eb: number; // erasable bank (stub)
  fb: number; // fixed bank (stub)
  bb: number; // combined bank (stub)

  running: boolean;
  halted: boolean;
  cycleCount: number;

  memoryErasable: Uint16Array;
  fixedBank0: Uint16Array;

  currentInstruction: Block2DecodedInstruction | null;
  trace: Block2TraceEntry[];
}
