import { describe, it, expect, beforeEach } from 'vitest';
import { AgcCpu } from '../core/cpu.js';
import type { ProgramData } from '../core/types.js';

const NAMES = ['NOP','LOAD','STORE','ADD','SUB','JMP','JZ','JN','IN','OUT','HALT'];

function decode(word: number): { opcode: number; name: string; operand: number } {
  const opcode = (word >> 12) & 0xF;
  return { opcode, name: NAMES[opcode] || '???', operand: word & 0xFFF };
}

describe('Program Validation', () => {
  function validateProgram(program: ProgramData): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    if (!program.name) errors.push('Missing name');
    if (typeof program.startAddress !== 'number') errors.push('Missing startAddress');
    if (typeof program.entryPoint !== 'number') errors.push('Missing entryPoint');
    if (!Array.isArray(program.words)) errors.push('Missing words array');
    
    if (errors.length > 0) return { valid: false, errors };
    
    // Check each word is a valid instruction or data
    const instructions: number[] = [];
    const dataStart = program.words.findIndex(w => (w >> 12) === 0 || w > 0xA000);
    
    for (let i = 0; i < program.words.length; i++) {
      const word = program.words[i]!;
      const decoded = decode(word);
      
      if (decoded.opcode > 0xA) {
        errors.push(`Word ${i}: Invalid opcode ${decoded.opcode}`);
      }
    }
    
    return { valid: errors.length === 0, errors };
  }
  
  function runProgram(program: ProgramData, maxCycles: number = 10000): { 
    halted: boolean; 
    cycles: number; 
    error?: string 
  } {
    try {
      const cpu = new AgcCpu();
      cpu.loadProgram(program);
      
      for (let i = 0; i < maxCycles; i++) {
        if (cpu.halted) break;
        cpu.step();
      }
      
      return { halted: cpu.halted, cycles: cpu.cycleCount };
    } catch (e) {
      return { halted: false, cycles: 0, error: (e as Error).message };
    }
  }

  describe('validateProgram', () => {
    it('validates correct counter program', () => {
      const result = validateProgram({
        name: 'counter',
        startAddress: 0,
        entryPoint: 0,
        words: [0x1007, 0x3008, 0x2007, 0x4009, 0x6006, 0x5000, 0xA000, 0, 1, 100]
      });
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('rejects missing name', () => {
      const result = validateProgram({
        startAddress: 0,
        entryPoint: 0,
        words: [0x1007]
      } as ProgramData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing name');
    });
    
    it('rejects missing words', () => {
      const result = validateProgram({
        name: 'test',
        startAddress: 0,
        entryPoint: 0,
      } as ProgramData);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Missing words array');
    });
  });

  describe('runProgram', () => {
    it('runs and halts counter program', () => {
      const result = runProgram({
        name: 'counter',
        startAddress: 0,
        entryPoint: 0,
        words: [0x1007, 0x3008, 0x2007, 0x4009, 0x6006, 0x5000, 0xA000, 0, 1, 100]
      });
      expect(result.error).toBeUndefined();
      expect(result.halted).toBe(true);
    });
    
    it('detects invalid opcode errors', () => {
      // Program that jumps to data address containing 0xFxxx
      const result = runProgram({
        name: 'broken',
        startAddress: 0,
        entryPoint: 0,
        words: [0x5003, 0, 0, 0xF000] // JMP 3 jumps to data 0xF000 (invalid opcode)
      });
      expect(result.error).toContain('Invalid opcode');
    });
    
    it('detects infinite loops', () => {
      // Program that never halts
      const result = runProgram({
        name: 'infinite',
        startAddress: 0,
        entryPoint: 0,
        words: [0x5000, 0, 0, 0] // JMP 0 forever
      }, 1000);
      expect(result.halted).toBe(false);
      expect(result.error).toBeUndefined(); // No error, just didn't halt
    });
  });

  describe('Demo programs must halt', () => {
    // Load and test actual demo programs
    it('counter-demo halts within reasonable time', async () => {
      const counterDemo = (await import('../programs/counter-demo.json')).default;
      const result = runProgram(counterDemo, 2000);
      expect(result.error).toBeUndefined();
      expect(result.halted).toBe(true);
      expect(result.cycles).toBeLessThan(2000);
    });
    
    it('loop-demo halts within reasonable time', async () => {
      const loopDemo = (await import('../programs/loop-demo.json')).default;
      const result = runProgram(loopDemo, 2000);
      expect(result.error).toBeUndefined();
      expect(result.halted).toBe(true);
      expect(result.cycles).toBeLessThan(2000);
    });
  });
});
