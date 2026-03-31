import { describe, it, expect } from 'vitest';
import { Memory } from '../core/memory.js';
import { InvalidMemoryAccess } from '../core/types.js';

describe('Memory', () => {
  it('creates memory of given size', () => {
    const mem = new Memory(100);
    expect(mem.size).toBe(100);
  });

  it('creates memory with default size', () => {
    const mem = new Memory();
    expect(mem.size).toBe(4096);
  });

  it('reads initial zero values', () => {
    const mem = new Memory(10);
    expect(mem.read(0)).toBe(0);
    expect(mem.read(5)).toBe(0);
    expect(mem.read(9)).toBe(0);
  });

  it('writes and reads values', () => {
    const mem = new Memory(100);
    mem.write(0, 42);
    expect(mem.read(0)).toBe(42);
    mem.write(50, 0xFFFF);
    expect(mem.read(50)).toBe(0xFFFF);
  });

  it('normalizes values to 16-bit unsigned on write', () => {
    const mem = new Memory(10);
    mem.write(0, 0x12345);
    expect(mem.read(0)).toBe(0x2345);
    mem.write(1, -1);
    expect(mem.read(1)).toBe(0xFFFF);
  });

  it('throws on out-of-bounds read', () => {
    const mem = new Memory(10);
    expect(() => mem.read(10)).toThrow(InvalidMemoryAccess);
    expect(() => mem.read(-1)).toThrow(InvalidMemoryAccess);
  });

  it('throws on out-of-bounds write', () => {
    const mem = new Memory(10);
    expect(() => mem.write(10, 0)).toThrow(InvalidMemoryAccess);
    expect(() => mem.write(-1, 0)).toThrow(InvalidMemoryAccess);
  });

  it('loads program words at start address', () => {
    const mem = new Memory(100);
    mem.load(5, [100, 200, 300]);
    expect(mem.read(5)).toBe(100);
    expect(mem.read(6)).toBe(200);
    expect(mem.read(7)).toBe(300);
  });

  it('normalizes values during load', () => {
    const mem = new Memory(100);
    mem.load(0, [0x10000, -1]);
    expect(mem.read(0)).toBe(0);
    expect(mem.read(1)).toBe(0xFFFF);
  });

  it('dumps a range of memory', () => {
    const mem = new Memory(100);
    mem.write(0, 10);
    mem.write(1, 20);
    mem.write(2, 30);
    const dump = mem.dump(0, 3);
    expect(dump).toEqual([10, 20, 30]);
  });

  it('throws on invalid dump range', () => {
    const mem = new Memory(10);
    expect(() => mem.dump(5, 3)).toThrow(InvalidMemoryAccess);
    expect(() => mem.dump(-1, 5)).toThrow(InvalidMemoryAccess);
    expect(() => mem.dump(0, 11)).toThrow(InvalidMemoryAccess);
  });
});
