import { describe, it, expect } from 'vitest';
import { AgcBlock2Cpu } from '../core/block2/cpu.js';

describe('block2/cpu skeleton', () => {
  it('resets to zero state', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.a = 123;
    cpu.z = 0o1234;
    cpu.cycleCount = 10;
    cpu.reset();
    expect(cpu.a).toBe(0);
    expect(cpu.z).toBe(0);
    expect(cpu.cycleCount).toBe(0);
    expect(cpu.halted).toBe(false);
  });

  it('loads a program and sets Z to entry point', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.loadProgram({
      name: 'test',
      startAddress: 0o2000,
      entryPoint: 0o2000,
      words: [0],
    });
    expect(cpu.z).toBe(0o2000);
  });

  it('step advances Z and records trace', () => {
    const cpu = new AgcBlock2Cpu();
    cpu.loadProgram({
      name: 'nop',
      startAddress: 0o2000,
      entryPoint: 0o2000,
      // Use a word that does not map to a defined order code in our subset, so it executes as NOP.
      words: [0o77777, 0o77777],
    });
    cpu.step();
    expect(cpu.z).toBe(0o2001);
    expect(cpu.trace.length).toBe(1);
    expect(cpu.trace[0]!.mnemonic).toBe('???');
  });
});

