import { describe, it, expect } from 'vitest';
import { mask16, toSigned16, normalizeWord } from '../utils/bit.js';

describe('mask16', () => {
  it('returns value unchanged when within 16 bits', () => {
    expect(mask16(0)).toBe(0);
    expect(mask16(100)).toBe(100);
    expect(mask16(0xFFFF)).toBe(0xFFFF);
  });

  it('masks values larger than 16 bits', () => {
    expect(mask16(0x10000)).toBe(0);
    expect(mask16(0x1FFFF)).toBe(0xFFFF);
    expect(mask16(0xABCD1234)).toBe(0x1234);
  });

  it('handles negative values', () => {
    expect(mask16(-1)).toBe(0xFFFF);
    expect(mask16(-2)).toBe(0xFFFE);
  });
});

describe('toSigned16', () => {
  it('returns positive values unchanged', () => {
    expect(toSigned16(0)).toBe(0);
    expect(toSigned16(100)).toBe(100);
    expect(toSigned16(0x7FFF)).toBe(32767);
  });

  it('interprets high bit as negative', () => {
    expect(toSigned16(0x8000)).toBe(-32768);
    expect(toSigned16(0xFFFF)).toBe(-1);
    expect(toSigned16(0xFFFE)).toBe(-2);
  });

  it('masks input before interpreting', () => {
    expect(toSigned16(0x18000)).toBe(-32768);
  });
});

describe('normalizeWord', () => {
  it('returns value as 16-bit unsigned', () => {
    expect(normalizeWord(0)).toBe(0);
    expect(normalizeWord(0xFFFF)).toBe(0xFFFF);
    expect(normalizeWord(0x10000)).toBe(0);
    expect(normalizeWord(-1)).toBe(0xFFFF);
  });
});
