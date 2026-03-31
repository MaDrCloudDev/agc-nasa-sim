import { DecodedInstruction } from './types.js';
import { OPCODE_NAMES } from './constants.js';

export function decodeInstruction(word: number): DecodedInstruction {
  const opcode = (word >> 12) & 0xF;
  const operand = word & 0xFFF;
  const mnemonic = OPCODE_NAMES[opcode] ?? '???';

  return {
    raw: word,
    opcode,
    mnemonic,
    operand,
  };
}
