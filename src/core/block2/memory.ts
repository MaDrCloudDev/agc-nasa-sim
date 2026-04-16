import { InvalidMemoryAccess, WriteToFixedMemory } from '../types.js';
import { makeWordWithOddParity, type AgcWord16 } from './word.js';

// Block II (simplified) memory map:
// - Erasable (E) memory: 0000-1777 (octal) => 2048 words
// - Fixed (F) memory bank window: 2000-3777 (octal) => 2048 words, selected by FB
// This is intentionally incomplete but shaped correctly for incremental accuracy.

export const ERASABLE_SIZE = 0o2000; // 2048
export const BANK_WINDOW_BASE = 0o2000;
export const BANK_WINDOW_SIZE = 0o2000; // 2048

export class Block2Memory {
  readonly erasable: Uint16Array;
  readonly fixedBanks: Uint16Array[];

  constructor(fixedBankCount: number = 1) {
    this.erasable = new Uint16Array(ERASABLE_SIZE);
    this.fixedBanks = Array.from({ length: fixedBankCount }, () => new Uint16Array(BANK_WINDOW_SIZE));
  }

  read(address: number, fb: number = 0): AgcWord16 {
    if (address < 0) throw new InvalidMemoryAccess(address, ERASABLE_SIZE);

    if (address < ERASABLE_SIZE) {
      return this.erasable[address]!;
    }

    if (address >= BANK_WINDOW_BASE && address < BANK_WINDOW_BASE + BANK_WINDOW_SIZE) {
      const bank = this.fixedBanks[fb] ?? this.fixedBanks[0]!;
      return bank[address - BANK_WINDOW_BASE]!;
    }

    throw new InvalidMemoryAccess(address, BANK_WINDOW_BASE + BANK_WINDOW_SIZE);
  }

  write(address: number, value: number): void {
    if (address < 0) throw new InvalidMemoryAccess(address, ERASABLE_SIZE);
    if (address < ERASABLE_SIZE) {
      this.erasable[address] = makeWordWithOddParity(value) & 0xffff;
      return;
    }
    if (address >= BANK_WINDOW_BASE && address < BANK_WINDOW_BASE + BANK_WINDOW_SIZE) {
      throw new WriteToFixedMemory(address);
    }
    throw new InvalidMemoryAccess(address, BANK_WINDOW_BASE + BANK_WINDOW_SIZE);
  }

  load(address: number, words: number[], fb: number = 0): void {
    for (let i = 0; i < words.length; i++) {
      const a = address + i;
      if (a < ERASABLE_SIZE) {
        this.erasable[a] = makeWordWithOddParity(words[i]!) & 0xffff;
      } else if (a >= BANK_WINDOW_BASE && a < BANK_WINDOW_BASE + BANK_WINDOW_SIZE) {
        const bank = this.fixedBanks[fb] ?? this.fixedBanks[0]!;
        bank[a - BANK_WINDOW_BASE] = makeWordWithOddParity(words[i]!) & 0xffff;
      } else {
        throw new InvalidMemoryAccess(a, BANK_WINDOW_BASE + BANK_WINDOW_SIZE);
      }
    }
  }

  dumpErasable(): Uint16Array {
    return new Uint16Array(this.erasable);
  }

  dumpFixedBank0(): Uint16Array {
    return new Uint16Array(this.fixedBanks[0] ?? new Uint16Array(BANK_WINDOW_SIZE));
  }
}

