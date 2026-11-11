import { demoProgram } from './cpu.js';

export const targets = {
  teaching: {
    name: 'Teaching CPU',
    description: 'Accumulator, 256 bytes of memory, and an output log.',
    instructions: 'LDI, LDA, STA, ADD, SUB, JMP, JZ, OUT, HLT, NOP. Jump operands are zero-based instruction numbers.',
    example: demoProgram,
  },
  avr: {
    name: 'ATmega328P (AVR subset)',
    description: '32 working registers and 64 I/O address latches. Instruction model with no peripheral or pin timing.',
    instructions: 'LDI, MOV, ADD, SUB, INC, DEC, IN, OUT, RJMP, BREQ, BRNE, NOP, BREAK. Use labels for branches and numeric I/O addresses or PORTB, PORTC, PORTD.',
    example: 'ldi r16, 5\nldi r17, 3\nadd r16, r17\nout PORTB, r16\nbreak',
  },
  '8051': {
    name: '8051 (MCS-51 subset)',
    description: 'Accumulator, register bank 0, 128 bytes of internal RAM, and four port latches. Instruction model with no peripheral or pin timing.',
    instructions: 'MOV, ADD, INC, DEC, SJMP, JZ, JNZ, NOP. Use labels for branches and # for immediate values. P0–P3 are available as direct addresses.',
    example: 'mov A, #5\nmov R0, #3\nadd A, R0\nmov P1, A',
  },
};

export function getTarget(id) {
  if (!Object.hasOwn(targets, id)) throw new Error('Unknown microcontroller target.');
  return targets[id];
}

export function microcontrollerProject(input) {
  if (!input || typeof input.source !== 'string' || input.source.length > 100000) {
    throw new Error('Invalid assembly source.');
  }
  const target = Object.hasOwn(input, 'target') ? input.target : 'teaching';
  if (typeof target !== 'string') throw new Error('Invalid microcontroller target.');
  getTarget(target);
  const project = { target, source: input.source };
  if (input.drafts !== undefined) {
    if (!input.drafts || typeof input.drafts !== 'object' || Array.isArray(input.drafts)) {
      throw new Error('Invalid microcontroller drafts.');
    }
    project.drafts = {};
    for (const [id, source] of Object.entries(input.drafts)) {
      getTarget(id);
      if (typeof source !== 'string' || source.length > 100000) throw new Error('Invalid assembly draft.');
      if (id !== target) project.drafts[id] = source;
    }
  }
  return project;
}
