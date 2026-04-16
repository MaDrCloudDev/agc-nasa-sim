import { describe, it, expect } from 'vitest';
import { AgcBlock2Cpu } from '../../core/block2/cpu.js';
import {
  encodeREAD,
  encodeWRITE,
  encodeRAND,
  encodeWAND,
  encodeROR,
  encodeWOR,
  encodeRXOR,
} from '../../core/block2/decoder.js';
import { mask15 } from '../../core/block2/word.js';

function prog(words15: number[]) {
  return { name: 'io', startAddress: 0o2000, entryPoint: 0o2000, words: words15 };
}

describe('block2/io channel instructions', () => {
  it('READ loads A from a channel', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.writeChannel(0o10, 0o12345);
    cpu.loadProgram(prog([encodeREAD(0o10)]));
    cpu.step();
    expect(cpu.a).toBe(0o12345);
  });

  it('WRITE stores A to a channel', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.a = 0o22222;
    cpu.loadProgram(prog([encodeWRITE(0o10)]));
    cpu.step();
    expect(cpu.readChannel(0o10)).toBe(0o22222);
  });

  it('RAND/ROR/RXOR combine A with channel on read side', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.writeChannel(0o10, 0o00077);
    cpu.a = 0o00123;
    cpu.loadProgram(prog([
      encodeRAND(0o10),
      encodeROR(0o10),
      encodeRXOR(0o10),
    ]));
    cpu.step();
    expect(cpu.a).toBe(mask15(0o00123 & 0o00077));
    cpu.step();
    expect(cpu.a).toBe(mask15((0o00123 & 0o00077) | 0o00077));
    cpu.step();
    expect(cpu.a).toBe(mask15(mask15((0o00123 & 0o00077) | 0o00077) ^ 0o00077));
  });

  it('WAND/WOR modify a channel on write side', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.writeChannel(0o10, 0o00077);
    cpu.a = 0o00123;
    cpu.loadProgram(prog([
      encodeWAND(0o10),
      encodeWOR(0o10),
    ]));
    cpu.step();
    expect(cpu.readChannel(0o10)).toBe(mask15(0o00077 & 0o00123));
    cpu.step();
    expect(cpu.readChannel(0o10)).toBe(mask15(mask15(0o00077 & 0o00123) | 0o00123));
  });

  it('channel 01/02 map to L and Q', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.l = 0o12345;
    cpu.q = 0o22222;
    cpu.loadProgram(prog([
      encodeREAD(0o01),
      encodeREAD(0o02),
      encodeWRITE(0o01),
      encodeWRITE(0o02),
    ]));
    cpu.step();
    expect(cpu.a).toBe(0o12345);
    cpu.step();
    expect(cpu.a).toBe(0o22222);
    cpu.a = 0o11111;
    cpu.step();
    expect(cpu.l).toBe(0o11111);
    cpu.a = 0o33333;
    cpu.step();
    expect(cpu.q).toBe(0o33333);
  });
});
