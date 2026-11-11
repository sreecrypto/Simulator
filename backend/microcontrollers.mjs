import { assemble, newCPU, stepCPU } from '../src/cpu.js';
import { microcontrollerProject } from '../src/microcontrollers.js';

const avrPorts = { PORTB: 5, PORTC: 8, PORTD: 11 };
const mcsPorts = { P0: 0x80, P1: 0x90, P2: 0xa0, P3: 0xb0 };
const byte = value => value & 255;

function number(token, min, max) {
  if (!/^(?:\d+|0X[\dA-F]+|0B[01]+|\d[\dA-F]*H)$/.test(token ?? '')) {
    throw new Error('Expected a number.');
  }
  const value = token.endsWith('H') ? parseInt(token.slice(0, -1), 16) : Number(token);
  if (value < min || value > max) throw new Error(`Expected a value from ${min} to ${max}.`);
  return value;
}

function avrRegister(token, min = 0) {
  if (!/^R(?:[0-9]|[12][0-9]|3[01])$/.test(token ?? '')) throw new Error('Expected R0–R31.');
  return number(token.slice(1), min, 31);
}

function mcsOperand(token, immediateAllowed = false) {
  if (token === 'A') return 0xe0;
  if (/^R[0-7]$/.test(token ?? '')) return Number(token[1]);
  if (immediateAllowed && token?.startsWith('#')) return { immediate: number(token.slice(1), 0, 255) };
  if (Object.hasOwn(mcsPorts, token)) return mcsPorts[token];
  const address = number(token, 0, 255);
  if (address < 128 || address === 0xe0 || Object.values(mcsPorts).includes(address)) return address;
  throw new Error('Only internal RAM, ACC and P0–P3 are modeled.');
}

function decodeAVR(op, operands, label) {
  const [a, b] = operands;
  const io = token => Object.hasOwn(avrPorts, token) ? avrPorts[token] : number(token, 0, 63);
  switch (op) {
    case 'LDI': return [avrRegister(a, 16), number(b, 0, 255)];
    case 'MOV': case 'ADD': case 'SUB': return [avrRegister(a), avrRegister(b)];
    case 'INC': case 'DEC': return [avrRegister(a)];
    case 'IN': return [avrRegister(a), io(b)];
    case 'OUT': return [io(a), avrRegister(b)];
    case 'RJMP': case 'BREQ': case 'BRNE': return [label(a)];
    case 'NOP': case 'BREAK': return [];
    default: throw new Error(`Unsupported AVR instruction ${op}.`);
  }
}

function decode8051(op, operands, label) {
  const [a, b] = operands;
  switch (op) {
    case 'MOV': {
      const dest = mcsOperand(a), source = mcsOperand(b, true);
      if (/^R[0-7]$/.test(a) && /^R[0-7]$/.test(b)) {
        throw new Error('Move between R registers through A.');
      }
      return [dest, source];
    }
    case 'ADD':
      if (a !== 'A') throw new Error('ADD must write to A.');
      return [0xe0, mcsOperand(b, true)];
    case 'INC': case 'DEC': return [mcsOperand(a)];
    case 'SJMP': case 'JZ': case 'JNZ': return [label(a)];
    case 'NOP': return [];
    default: throw new Error(`Unsupported 8051 instruction ${op}.`);
  }
}

function assembleSubset(source, decode) {
  const labels = new Map();
  const lines = [];
  for (const [index, raw] of source.split(/\r?\n/).entries()) {
    let text = raw.split(';', 1)[0].trim().toUpperCase();
    const label = /^([A-Z_]\w*):/.exec(text);
    if (label) {
      if (labels.has(label[1])) throw new Error(`Line ${index + 1}: duplicate label ${label[1]}.`);
      labels.set(label[1], lines.length);
      text = text.slice(label[0].length).trim();
    }
    if (text) lines.push({ text, line: index + 1 });
    if (lines.length > 256) throw new Error('Maximum 256 instructions.');
  }
  return lines.map(({ text, line }) => {
    const [, op, tail] = /^(\S+)(?:\s+(.+))?$/.exec(text);
    const operands = tail ? tail.split(',').map(s => s.trim()) : [];
    try {
      const args = decode(op, operands, name => {
        const address = labels.get(name);
        if (address === undefined || address >= lines.length) throw new Error(`Unknown branch target ${name ?? ''}.`);
        return address;
      });
      if (args.length !== operands.length) throw new Error('Incorrect operand count.');
      return { op, args, text, line };
    } catch (error) {
      throw new Error(`Line ${line}: ${error.message}`);
    }
  });
}

