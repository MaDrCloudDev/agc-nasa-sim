import { describe, it, expect } from 'vitest';
import { AgcBlock2Cpu } from '../core/block2/cpu.js';
import { data15FromWord } from '../core/block2/word.js';
import type { ProgramData } from '../core/types.js';
import block2KeyEcho from '../programs/block2-key-echo.json';

describe('Block II demo smoke program', () => {
  it('loads the app demo at the expected fixed-memory addresses', () => {
    const cpu = new AgcBlock2Cpu();
    const program = block2KeyEcho as ProgramData;

    cpu.loadProgram(program);

    expect(cpu.pc).toBe(program.entryPoint);
    expect(data15FromWord(cpu.memory.read(0o100, 0))).toBe(program.words[0]);
    expect(data15FromWord(cpu.memory.read(0o101, 0))).toBe(program.words[1]);
    expect(data15FromWord(cpu.memory.read(0o105, 0))).toBe(program.words[5]);
  });

  it('echoes keyboard input to channel 11 on the first read/write pair', () => {
    const cpu = new AgcBlock2Cpu();

    cpu.writeChannel(0o10, 0o7);
    cpu.loadProgram(block2KeyEcho as ProgramData);

    cpu.step();
    expect(cpu.currentInstruction?.mnemonic).toBe('READ');
    expect(cpu.a).toBe(0o7);
    expect(cpu.pc).toBe(0o101);

    cpu.step();
    expect(cpu.currentInstruction?.mnemonic).toBe('WRITE');
    expect(cpu.readChannel(0o11)).toBe(0o7);
    expect(cpu.pc).toBe(0o102);
    expect(cpu.trace).toHaveLength(2);
    expect(cpu.trace[0]!.address).toBe(0o100);
    expect(cpu.trace[1]!.address).toBe(0o101);
  });
});
