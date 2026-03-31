import type { AgcCpu } from './cpu.js';
import type { DecodedInstruction } from './types.js';
import { InvalidOpcode } from './types.js';
import {
  OP_NOP, OP_LOAD, OP_STORE, OP_ADD, OP_SUB,
  OP_JMP, OP_JZ, OP_JN, OP_IN, OP_OUT, OP_HALT,
} from './constants.js';
import { toSigned16, mask16 } from '../utils/bit.js';

export function executeInstruction(cpu: AgcCpu, instruction: DecodedInstruction): string {
  const { opcode, operand } = instruction;

  switch (opcode) {
    case OP_NOP:
      cpu.pc = mask16(cpu.pc + 1);
      return 'NOP';

    case OP_LOAD:
      cpu.acc = cpu.memory.read(operand);
      cpu.pc = mask16(cpu.pc + 1);
      return `ACC = 0x${cpu.acc.toString(16).padStart(4, '0')}`;

    case OP_STORE:
      cpu.memory.write(operand, cpu.acc);
      cpu.pc = mask16(cpu.pc + 1);
      return `[0x${operand.toString(16).padStart(4, '0')}] = 0x${cpu.acc.toString(16).padStart(4, '0')}`;

    case OP_ADD:
      cpu.acc = mask16(cpu.acc + cpu.memory.read(operand));
      cpu.pc = mask16(cpu.pc + 1);
      return `ACC = 0x${cpu.acc.toString(16).padStart(4, '0')}`;

    case OP_SUB:
      cpu.acc = mask16(cpu.acc - cpu.memory.read(operand));
      cpu.pc = mask16(cpu.pc + 1);
      return `ACC = 0x${cpu.acc.toString(16).padStart(4, '0')}`;

    case OP_JMP:
      cpu.pc = operand;
      return `PC = 0x${operand.toString(16).padStart(4, '0')}`;

    case OP_JZ:
      if (cpu.acc === 0) {
        cpu.pc = operand;
      } else {
        cpu.pc = mask16(cpu.pc + 1);
      }
      return cpu.acc === 0 ? `JMP 0x${operand.toString(16).padStart(4, '0')}` : 'no jump';

    case OP_JN:
      if (toSigned16(cpu.acc) < 0) {
        cpu.pc = operand;
      } else {
        cpu.pc = mask16(cpu.pc + 1);
      }
      return toSigned16(cpu.acc) < 0 ? `JMP 0x${operand.toString(16).padStart(4, '0')}` : 'no jump';

    case OP_IN:
      if (operand === 0 && cpu.hasKeyboardReader) {
        cpu.acc = cpu.readKeyboard();
      } else {
        cpu.acc = cpu.input[operand] ?? 0;
      }
      cpu.pc = mask16(cpu.pc + 1);
      return `ACC = IN[${operand}] = ${cpu.acc}`;

    case OP_OUT:
      cpu.writeDisplay(operand, cpu.acc);
      cpu.pc = mask16(cpu.pc + 1);
      return `OUT[${operand}] = ${cpu.acc}`;

    case OP_HALT:
      cpu.halted = true;
      cpu.running = false;
      return 'HALT';

    default:
      throw new InvalidOpcode(opcode);
  }
}
