// AGC Block II word model:
// 15 data bits plus an odd-parity bit stored alongside the word in memory.

export type AgcData15 = number; // 0..0x7FFF
export type AgcWord16 = number; // 0..0xFFFF (includes parity bit)

export const DATA15_MASK = 0x7fff;
export const PARITY_BIT_MASK = 0x8000;
export const SIGN15_MASK = 0x4000;

export function mask15(x: number): AgcData15 {
  return x & DATA15_MASK;
}

export function data15FromWord(word: AgcWord16): AgcData15 {
  return word & DATA15_MASK;
}

export function parityBitFromWord(word: AgcWord16): 0 | 1 {
  return ((word & PARITY_BIT_MASK) >>> 15) as 0 | 1;
}

function popcount16(x: number): number {
  let v = x & 0xffff;
  let c = 0;
  while (v) {
    v &= v - 1;
    c++;
  }
  return c;
}

export function oddParityBitForData15(data15: AgcData15): 0 | 1 {
  const d = mask15(data15);
  const ones = popcount16(d); // parity bit currently 0
  // Want total ones (including parity bit) to be odd.
  return (ones % 2 === 0 ? 1 : 0) as 0 | 1;
}

export function makeWordWithOddParity(data15: AgcData15): AgcWord16 {
  const d = mask15(data15);
  const p = oddParityBitForData15(d);
  return (d | (p ? PARITY_BIT_MASK : 0)) & 0xffff;
}

export function hasValidOddParity(word: AgcWord16): boolean {
  const w = word & 0xffff;
  return popcount16(w) % 2 === 1;
}

export function isNegativeZero15(x: AgcData15): boolean {
  return mask15(x) === DATA15_MASK; // all ones
}

export function isZero15(x: AgcData15): boolean {
  const v = mask15(x);
  return v === 0 || v === DATA15_MASK;
}

export function onesComplementNegate15(x: AgcData15): AgcData15 {
  return mask15(~mask15(x));
}

export function addOnesComplement15(a: AgcData15, b: AgcData15): AgcData15 {
  const sum = mask15(a) + mask15(b);
  const carry = sum >>> 15;
  const low = sum & DATA15_MASK;
  // End-around carry: add carry back into low bits.
  return mask15(low + carry);
}

export function subOnesComplement15(a: AgcData15, b: AgcData15): AgcData15 {
  return addOnesComplement15(a, onesComplementNegate15(b));
}

export function toSignedIntFromData15(x: AgcData15): number {
  const v = mask15(x);
  if (v === DATA15_MASK) return 0; // -0 shown as 0 for JS signed interpretation
  if ((v & SIGN15_MASK) === 0) return v;
  // 1's complement negative: value = -((~v) & mask)
  const mag = mask15(~v);
  return -mag;
}

export function toOctal5(x: AgcData15): string {
  return mask15(x).toString(8).toUpperCase().padStart(5, '0');
}

