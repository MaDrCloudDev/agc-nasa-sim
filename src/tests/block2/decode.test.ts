import { describe, it, expect } from 'vitest';
import {
  encodeTC,
  encodeCCS,
  encodeTCF,
  encodeCA,
  encodeAD,
  encodeMSK,
  encodeNDX,
  encodeTS,
  encodeXCH,
  encodeREAD,
  encodeWRITE,
  encodeRAND,
  encodeWAND,
  encodeROR,
  encodeWOR,
  encodeRXOR,
  SPECIAL_EXTEND,
  decodeBlock2Instruction,
} from '../../core/block2/decoder.js';
import { makeWordWithOddParity } from '../../core/block2/word.js';

describe('block2/decoder', () => {
  it('decodes special instructions by full 15-bit code', () => {
    const state = { extended: false };
    const w = makeWordWithOddParity(SPECIAL_EXTEND);
    expect(decodeBlock2Instruction(w, state).mnemonic).toBe('EXTEND');
  });

  it('decodes regular code instructions (TC, CCS, TCF, CA, AD, MSK)', () => {
    const state = { extended: false };

    // Use 6-bit addresses (0-63)
    const tc = makeWordWithOddParity(encodeTC(0o34));
    expect(decodeBlock2Instruction(tc, state).mnemonic).toBe('TC');

    const ccs = makeWordWithOddParity(encodeCCS(0o56));
    expect(decodeBlock2Instruction(ccs, state).mnemonic).toBe('CCS');

    const tcf = makeWordWithOddParity(encodeTCF(0o45));
    expect(decodeBlock2Instruction(tcf, state).mnemonic).toBe('TCF');

    const ca = makeWordWithOddParity(encodeCA(0o77));
    expect(decodeBlock2Instruction(ca, state).mnemonic).toBe('CA');

    const ad = makeWordWithOddParity(encodeAD(0o77));
    expect(decodeBlock2Instruction(ad, state).mnemonic).toBe('AD');

    const msk = makeWordWithOddParity(encodeMSK(0o77));
    expect(decodeBlock2Instruction(msk, state).mnemonic).toBe('MSK');
  });

  it('decodes quarter code instructions (NDX, TS, XCH)', () => {
    const state = { extended: false };

    const ndx = makeWordWithOddParity(encodeNDX(0o34));
    expect(decodeBlock2Instruction(ndx, state).mnemonic).toBe('NDXE');

    const ts = makeWordWithOddParity(encodeTS(0o77));
    expect(decodeBlock2Instruction(ts, state).mnemonic).toBe('TS');

    const xch = makeWordWithOddParity(encodeXCH(0o56));
    expect(decodeBlock2Instruction(xch, state).mnemonic).toBe('XCH');
  });

  it('decodes eighth code I/O instructions', () => {
    const state = { extended: false };

    const read = makeWordWithOddParity(encodeREAD(0o77));
    expect(decodeBlock2Instruction(read, state).mnemonic).toBe('READ');

    const write = makeWordWithOddParity(encodeWRITE(0o11));
    expect(decodeBlock2Instruction(write, state).mnemonic).toBe('WRITE');

    const rand = makeWordWithOddParity(encodeRAND(0o03));
    expect(decodeBlock2Instruction(rand, state).mnemonic).toBe('RAND');

    const wand = makeWordWithOddParity(encodeWAND(0o02));
    expect(decodeBlock2Instruction(wand, state).mnemonic).toBe('WAND');

    const ror = makeWordWithOddParity(encodeROR(0o05));
    expect(decodeBlock2Instruction(ror, state).mnemonic).toBe('ROR');

    const wor = makeWordWithOddParity(encodeWOR(0o06));
    expect(decodeBlock2Instruction(wor, state).mnemonic).toBe('WOR');

    const rxor = makeWordWithOddParity(encodeRXOR(0o07));
    expect(decodeBlock2Instruction(rxor, state).mnemonic).toBe('RXOR');
  });

  it('NDX decodes as NDXE vs NDXK depending on EXTEND state', () => {
    const w = makeWordWithOddParity(encodeNDX(0o34));
    expect(decodeBlock2Instruction(w, { extended: false }).mnemonic).toBe('NDXE');
    expect(decodeBlock2Instruction(w, { extended: true }).mnemonic).toBe('NDXK');
  });

  it('extracts addresses correctly from instruction formats', () => {
    const state = { extended: false };

    // All instructions use 6-bit operands
    const tc = makeWordWithOddParity(encodeTC(0o54));
    const tcDec = decodeBlock2Instruction(tc, state);
    expect(tcDec.address).toBe(0o54);

    const ndx = makeWordWithOddParity(encodeNDX(0o34));
    const ndxDec = decodeBlock2Instruction(ndx, state);
    expect(ndxDec.address).toBe(0o34);

    const read = makeWordWithOddParity(encodeREAD(0o77));
    const readDec = decodeBlock2Instruction(read, state);
    expect(readDec.channel).toBe(0o77);
  });
});
