import type { ProgramData } from '../core/types.js';
import {
  encodeAD,
  encodeCA,
  encodeCCS,
  encodeNDX,
  encodeREAD,
  encodeTC,
  encodeTS,
  encodeWRITE,
} from '../core/block2/decoder.js';

type Operand = number | string;
type Item =
  | { t: 'label'; name: string }
  | { t: 'inst'; op: string; operand: Operand }
  | { t: 'data'; name: string; value: number };

// Helper to encode instructions
function encodeOp(op: string, operand: number): number {
  switch (op) {
    case 'TC': return encodeTC(operand);
    case 'CCS': return encodeCCS(operand);
    case 'CA': return encodeCA(operand);
    case 'TS': return encodeTS(operand);
    case 'NDX': return encodeNDX(operand);
    case 'AD': return encodeAD(operand);
    case 'READ': return encodeREAD(operand);
    case 'WRITE': return encodeWRITE(operand);
    default: throw new Error(`Unknown op: ${op}`);
  }
}

function assemble(items: Item[]): number[] {
  const labels = new Map<string, number>();
  let pc = 0;

  for (const it of items) {
    if (it.t === 'label') labels.set(it.name, pc);
    else pc++;
  }
  if (pc > 0o100) throw new Error(`Program too large for operand6 machine: ${pc} words`);

  const out: number[] = [];
  for (const it of items) {
    if (it.t === 'label') continue;
    if (it.t === 'data') {
      out.push(it.value);
      continue;
    }
    const operand = typeof it.operand === 'string' ? labels.get(it.operand) : it.operand;
    if (operand === undefined) throw new Error(`Unknown label: ${it.operand}`);
    if (operand < 0 || operand > 0o77) throw new Error(`Operand out of range (needs 0..77): ${operand.toString(8)}`);
    out.push(encodeOp(it.op, operand));
  }
  return out;
}

