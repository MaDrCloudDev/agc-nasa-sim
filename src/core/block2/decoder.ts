import type { AgcData15, AgcWord16 } from './word.js';
import { mask15 } from './word.js';
import type { Block2DecodedInstruction } from './types.js';

// Block II instruction decoder.
// Handles a compact 9-bit order code + 6-bit operand encoding scheme
// that maps to the authentic AGC instruction set.

export interface Block2DecodeState {
  extended: boolean; // set by EXTEND; affects next decode/execute
}

// Order codes (9-bit values in bits 15-6)
export const ORDER_TC = 0o000;
export const ORDER_CCS = 0o010;
export const ORDER_TCF = 0o020;
export const ORDER_TCF_2 = 0o012;
export const ORDER_TCF_4 = 0o014;
export const ORDER_TCF_6 = 0o016;
export const ORDER_CA = 0o030;
export const ORDER_NDX = 0o050;
export const ORDER_TS = 0o054;
export const ORDER_XCH = 0o056;
export const ORDER_AD = 0o060;
export const ORDER_SU = 0o160;
export const ORDER_MSK = 0o070;

// Channel I/O order codes
export const ORDER_READ = 0o100;
export const ORDER_WRITE = 0o101;
export const ORDER_RAND = 0o102;
export const ORDER_WAND = 0o103;
export const ORDER_ROR = 0o104;
export const ORDER_WOR = 0o105;
export const ORDER_RXOR = 0o106;

// Special instructions (full 15-bit patterns)
export const SPECIAL_RELINT = 0o00003;
export const SPECIAL_INHINT = 0o00004;
export const SPECIAL_EXTEND = 0o00006;
export const SPECIAL_RESUME = 0o50017;

export function decodeBlock2Instruction(word: AgcWord16, state: Block2DecodeState): Block2DecodedInstruction {
  const data15 = mask15(word);

  // Check for special instructions first (exact 15-bit match)
  if (data15 === SPECIAL_RELINT) return { raw: word, data15, mnemonic: 'RELINT' };
  if (data15 === SPECIAL_INHINT) return { raw: word, data15, mnemonic: 'INHINT' };
  if (data15 === SPECIAL_EXTEND) return { raw: word, data15, mnemonic: 'EXTEND' };
  if (data15 === SPECIAL_RESUME) return { raw: word, data15, mnemonic: 'RESUME' };

  // Extract 9-bit order code (bits 15-6)
  const order = (data15 >>> 6) & 0o777;
  const operand6 = data15 & 0o77;

  switch (order) {
    case ORDER_TC:
      return { raw: word, data15, mnemonic: 'TC', orderCode9: order, operand6, address: operand6 };
    case ORDER_CCS:
      return { raw: word, data15, mnemonic: 'CCS', orderCode9: order, operand6, address: operand6 };
    case ORDER_TCF:
    case ORDER_TCF_2:
    case ORDER_TCF_4:
    case ORDER_TCF_6:
      return { raw: word, data15, mnemonic: 'TCF', orderCode9: order, operand6, address: operand6 };
    case ORDER_CA:
      return { raw: word, data15, mnemonic: 'CA', orderCode9: order, operand6, address: operand6 };
    case ORDER_TS:
      return { raw: word, data15, mnemonic: 'TS', orderCode9: order, operand6, address: operand6 };
    case ORDER_XCH:
      return { raw: word, data15, mnemonic: 'XCH', orderCode9: order, operand6, address: operand6 };
    case ORDER_AD:
      return { raw: word, data15, mnemonic: 'AD', orderCode9: order, operand6, address: operand6 };
    case ORDER_SU:
      return { raw: word, data15, mnemonic: 'SU', orderCode9: order, operand6, address: operand6 };
    case ORDER_MSK:
      return { raw: word, data15, mnemonic: 'MSK', orderCode9: order, operand6, address: operand6 };
    case ORDER_NDX:
      return { raw: word, data15, mnemonic: state.extended ? 'NDXK' : 'NDXE', orderCode9: order, operand6, address: operand6 };
    case ORDER_READ:
      return { raw: word, data15, mnemonic: 'READ', orderCode9: order, operand6, channel: operand6 };
    case ORDER_WRITE:
      return { raw: word, data15, mnemonic: 'WRITE', orderCode9: order, operand6, channel: operand6 };
    case ORDER_RAND:
      return { raw: word, data15, mnemonic: 'RAND', orderCode9: order, operand6, channel: operand6 };
    case ORDER_WAND:
      return { raw: word, data15, mnemonic: 'WAND', orderCode9: order, operand6, channel: operand6 };
    case ORDER_ROR:
      return { raw: word, data15, mnemonic: 'ROR', orderCode9: order, operand6, channel: operand6 };
    case ORDER_WOR:
      return { raw: word, data15, mnemonic: 'WOR', orderCode9: order, operand6, channel: operand6 };
    case ORDER_RXOR:
      return { raw: word, data15, mnemonic: 'RXOR', orderCode9: order, operand6, channel: operand6 };
    default:
      return { raw: word, data15, mnemonic: '???', orderCode9: order, operand6 };
  }
}

export function operand6FromData15(data15: AgcData15): number {
  return mask15(data15) & 0o77;
}

export function encodeOrderOperand(orderCode9: number, operand6: number): AgcData15 {
  return mask15(((orderCode9 & 0o777) << 6) | (operand6 & 0o77));
}

// Instruction encoders

export function encodeTC(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_TC, address);
}

export function encodeCCS(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_CCS, address);
}

export function encodeTCF(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_TCF, address);
}

export function encodeCA(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_CA, address);
}

export function encodeCS(address: number): AgcData15 {
  return mask15((0o040 << 6) | (address & 0o77)); // CS uses different encoding
}

export function encodeAD(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_AD, address);
}

export function encodeMSK(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_MSK, address);
}

export function encodeNDX(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_NDX, address);
}

export function encodeTS(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_TS, address);
}

export function encodeXCH(address: number): AgcData15 {
  return encodeOrderOperand(ORDER_XCH, address);
}

export function encodeREAD(channel: number): AgcData15 {
  return encodeOrderOperand(ORDER_READ, channel);
}

export function encodeWRITE(channel: number): AgcData15 {
  return encodeOrderOperand(ORDER_WRITE, channel);
}

export function encodeRAND(channel: number): AgcData15 {
  return encodeOrderOperand(ORDER_RAND, channel);
}

export function encodeWAND(channel: number): AgcData15 {
  return encodeOrderOperand(ORDER_WAND, channel);
}

export function encodeROR(channel: number): AgcData15 {
  return encodeOrderOperand(ORDER_ROR, channel);
}

export function encodeWOR(channel: number): AgcData15 {
  return encodeOrderOperand(ORDER_WOR, channel);
}

export function encodeRXOR(channel: number): AgcData15 {
  return encodeOrderOperand(ORDER_RXOR, channel);
}
