import test from 'node:test';
import assert from 'node:assert/strict';
import {cloneExample} from '../src/examples.js';
import {validateCircuit,parseValue,spice} from '../src/model.js';
import {operatingPoint,transient,acSweep} from '../src/analog.js';
import {evaluateDigital,truthTable} from '../src/digital.js';
import {defaultFSM,stepFSM,validateFSM} from '../src/fsm.js';
import {assemble,newCPU,stepCPU,demoProgram} from '../src/cpu.js';
import {recipe} from '../src/assistant.js';
const near=(a,b,tolerance=1e-6)=>assert.ok(Math.abs(a-b)<tolerance,`${a} ≈ ${b}`);
test('DC divider and ideal source current match analytic solution',()=>{
  const op=operatingPoint(cloneExample('divider'));near(op.nodes.in,5);near(op.nodes.out,2.5);near(op.currents.V1,-0.00025);
});
test('RC transient matches the exponential step solution',()=>{
  const c=cloneExample('lowpass');c.components[0].wave='dc';
  const result=transient(c,{duration:0.005,steps:1000});
  const oneTau=result.rows[199];near(oneTau.t,0.001);near(oneTau.out,5*(1-Math.exp(-1)),0.005);
  near(result.rows.at(-1).out,5*(1-Math.exp(-5)),0.001);
});
test('RC AC response is -3 dB and -45 degrees at cutoff',()=>{
  const c=cloneExample('lowpass');c.components[0].value=1;
  const cutoff=1/(2*Math.PI*1000*1e-6),point=acSweep(c,{start:cutoff,stop:cutoff*10,points:2}).rows[0];
  near(point.out.magnitude,1/Math.sqrt(2));near(point.out.phase,-45);
});
test('RLC DC inductor is short, capacitor is open; transient remains bounded',()=>{
  const c=cloneExample('rlc');near(operatingPoint(c).nodes.out,5);
  const result=transient(c,{duration:0.01,steps:1000});near(result.rows.at(-1).out,5,1e-4);
});
test('current source sign follows positive first-to-second convention',()=>{
  const c={version:1,name:'current test',mode:'analog',components:[{id:'I1',type:'I',x:100,y:100,nodes:['0','out'],value:0.002},{id:'R1',type:'R',x:300,y:100,nodes:['out','0'],value:1000}]};
  near(operatingPoint(c).nodes.out,2);
});
test('floating circuits, shorted sources and invalid analysis settings fail clearly',()=>{
  const c=cloneExample('divider');c.components.forEach(p=>p.nodes=p.nodes.map(n=>n==='0'?'floating':n));assert.throws(()=>operatingPoint(c),/ground/);
  const singular=cloneExample('divider');singular.components[0].nodes=['0','0'];assert.throws(()=>operatingPoint(singular),/Singular/);
  assert.throws(()=>transient(cloneExample('lowpass'),{duration:-1}),/positive/);
});
test('all half-adder input combinations match expected sum and carry',()=>{
  assert.deepEqual(truthTable(cloneExample('halfadder')),[{A:0,B:0,SUM:0,CARRY:0},{A:0,B:1,SUM:1,CARRY:0},{A:1,B:0,SUM:1,CARRY:0},{A:1,B:1,SUM:0,CARRY:1}]);
});
test('D flip-flop captures only on rising clock edge',()=>{
  const c=cloneExample('flipflop');let state=evaluateDigital(c,{}, {},0);assert.equal(state.outputs.Q,0);
  state=evaluateDigital(c,{},state.memory,1);assert.equal(state.outputs.Q,1);
  state=evaluateDigital(c,{D:0},state.memory,1);assert.equal(state.outputs.Q,1);
  state=evaluateDigital(c,{D:0},state.memory,2);assert.equal(state.outputs.Q,1);
  state=evaluateDigital(c,{D:0},state.memory,3);assert.equal(state.outputs.Q,0);
  assert.throws(()=>truthTable(c),/combinational/);
});
test('digital undriven nets and multiple drivers are rejected',()=>{
  const c=cloneExample('halfadder');c.components[2].nodes[0]='missing';assert.throws(()=>evaluateDigital(c),/Undriven/);
  const d=cloneExample('halfadder');d.components[1].nodes=['a'];assert.throws(()=>evaluateDigital(d),/Multiple/);
});
test('FSM transitions emit outputs and ambiguous definitions fail',()=>{
  assert.deepEqual(stepFSM(defaultFSM,'IDLE','start'),{state:'RUN',output:'busy'});
  assert.throws(()=>stepFSM(defaultFSM,'IDLE','finish'),/No transition/);
  const bad=structuredClone(defaultFSM);bad.transitions.push(bad.transitions[0]);assert.throws(()=>validateFSM(bad),/ambiguous/);
});
test('CPU executes sample, wraps bytes and branches using zero flag',()=>{
  const run=source=>{const program=assemble(source);let s=newCPU();for(let i=0;i<100&&!s.halted;i++)s=stepCPU(program,s);return s;};
  const sample=run(demoProgram);assert.deepEqual(sample.output,[8]);assert.equal(sample.memory[16],5);assert.equal(sample.halted,true);
  assert.deepEqual(run('LDI 255\nSTA 1\nLDI 1\nADD 1\nJZ 6\nOUT\nHLT').output,[]);
  assert.throws(()=>assemble('LDI 256'),/byte/);assert.throws(()=>assemble('JMP 9'),/outside/);assert.throws(()=>assemble('UNKNOWN'),/invalid/);
});
test('project validation rejects unsupported parts, duplicate references and unsafe net names',()=>{
  const c=cloneExample('divider');c.components[0].type='MOSFET';assert.throws(()=>validateCircuit(c),/Unsupported/);
  const d=cloneExample('divider');d.components[1].id='V1';assert.throws(()=>validateCircuit(d),/unique/);
  for(const n of ['__proto__','t','f']){const d=cloneExample('divider');d.components[0].nodes[0]=n;assert.throws(()=>validateCircuit(d),/nodes/);}
});
test('engineering values and SPICE export preserve circuit meaning',()=>{
  near(parseValue('4.7k'),4700);near(parseValue('100nF'),1e-7);near(parseValue('1meg'),1e6);assert.throws(()=>parseValue('NaN'));
  assert.match(spice(cloneExample('divider')),/R1 in out 10000/);assert.match(spice(cloneExample('lowpass')),/PULSE\(/);assert.throws(()=>spice(cloneExample('halfadder')),/analog/);
});
test('offline builder matches supported recipes and reports unsupported requests',()=>{
  const p=recipe('build a 12V voltage divider');assert.equal(p.circuit.components[0].value,12);validateCircuit(p.circuit);
  assert.throws(()=>recipe('build a satellite radio'),/Offline recipes support/);
});
