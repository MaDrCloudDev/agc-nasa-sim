import { InvalidMemoryAccess } from './types.js';
import { MEMORY_SIZE } from './constants.js';
import { normalizeWord } from '../utils/bit.js';

export class Memory {
  readonly size: number;
  private data: Uint16Array;

  constructor(size: number = MEMORY_SIZE) {
    this.size = size;
    this.data = new Uint16Array(size);
  }

  read(address: number): number {
    if (address < 0 || address >= this.size) {
      throw new InvalidMemoryAccess(address, this.size);
    }
    return this.data[address]!;
  }

  write(address: number, value: number): void {
    if (address < 0 || address >= this.size) {
      throw new InvalidMemoryAccess(address, this.size);
    }
    this.data[address] = normalizeWord(value);
  }

  load(startAddress: number, words: number[]): void {
    for (let i = 0; i < words.length; i++) {
      this.write(startAddress + i, words[i]!);
    }
  }

  dump(start: number, end: number): number[] {
    if (start < 0 || end > this.size || start > end) {
      throw new InvalidMemoryAccess(start, this.size);
    }
    return Array.from(this.data.slice(start, end));
  }
}