function stepAVR(state, { op, args: [a, b] }) {
  const { registers: r, io } = state;
  switch (op) {
    case 'LDI': r[a] = b; break;
    case 'MOV': r[a] = r[b]; break;
    case 'ADD': case 'SUB': case 'INC': case 'DEC': {
      const value = op === 'ADD' ? r[a] + r[b] : op === 'SUB' ? r[a] - r[b] : r[a] + (op === 'INC' ? 1 : -1);
      r[a] = byte(value);
      state.zero = r[a] === 0;
      break;
    }
    case 'IN': r[a] = io[b]; break;
    case 'OUT': io[a] = r[b]; state.output.push(`I/O ${hex(a)} ← ${hex(r[b])}`); break;
    case 'RJMP': state.pc = a; break;
    case 'BREQ': if (state.zero) state.pc = a; break;
    case 'BRNE': if (!state.zero) state.pc = a; break;
    case 'BREAK': state.halted = true; break;
  }
}

function step8051(state, { op, args: [a, b] }) {
  const mem = state.memory;
  const read = operand => typeof operand === 'number' ? mem[operand] : operand.immediate;
  const port = Object.keys(mcsPorts).find(name => mcsPorts[name] === a);
  switch (op) {
    case 'MOV': mem[a] = read(b); break;
    case 'ADD': {
      const sum = mem[a] + read(b);
      mem[a] = byte(sum);
      state.carry = sum > 255;
      break;
    }
    case 'INC': mem[a] = byte(mem[a] + 1); break;
    case 'DEC': mem[a] = byte(mem[a] - 1); break;
    case 'SJMP': state.pc = a; break;
    case 'JZ': if (mem[0xe0] === 0) state.pc = a; break;
    case 'JNZ': if (mem[0xe0] !== 0) state.pc = a; break;
  }
  if (port && ['MOV', 'INC', 'DEC'].includes(op)) state.output.push(`${port} ← ${hex(mem[a])}`);
}

const hex = value => '0x' + value.toString(16).padStart(2, '0').toUpperCase();
const cells = (values, label) => values.map((value, i) => ({ label: label(i), value }));

export const instructionLimit = 10000;

export function runMicrocontroller({ project, cursor = 0, steps = 0 }) {
  const { target, source } = microcontrollerProject(project);
  if (!Number.isInteger(cursor) || cursor < 0 || cursor > instructionLimit ||
      !Number.isInteger(steps) || steps < 0 || steps > 1000) {
    throw new Error('Invalid instruction count.');
  }
  const teaching = target === 'teaching';
  const avr = target === 'avr';
  const program = teaching ? assemble(source) : assembleSubset(source, avr ? decodeAVR : decode8051);
  let state;
  if (teaching) state = newCPU();
  else if (avr) state = { pc: 0, registers: Array(32).fill(0), io: Array(64).fill(0), zero: false, output: [], halted: false };
  else {
    const memory = Array(256).fill(0);
    for (const address of Object.values(mcsPorts)) memory[address] = 255;
    state = { pc: 0, memory, carry: false, output: [], halted: false };
  }

  let executed = 0;
  const budget = Math.min(cursor + steps, instructionLimit);
  while (executed < budget && !state.halted && program[state.pc]) {
    if (teaching) state = stepCPU(program, state);
    else (avr ? stepAVR : step8051)(state, program[state.pc++]);
    executed++;
  }
  const next = program[state.pc];
  return {
    cursor: executed,
    finished: state.halted || !next,
    limitReached: executed === instructionLimit,
    next: state.halted ? null : next?.text ?? (next ? `${next.op} ${next.arg}` : null),
    registers: teaching ? { ACC: state.a, ZERO: Number(state.z) } :
      avr ? { ZERO: Number(state.zero) } : { ACC: state.memory[0xe0], CARRY: Number(state.carry) },
    pc: state.pc,
    cells: avr ? cells(state.registers, i => `R${i}`) : cells(state.memory.slice(0, 32), hex),
    ports: avr ? Object.fromEntries(Object.entries(avrPorts).map(([name, address]) => [name, state.io[address]])) :
      teaching ? {} : Object.fromEntries(Object.entries(mcsPorts).map(([name, address]) => [name, state.memory[address]])),
    output: state.output.slice(-128),
  };
}
