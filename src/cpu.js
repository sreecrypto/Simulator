// Original teaching ISA. This does not emulate Deeds' DMC8 instruction set.
export const demoProgram='LDI 5\nSTA 16\nLDI 3\nADD 16\nOUT\nHLT';
export function assemble(source) {
  const operations={LDI:1,LDA:1,STA:1,ADD:1,SUB:1,JMP:1,JZ:1,OUT:0,HLT:0,NOP:0};
  const lines=source.split('\n').map(s=>s.split(';')[0].trim()).filter(Boolean);
  if(lines.length>256)throw new Error('Maximum 256 instructions.');
  return lines.map((line,i)=> {
    const [op,operand,...extra]=line.toUpperCase().split(/\s+/);
    if(!(op in operations)||extra.length||operations[op]!==Number(operand!==undefined))throw new Error(`Instruction ${i}: invalid opcode or operand count.`);
    const arg=operand===undefined?0:Number(operand);
    if(!Number.isInteger(arg)||arg<0||arg>255)throw new Error(`Instruction ${i}: operand must be a byte (0–255).`);
    if(['JMP','JZ'].includes(op)&&arg>=lines.length)throw new Error(`Instruction ${i}: jump outside program.`);
    return {op,arg};
  });
}
export function newCPU() {return {pc:0,a:0,z:true,memory:Array(256).fill(0),output:[],halted:false,cycles:0};}
export function stepCPU(program,state) {
  if(state.halted)return state;
  const instruction=program[state.pc];
  if(!instruction)throw new Error('Program ended without HLT.');
  const s={...state,memory:[...state.memory],output:[...state.output],pc:state.pc+1,cycles:state.cycles+1};
  const {op,arg}=instruction;
  switch(op) {
    case 'LDI':s.a=arg;break;
    case 'LDA':s.a=s.memory[arg];break;
    case 'STA':s.memory[arg]=s.a;break;
    case 'ADD':s.a=(s.a+s.memory[arg])&255;break;
    case 'SUB':s.a=(s.a-s.memory[arg]+256)&255;break;
    case 'JMP':s.pc=arg;break;
    case 'JZ':if(s.z)s.pc=arg;break;
    case 'OUT':s.output.push(s.a);break;
    case 'HLT':s.halted=true;break;
  }
  s.z=s.a===0;
  return s;
}
