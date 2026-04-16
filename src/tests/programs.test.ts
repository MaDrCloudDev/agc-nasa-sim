import { describe, it, expect } from 'vitest';
import { AgcBlock2Cpu } from '../core/block2/cpu.js';
import type { ProgramData } from '../core/types.js';
import block2KeyEcho from '../programs/block2-key-echo.json';

function validateProgram(program: ProgramData): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!program.name) errors.push('Missing name');
  if (!Number.isInteger(program.startAddress) || program.startAddress < 0) {
    errors.push('Invalid startAddress');
  }
  if (!Number.isInteger(program.entryPoint) || program.entryPoint < 0) {
    errors.push('Invalid entryPoint');
  }
  if (!Array.isArray(program.words) || program.words.length === 0) {
    errors.push('Missing words array');
  }

  for (const [index, word] of program.words.entries()) {
    if (!Number.isInteger(word) || word < 0 || word > 0o77777) {
      errors.push(`Word ${index}: out of 15-bit range`);
    }
  }

  return { valid: errors.length === 0, errors };
}

describe('Block II program data', () => {
  it('validates the app demo program shape', () => {
    const result = validateProgram(block2KeyEcho as ProgramData);

    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects malformed program data', () => {
    const result = validateProgram({
      name: '',
      startAddress: -1,
      entryPoint: -1,
      words: [0o100000],
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toContain('Missing name');
    expect(result.errors).toContain('Invalid startAddress');
    expect(result.errors).toContain('Invalid entryPoint');
    expect(result.errors).toContain('Word 0: out of 15-bit range');
  });

  it('executes several demo cycles without throwing and updates output', () => {
    const cpu = new AgcBlock2Cpu();

    cpu.writeChannel(0o10, 0o12);
    cpu.loadProgram(block2KeyEcho as ProgramData);

    for (let i = 0; i < 6; i++) {
      cpu.step();
    }

    expect(cpu.trace).toHaveLength(6);
    expect(cpu.readChannel(0o11)).toBe(0o12);
    expect(cpu.halted).toBe(false);
    expect(cpu.pc).toBe(0o106);
  });
});
