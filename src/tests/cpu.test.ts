import { describe, it, expect } from 'vitest';
import { AgcCpu } from '../core/cpu.js';
import { HaltedMachineStep, MalformedProgram } from '../core/types.js';

function makeLoad(addr: number): number {
  return (0x01 << 12) | (addr & 0xFFF);
}
function makeStore(addr: number): number {
  return (0x02 << 12) | (addr & 0xFFF);
}
function makeAdd(addr: number): number {
  return (0x03 << 12) | (addr & 0xFFF);
}
function makeSub(addr: number): number {
  return (0x04 << 12) | (addr & 0xFFF);
}
function makeJmp(addr: number): number {
  return (0x05 << 12) | (addr & 0xFFF);
}
function makeJz(addr: number): number {
  return (0x06 << 12) | (addr & 0xFFF);
}
function makeJn(addr: number): number {
  return (0x07 << 12) | (addr & 0xFFF);
}
function makeIn(ch: number): number {
  return (0x08 << 12) | (ch & 0xFFF);
}
function makeOut(ch: number): number {
  return (0x09 << 12) | (ch & 0xFFF);
}
function makeHalt(): number {
  return (0x0A << 12);
}
function makeNop(): number {
  return 0x0000;
}

describe('AgcCpu', () => {
  it('initializes with zero state', () => {
    const cpu = new AgcCpu(16);
    expect(cpu.pc).toBe(0);
    expect(cpu.acc).toBe(0);
    expect(cpu.cycleCount).toBe(0);
    expect(cpu.halted).toBe(false);
    expect(cpu.running).toBe(false);
  });

  it('executes LOAD instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(10, 42);
    cpu.memory.write(0, makeLoad(10));
    cpu.step();
    expect(cpu.acc).toBe(42);
    expect(cpu.pc).toBe(1);
  });

  it('executes STORE instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 99;
    cpu.memory.write(0, makeStore(5));
    cpu.step();
    expect(cpu.memory.read(5)).toBe(99);
    expect(cpu.pc).toBe(1);
  });

  it('executes ADD instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 10;
    cpu.memory.write(5, 25);
    cpu.memory.write(0, makeAdd(5));
    cpu.step();
    expect(cpu.acc).toBe(35);
  });

  it('executes SUB instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 100;
    cpu.memory.write(5, 30);
    cpu.memory.write(0, makeSub(5));
    cpu.step();
    expect(cpu.acc).toBe(70);
  });

  it('masks ADD result to 16 bits', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 0xFFFE;
    cpu.memory.write(5, 0x0003);
    cpu.memory.write(0, makeAdd(5));
    cpu.step();
    expect(cpu.acc).toBe(0x0001);
  });

  it('executes JMP instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeJmp(7));
    cpu.step();
    expect(cpu.pc).toBe(7);
  });

  it('executes JZ taken when ACC is zero', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 0;
    cpu.memory.write(0, makeJz(10));
    cpu.step();
    expect(cpu.pc).toBe(10);
  });

  it('executes JZ not taken when ACC is non-zero', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 5;
    cpu.memory.write(0, makeJz(10));
    cpu.step();
    expect(cpu.pc).toBe(1);
  });

  it('executes JN taken when ACC is negative (signed)', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 0xFFFF; // -1 signed
    cpu.memory.write(0, makeJn(10));
    cpu.step();
    expect(cpu.pc).toBe(10);
  });

  it('executes JN not taken when ACC is positive', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 100;
    cpu.memory.write(0, makeJn(10));
    cpu.step();
    expect(cpu.pc).toBe(1);
  });

  it('executes IN instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.input[3] = 77;
    cpu.memory.write(0, makeIn(3));
    cpu.step();
    expect(cpu.acc).toBe(77);
  });

  it('executes OUT instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 42;
    cpu.memory.write(0, makeOut(1));
    cpu.step();
    expect(cpu.output[1]).toBe(42);
  });

  it('executes NOP (advances PC)', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeNop());
    cpu.step();
    expect(cpu.pc).toBe(1);
    expect(cpu.cycleCount).toBe(1);
  });

  it('halts on HALT instruction', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeHalt());
    cpu.step();
    expect(cpu.halted).toBe(true);
    expect(cpu.running).toBe(false);
  });

  it('throws on step after halt', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeHalt());
    cpu.step();
    expect(() => cpu.step()).toThrow(HaltedMachineStep);
  });

  it('increments cycle count on each step', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeNop());
    cpu.memory.write(1, makeNop());
    cpu.step();
    expect(cpu.cycleCount).toBe(1);
    cpu.step();
    expect(cpu.cycleCount).toBe(2);
  });

  it('resets all state', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 99;
    cpu.pc = 5;
    cpu.cycleCount = 10;
    cpu.input[0] = 1;
    cpu.output[0] = 2;
    cpu.reset();
    expect(cpu.acc).toBe(0);
    expect(cpu.pc).toBe(0);
    expect(cpu.cycleCount).toBe(0);
    expect(cpu.halted).toBe(false);
    expect(cpu.running).toBe(false);
    expect(cpu.input).toEqual({});
    expect(cpu.output).toEqual({});
  });

  it('loadProgram loads words and sets PC', () => {
    const cpu = new AgcCpu(16);
    cpu.loadProgram({
      name: 'test',
      startAddress: 0,
      entryPoint: 0,
      words: [0x1005, 0xA000],
    });
    expect(cpu.memory.read(0)).toBe(0x1005);
    expect(cpu.memory.read(1)).toBe(0xA000);
    expect(cpu.pc).toBe(0);
  });

  it('loadProgram with different entry point', () => {
    const cpu = new AgcCpu(16);
    cpu.loadProgram({
      name: 'test',
      startAddress: 3,
      entryPoint: 3,
      words: [0xA000],
    });
    expect(cpu.memory.read(3)).toBe(0xA000);
    expect(cpu.pc).toBe(3);
  });

  it('rejects malformed program (missing name)', () => {
    const cpu = new AgcCpu(16);
    expect(() => cpu.loadProgram({
      name: '',
      startAddress: 0,
      entryPoint: 0,
      words: [0xA000],
    })).toThrow(MalformedProgram);
  });

  it('rejects malformed program (empty words)', () => {
    const cpu = new AgcCpu(16);
    expect(() => cpu.loadProgram({
      name: 'empty',
      startAddress: 0,
      entryPoint: 0,
      words: [],
    })).toThrow(MalformedProgram);
  });

  it('run() halts when maxSteps exceeded', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeJmp(0)); // infinite loop
    cpu.run(100);
    expect(cpu.halted).toBe(false);
    expect(cpu.cycleCount).toBe(100);
  });

  it('run() stops at HALT before maxSteps', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeNop());
    cpu.memory.write(1, makeNop());
    cpu.memory.write(2, makeHalt());
    cpu.run(10000);
    expect(cpu.halted).toBe(true);
    expect(cpu.cycleCount).toBe(3);
  });

  it('getState returns current state', () => {
    const cpu = new AgcCpu(16);
    cpu.acc = 42;
    cpu.pc = 1;
    const state = cpu.getState();
    expect(state.acc).toBe(42);
    expect(state.pc).toBe(1);
    expect(state.memory).toBeInstanceOf(Uint16Array);
  });

  it('maintains trace log', () => {
    const cpu = new AgcCpu(16);
    cpu.memory.write(0, makeNop());
    cpu.memory.write(1, makeHalt());
    cpu.step();
    cpu.step();
    expect(cpu.trace.length).toBe(2);
    expect(cpu.trace[0]!.mnemonic).toBe('NOP');
    expect(cpu.trace[1]!.mnemonic).toBe('HALT');
  });
});
