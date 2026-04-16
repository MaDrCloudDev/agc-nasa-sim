import { describe, it, expect } from 'vitest';
import {
  DATA15_MASK,
  addOnesComplement15,
  hasValidOddParity,
  isNegativeZero15,
  isZero15,
  makeWordWithOddParity,
  mask15,
  oddParityBitForData15,
  onesComplementNegate15,
  subOnesComplement15,
  toOctal5,
  toSignedIntFromData15,
} from '../core/block2/word.js';

describe('block2/word', () => {
  it('mask15 keeps only 15 bits', () => {
    expect(mask15(0)).toBe(0);
    expect(mask15(DATA15_MASK)).toBe(DATA15_MASK);
    expect(mask15(0xffff)).toBe(DATA15_MASK);
  });

  it('odd parity bit makes total ones odd', () => {
    const d0 = 0;
    const p0 = oddParityBitForData15(d0);
    expect(p0).toBe(1);
    const w0 = makeWordWithOddParity(d0);
    expect(hasValidOddParity(w0)).toBe(true);

    const d = 0b1010_1010_1010_101; // 15 bits-ish
    const w = makeWordWithOddParity(d);
    expect(hasValidOddParity(w)).toBe(true);
  });

  it('represents and detects negative zero', () => {
    expect(isNegativeZero15(DATA15_MASK)).toBe(true);
    expect(isZero15(DATA15_MASK)).toBe(true);
    expect(isZero15(0)).toBe(true);
  });

  it('1’s complement negate flips 15 data bits', () => {
    expect(onesComplementNegate15(0)).toBe(DATA15_MASK);
    expect(onesComplementNegate15(DATA15_MASK)).toBe(0);
    expect(onesComplementNegate15(0o00001)).toBe(0o77776);
  });

  it('end-around carry addition works', () => {
    // 0o77777 is -0 in 1's complement; (-0) + 1 => 1
    expect(addOnesComplement15(0o77777, 0o00001)).toBe(1);
    // Simple
    expect(addOnesComplement15(1, 1)).toBe(2);
  });

  it('subtraction is add with ones-complement negation', () => {
    expect(subOnesComplement15(5, 3)).toBe(2);
    expect(subOnesComplement15(0, 1)).toBe(onesComplementNegate15(1));
  });

  it('signed interpretation maps -0 to 0 and negatives via ones complement', () => {
    expect(toSignedIntFromData15(0)).toBe(0);
    expect(toSignedIntFromData15(DATA15_MASK)).toBe(0);
    expect(toSignedIntFromData15(0o00012)).toBe(10);
    expect(toSignedIntFromData15(onesComplementNegate15(0o00012))).toBe(-10);
  });

  it('octal formatting is 5 digits', () => {
    expect(toOctal5(0)).toBe('00000');
    expect(toOctal5(0o7)).toBe('00007');
    expect(toOctal5(0o77777)).toBe('77777');
  });
});

