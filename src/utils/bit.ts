const WORD_MASK = 0xFFFF;
const SIGN_BIT = 0x8000;

export function mask16(value: number): number {
  return value & WORD_MASK;
}

export function toSigned16(value: number): number {
  const masked = mask16(value);
  return (masked & SIGN_BIT) ? masked - 0x10000 : masked;
}

export function normalizeWord(value: number): number {
  return mask16(value);
}
