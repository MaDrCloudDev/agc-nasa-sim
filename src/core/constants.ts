// Memory
export const MEMORY_SIZE = 4096;

// Opcode table for v1, phase 1.
export const OP_NOP  = 0x00;
export const OP_LOAD = 0x01;
export const OP_STORE = 0x02;
export const OP_ADD  = 0x03;
export const OP_SUB  = 0x04;
export const OP_JMP  = 0x05;
export const OP_JZ   = 0x06;
export const OP_JN   = 0x07;
export const OP_IN   = 0x08;
export const OP_OUT  = 0x09;
export const OP_HALT = 0x0A;

export const OPCODE_NAMES: Record<number, string> = {
  [OP_NOP]:   'NOP',
  [OP_LOAD]:  'LOAD',
  [OP_STORE]: 'STORE',
  [OP_ADD]:   'ADD',
  [OP_SUB]:   'SUB',
  [OP_JMP]:   'JMP',
  [OP_JZ]:    'JZ',
  [OP_JN]:    'JN',
  [OP_IN]:    'IN',
  [OP_OUT]:   'OUT',
  [OP_HALT]:  'HALT',
};

// Trace buffer size
export const MAX_TRACE_ENTRIES = 500;
