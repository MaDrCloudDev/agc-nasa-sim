import { describe, it, expect } from 'vitest';
import { decodeInstruction } from '../core/decoder.js';

describe('decodeInstruction', () => {
  it('decodes NOP (0x0000)', () => {
    const d = decodeInstruction(0x0000);
    expect(d.opcode).toBe(0x00);
    expect(d.mnemonic).toBe('NOP');
    expect(d.operand).toBe(0);
    expect(d.raw).toBe(0x0000);
  });

  it('decodes LOAD (0x1042)', () => {
    const d = decodeInstruction(0x1042);
    expect(d.opcode).toBe(0x01);
    expect(d.mnemonic).toBe('LOAD');
    expect(d.operand).toBe(0x042);
    expect(d.raw).toBe(0x1042);
  });

  it('decodes STORE (0x2010)', () => {
    const d = decodeInstruction(0x2010);
    expect(d.opcode).toBe(0x02);
    expect(d.mnemonic).toBe('STORE');
    expect(d.operand).toBe(0x010);
  });

  it('decodes ADD (0x3007)', () => {
    const d = decodeInstruction(0x3007);
    expect(d.opcode).toBe(0x03);
    expect(d.mnemonic).toBe('ADD');
    expect(d.operand).toBe(0x007);
  });

  it('decodes SUB (0x4005)', () => {
    const d = decodeInstruction(0x4005);
    expect(d.opcode).toBe(0x04);
    expect(d.mnemonic).toBe('SUB');
    expect(d.operand).toBe(0x005);
  });

  it('decodes JMP (0x5000)', () => {
    const d = decodeInstruction(0x5000);
    expect(d.opcode).toBe(0x05);
    expect(d.mnemonic).toBe('JMP');
    expect(d.operand).toBe(0x000);
  });

  it('decodes JZ (0x600A)', () => {
    const d = decodeInstruction(0x600A);
    expect(d.opcode).toBe(0x06);
    expect(d.mnemonic).toBe('JZ');
    expect(d.operand).toBe(0x00A);
  });

  it('decodes JN (0x7010)', () => {
    const d = decodeInstruction(0x7010);
    expect(d.opcode).toBe(0x07);
    expect(d.mnemonic).toBe('JN');
    expect(d.operand).toBe(0x010);
  });

  it('decodes IN (0x8001)', () => {
    const d = decodeInstruction(0x8001);
    expect(d.opcode).toBe(0x08);
    expect(d.mnemonic).toBe('IN');
    expect(d.operand).toBe(0x001);
  });

  it('decodes OUT (0x9001)', () => {
    const d = decodeInstruction(0x9001);
    expect(d.opcode).toBe(0x09);
    expect(d.mnemonic).toBe('OUT');
    expect(d.operand).toBe(0x001);
  });

  it('decodes HALT (0xA000)', () => {
    const d = decodeInstruction(0xA000);
    expect(d.opcode).toBe(0x0A);
    expect(d.mnemonic).toBe('HALT');
    expect(d.operand).toBe(0x000);
  });

  it('handles max operand (0xFFF)', () => {
    const d = decodeInstruction(0x1FFF);
    expect(d.opcode).toBe(0x01);
    expect(d.operand).toBe(0xFFF);
  });

  it('handles unknown opcode gracefully', () => {
    const d = decodeInstruction(0xF000);
    expect(d.opcode).toBe(0x0F);
    expect(d.mnemonic).toBe('???');
    expect(d.operand).toBe(0x000);
  });
});
