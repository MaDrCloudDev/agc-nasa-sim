import type { AgcData15 } from './word.js';
import { mask15 } from './word.js';

export class Block2Io {
  private channels = new Map<number, AgcData15>();

  read(ch: number): AgcData15 {
    return this.channels.get(ch) ?? 0;
  }

  write(ch: number, value: AgcData15): void {
    this.channels.set(ch, mask15(value));
  }

  reset(): void {
    this.channels.clear();
  }

  // Helpers for write-modify operations
  writeAnd(ch: number, value: AgcData15): void {
    this.write(ch, this.read(ch) & mask15(value));
  }

  writeOr(ch: number, value: AgcData15): void {
    this.write(ch, this.read(ch) | mask15(value));
  }
}

