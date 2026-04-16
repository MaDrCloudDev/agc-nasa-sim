import { describe, it, expect } from 'vitest';
import {
  BANK_WINDOW_BASE,
  BANK_WINDOW_SIZE,
  Block2Memory,
  ERASABLE_SIZE,
} from '../core/block2/memory.js';
import { data15FromWord } from '../core/block2/word.js';
import { InvalidMemoryAccess, WriteToFixedMemory } from '../core/types.js';

describe('block2/memory', () => {
  it('starts with zeroed erasable and fixed memory', () => {
    const mem = new Block2Memory();

    expect(mem.read(0o0, 0)).toBe(0);
    expect(mem.read(BANK_WINDOW_BASE, 0)).toBe(0);
  });

  it('writes erasable words with regenerated parity', () => {
    const mem = new Block2Memory();

    mem.write(0o10, 0o12345);

    expect(data15FromWord(mem.read(0o10, 0))).toBe(0o12345);
  });

  it('loads fixed-bank words into the bank window', () => {
    const mem = new Block2Memory();

    mem.load(BANK_WINDOW_BASE, [0o1, 0o2, 0o3], 0);

    expect(data15FromWord(mem.read(BANK_WINDOW_BASE + 0, 0))).toBe(0o1);
    expect(data15FromWord(mem.read(BANK_WINDOW_BASE + 1, 0))).toBe(0o2);
    expect(data15FromWord(mem.read(BANK_WINDOW_BASE + 2, 0))).toBe(0o3);
  });

  it('rejects direct writes to fixed memory', () => {
    const mem = new Block2Memory();

    expect(() => mem.write(BANK_WINDOW_BASE, 1)).toThrow(WriteToFixedMemory);
  });

  it('throws on invalid addresses', () => {
    const mem = new Block2Memory();

    expect(() => mem.read(-1, 0)).toThrow(InvalidMemoryAccess);
    expect(() => mem.read(BANK_WINDOW_BASE + BANK_WINDOW_SIZE, 0)).toThrow(InvalidMemoryAccess);
    expect(() => mem.write(ERASABLE_SIZE + BANK_WINDOW_SIZE, 0)).toThrow(InvalidMemoryAccess);
    expect(() => mem.load(BANK_WINDOW_BASE + BANK_WINDOW_SIZE, [1], 0)).toThrow(InvalidMemoryAccess);
  });
});
