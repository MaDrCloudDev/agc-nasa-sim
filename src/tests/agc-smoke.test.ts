import { describe, it, expect } from 'vitest';
import { AgcCpu } from '../core/cpu.js';

const COUNTER = [
  0, 1,
  0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  0x1000, 0x3001, 0x7016, 0x2000, 0x500c,
  0xa000,
];

function loadCounter(cpu: AgcCpu): void {
  cpu.loadProgram({
    name: 'counter',
    startAddress: 0,
    entryPoint: 12,
    words: COUNTER,
  });
}

describe('AgcCpu smoke counter program', () => {
  it('loads the counter program at the expected addresses', () => {
    const cpu = new AgcCpu();
    loadCounter(cpu);

    expect(cpu.memory.read(0)).toBe(0);
    expect(cpu.memory.read(1)).toBe(1);
    expect(cpu.memory.read(12)).toBe(0x1000);
    expect(cpu.memory.read(13)).toBe(0x3001);
    expect(cpu.memory.read(14)).toBe(0x7016);
    expect(cpu.memory.read(15)).toBe(0x2000);
    expect(cpu.memory.read(16)).toBe(0x500c);
    expect(cpu.memory.read(17)).toBe(0xa000);
    expect(cpu.pc).toBe(12);
  });

  it('steps through one full increment cycle and stores the result', () => {
    const cpu = new AgcCpu();
    loadCounter(cpu);

    cpu.step(); // LOAD 0
    expect(cpu.acc).toBe(0);
    expect(cpu.pc).toBe(13);

    cpu.step(); // ADD 1
    expect(cpu.acc).toBe(1);
    expect(cpu.pc).toBe(14);

    cpu.step(); // JN 22, not taken for positive ACC
    expect(cpu.pc).toBe(15);

    cpu.step(); // STORE 0
    expect(cpu.memory.read(0)).toBe(1);
    expect(cpu.pc).toBe(16);

    cpu.step(); // JMP 12
    expect(cpu.pc).toBe(12);
    expect(cpu.trace).toHaveLength(5);
  });
});