// Key dispatch:
// We use NDX to patch a TC instruction into a jump table based on keycode.
const items: Item[] = [
  { t: 'label', name: 'loop' },
  { t: 'inst', op: 'READ', operand: 0o10 },      // READ CH10
  { t: 'inst', op: 'TS', operand: 'E_key' },      // TS E_key
  { t: 'inst', op: 'CCS', operand: 'E_key' },     // if key==0 -> skip to loop
  { t: 'inst', op: 'TC', operand: 'dispatch' },
  { t: 'inst', op: 'TC', operand: 'loop' },
  { t: 'inst', op: 'TC', operand: 'dispatch' },
  { t: 'inst', op: 'TC', operand: 'dispatch' },

  { t: 'label', name: 'dispatch' },
  { t: 'inst', op: 'NDX', operand: 'E_key' },
  { t: 'inst', op: 'TC', operand: 'jt0' },         // patched to jt0 + key

  // Jump table entries 0..17 (octal 00..21)
  { t: 'label', name: 'jt0' },
  { t: 'inst', op: 'TC', operand: 'loop' },      // 0 (ignored)
  { t: 'inst', op: 'TC', operand: 'digit' },       // 1
  { t: 'inst', op: 'TC', operand: 'digit' },       // 2
  { t: 'inst', op: 'TC', operand: 'digit' },       // 3
  { t: 'inst', op: 'TC', operand: 'digit' },       // 4
  { t: 'inst', op: 'TC', operand: 'digit' },       // 5
  { t: 'inst', op: 'TC', operand: 'digit' },       // 6
  { t: 'inst', op: 'TC', operand: 'digit' },       // 7
  { t: 'inst', op: 'TC', operand: 'digit' },       // 8
  { t: 'inst', op: 'TC', operand: 'digit' },       // 9
  { t: 'inst', op: 'TC', operand: 'enter' },       // 10 ENTR
  { t: 'inst', op: 'TC', operand: 'pro' },         // 11 PRO
  { t: 'inst', op: 'TC', operand: 'clear' },       // 12 CLR
  { t: 'inst', op: 'TC', operand: 'loop' },        // 13 RSET
  { t: 'inst', op: 'TC', operand: 'verb' },        // 14 VERB
  { t: 'inst', op: 'TC', operand: 'noun' },        // 15 NOUN
  { t: 'inst', op: 'TC', operand: 'loop' },        // 16 KEY REL
  { t: 'inst', op: 'TC', operand: 'digit' },         // 17 '-' treated as digit

  { t: 'label', name: 'digit' },
  { t: 'inst', op: 'CA', operand: 'E_last' },
  { t: 'inst', op: 'TS', operand: 'E_prev' },
  { t: 'inst', op: 'CA', operand: 'E_key' },
  { t: 'inst', op: 'TS', operand: 'E_last' },
  { t: 'inst', op: 'TC', operand: 'loop' },

  { t: 'label', name: 'verb' },
  { t: 'inst', op: 'CA', operand: 'C_1' },
  { t: 'inst', op: 'TS', operand: 'E_state' },
  { t: 'inst', op: 'TC', operand: 'loop' },

  { t: 'label', name: 'noun' },
  { t: 'inst', op: 'CA', operand: 'C_2' },
  { t: 'inst', op: 'TS', operand: 'E_state' },
  { t: 'inst', op: 'TC', operand: 'loop' },

  { t: 'label', name: 'clear' },
  { t: 'inst', op: 'CA', operand: 'C_0' },
  { t: 'inst', op: 'TS', operand: 'E_state' },
  { t: 'inst', op: 'TS', operand: 'E_prev' },
  { t: 'inst', op: 'TS', operand: 'E_last' },
  { t: 'inst', op: 'TS', operand: 'E_verb' },
  { t: 'inst', op: 'TS', operand: 'E_noun' },
  { t: 'inst', op: 'TC', operand: 'loop' },

  { t: 'label', name: 'enter' },
  // tens = prev; ones = last; value = tensTable[tens] + ones
  { t: 'inst', op: 'CA', operand: 'E_prev' },
  { t: 'inst', op: 'TS', operand: 'E_idx' },
  { t: 'inst', op: 'NDX', operand: 'E_idx' },
  { t: 'inst', op: 'CA', operand: 'TENS_0' },    // patched by NDX
  { t: 'inst', op: 'AD', operand: 'E_last' },
  // dispatch by state: 0 ignore, 1 storeVerb, 2 storeNoun
  { t: 'inst', op: 'NDX', operand: 'E_state' },
  { t: 'inst', op: 'TC', operand: 'st0' },       // patched to st0 + state

  { t: 'label', name: 'st0' },
  { t: 'inst', op: 'TC', operand: 'loop' },      // 0
  { t: 'inst', op: 'TC', operand: 'storeVerb' }, // 1
  { t: 'inst', op: 'TC', operand: 'storeNoun' }, // 2

  { t: 'label', name: 'storeVerb' },
  { t: 'inst', op: 'TS', operand: 'E_verb' },
  { t: 'inst', op: 'CA', operand: 'C_0' },
  { t: 'inst', op: 'TS', operand: 'E_state' },
  { t: 'inst', op: 'TC', operand: 'loop' },

  { t: 'label', name: 'storeNoun' },
  { t: 'inst', op: 'TS', operand: 'E_noun' },
  { t: 'inst', op: 'CA', operand: 'C_0' },
  { t: 'inst', op: 'TS', operand: 'E_state' },
  { t: 'inst', op: 'TC', operand: 'loop' },

  { t: 'label', name: 'pro' },
  // Latch displays and compute R1 = VERB + NOUN
  { t: 'inst', op: 'CA', operand: 'E_verb' },
  { t: 'inst', op: 'WRITE', operand: 0o15 },     // CH15 VERB
  { t: 'inst', op: 'CA', operand: 'E_noun' },
  { t: 'inst', op: 'WRITE', operand: 0o16 },     // CH16 NOUN
  { t: 'inst', op: 'CA', operand: 'C_1' },
  { t: 'inst', op: 'WRITE', operand: 0o14 },     // CH14 PROG
  { t: 'inst', op: 'CA', operand: 'E_verb' },
  { t: 'inst', op: 'AD', operand: 'E_noun' },
  { t: 'inst', op: 'WRITE', operand: 0o11 },     // CH11 R1
  { t: 'inst', op: 'TC', operand: 'loop' },

  // Data/constants/table (within operand range 0..77 octal)
  { t: 'label', name: 'E_state' }, { t: 'data', name: 'E_state', value: 0 },
  { t: 'label', name: 'E_prev' },  { t: 'data', name: 'E_prev', value: 0 },
  { t: 'label', name: 'E_last' },  { t: 'data', name: 'E_last', value: 0 },
  { t: 'label', name: 'E_verb' },  { t: 'data', name: 'E_verb', value: 0 },
  { t: 'label', name: 'E_noun' },  { t: 'data', name: 'E_noun', value: 0 },
  { t: 'label', name: 'E_key' },   { t: 'data', name: 'E_key', value: 0 },
  { t: 'label', name: 'E_idx' },   { t: 'data', name: 'E_idx', value: 0 },

  { t: 'label', name: 'C_0' },     { t: 'data', name: 'C_0', value: 0 },
  { t: 'label', name: 'C_1' },     { t: 'data', name: 'C_1', value: 1 },
  { t: 'label', name: 'C_2' },     { t: 'data', name: 'C_2', value: 2 },

  { t: 'label', name: 'TENS_0' },  { t: 'data', name: 'TENS_0', value: 0 },
  { t: 'data', name: 'TENS_1', value: 10 },
  { t: 'data', name: 'TENS_2', value: 20 },
  { t: 'data', name: 'TENS_3', value: 30 },
  { t: 'data', name: 'TENS_4', value: 40 },
  { t: 'data', name: 'TENS_5', value: 50 },
  { t: 'data', name: 'TENS_6', value: 60 },
  { t: 'data', name: 'TENS_7', value: 70 },
  { t: 'data', name: 'TENS_8', value: 80 },
  { t: 'data', name: 'TENS_9', value: 90 },
];

export const block2VerbNounDemo: ProgramData = {
  name: 'Block II: Verb/Noun Demo',
  startAddress: 0,
  entryPoint: 0,
  words: assemble(items),
};
