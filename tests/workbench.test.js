import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {sourceValue,sampleGenerator,validateGenerator,spiceSource} from '../src/waveforms.js';
import {transformPoint,duplicateParts} from '../src/transforms.js';
import {parseResource,resourceSpecs} from '../src/resources.js';
import {catalogFor,instantiate,registerResources,catalogById} from '../src/catalog.js';
import {operatingPoint} from '../src/analog.js';
import {spice,validateCircuit} from '../src/model.js';
import {digitalShape} from '../src/digital.js';
import {cloneExample} from '../src/examples.js';
import {generateVerilog} from '../src/verilog.js';
import {parseAsciiRaw,ngspiceAvailable,simulateNgspice} from '../ngspice.mjs';
import {isPublicAddress,fetchModelResource} from '../server-resources.mjs';
const near=(a,b,t=1e-8)=>assert.ok(Math.abs(a-b)<t,`${a} vs ${b}`);
test('function generator waveforms honor frequency, phase, duty, offset and output gating',()=>{
  const p={value:2,frequency:1000,offset:1};
  near(sourceValue({...p,wave:'sine'},.00025),3);near(sourceValue({...p,wave:'sine',phase:90},0),3);
  near(sourceValue({...p,wave:'square',duty:25},.0001),3);near(sourceValue({...p,wave:'square',duty:25},.0003),-1);
  near(sourceValue({...p,wave:'triangle'},0),-1);near(sourceValue({...p,wave:'triangle'},.0005),3);
  near(sourceValue({...p,wave:'sawtooth'},.00025),0);near(sourceValue({...p,wave:'pulse',rise:.0001},.00005),2);
  near(sourceValue({...p,wave:'sine',outputEnabled:false},.00025),0);near(sourceValue({...p,wave:'sine',delay:.001},.00025),1);
  near(sourceValue({...p,wave:'sine',burstCycles:2},.00325),1);assert.throws(()=>validateGenerator({...p,duty:100}),/duty/);
});
test('AM/FM, sweep, arbitrary wave and deterministic noise are finite and reproducible',()=>{
  const p={value:1,frequency:10,wave:'sine',modFrequency:1};
  near(sourceValue({...p,modulation:'am',modDepth:100},.025),(1+Math.sin(.05*Math.PI)));
  for(const config of [{sweep:'linear',sweepStop:100,sweepTime:1},{sweep:'log',sweepStop:100,sweepTime:1},{modulation:'fm',deviation:5}])assert.ok(sampleGenerator({...p,...config},2).flat().every(Number.isFinite));
  near(sourceValue({...p,wave:'arbitrary',points:[[0,-1],[.5,1],[1,-1]]},.025),0);
  assert.deepEqual(sampleGenerator({...p,wave:'noise'}),sampleGenerator({...p,wave:'noise'}));
  assert.throws(()=>validateGenerator({...p,wave:'arbitrary',points:[[1,0],[0,1]]}),/increasing/);
  assert.match(spiceSource({...p,wave:'triangle'}),/^PWL/);
});
test('50 ohm output impedance produces expected loaded voltage',()=>{
  const c={version:1,name:'generator',mode:'analog',components:[{id:'V1',type:'V',x:100,y:100,nodes:['out','0'],value:2,sourceResistance:50},{id:'R1',type:'R',x:300,y:100,nodes:['out','0'],value:50}]};
  near(operatingPoint(c).nodes.out,1);assert.match(spice(c),/rout/);
});
test('rotation and mirroring transform electrical pins; duplication isolates copied nets',()=>{
  const p={x:100,y:100,rotation:90};const [x,y]=transformPoint(p,[150,100]);near(x,100);near(y,150);
  assert.deepEqual(transformPoint({x:100,y:100,mirrorX:true},[150,100]),[50,100]);
  const c=cloneExample('divider'),result=duplicateParts(c,['R1','R2'],2);assert.equal(result.circuit.components.length,7);assert.equal(new Set(result.ids).size,4);
  const copies=result.circuit.components.slice(3);assert.equal(copies[0].nodes[1],copies[1].nodes[0]);assert.notEqual(copies[0].nodes[1],'out');assert.notEqual(copies[0].nodes[1],copies[2].nodes[1]);assert.equal(copies[1].nodes[1],'0');
});
test('linear imported subcircuit loads, solves, exports and survives JSON roundtrip',()=>{
  const resource=parseResource({name:'External divider',sourceUrl:'https://example.org/divider.lib',spice:'.subckt DIVIDER IN OUT GND\nR1 IN OUT 1k\nR2 OUT GND 1k\n.ends DIVIDER'});registerResources([resource]);
  const spec=resourceSpecs(resource)[0],p=instantiate(spec,'X1');p.nodes=['in','out','0'];
  const c={version:1,name:'Imported model',mode:'analog',resources:[resource],components:[{id:'V1',type:'V',x:100,y:100,nodes:['in','0'],value:5},p]};
  validateCircuit(c);near(operatingPoint(c).nodes.out,2.5);assert.match(spice(c),/X1 in out 0 DIVIDER/);near(operatingPoint(JSON.parse(JSON.stringify(c))).nodes.out,2.5);
  for(const text of ['.control\nshell echo hi\n.endc','.include secret.lib','.subckt BAD A B\nR1 A B 1k'])assert.throws(()=>parseResource({spice:text}));
});
test('nonlinear families export generic SPICE models and refuse the linear engine',()=>{
  for(const spec of catalogFor('analog').filter(s=>s.support==='ngspice')){
    const p=instantiate(spec,'U1');const c={version:1,name:'device',mode:'analog',components:[p]};validateCircuit(c);assert.ok(spice(c).includes(p.modelName||p.expression||String(p.value)));assert.throws(()=>operatingPoint(c),/ngspice/);
  }
});
test('model downloader blocks private addresses, non-HTTPS and command content',async()=>{
  for(const address of ['127.0.0.1','10.0.0.1','192.168.1.1','172.16.0.1','::1','::ffff:127.0.0.1'])assert.equal(isPublicAddress(address),false);
  assert.equal(isPublicAddress('8.8.8.8'),true);
  await assert.rejects(fetchModelResource({url:'http://example.org/model.lib'}),/public HTTPS/);
  await assert.rejects(fetchModelResource({url:'https://example.org/model.lib'},{resolve:async()=>[{address:'127.0.0.1',family:4}]}),/Private/);
});
test('ASCII ngspice parser returns node voltage and complex AC response',()=>{
  const header='Title: test\nNo. Variables: 2\nNo. Points: 2\nVariables:\n0 time time\n1 v(out) voltage\nValues:\n';
  assert.deepEqual(parseAsciiRaw(header+'0 0\n1\n1 0.001\n2\n','transient').rows,[{t:0,out:1},{t:.001,out:2}]);
  const ac=parseAsciiRaw(header.replace('time time','frequency frequency')+'0 100,0\n1,-1\n1 1000,0\n0,-1\n','ac');near(ac.rows[0].out.magnitude,Math.sqrt(2));near(ac.rows[0].out.phase,-45);
});
test('Verilog generation preserves half-adder semantics and emits assertions',()=>{
  const v=generateVerilog(cloneExample('halfadder'));assert.match(v.design,/module circuit_dut/);assert.match(v.testbench,/\$fatal/);assert.equal(v.checked,true);assert.throws(()=>generateVerilog(cloneExample('divider')),/digital/);
});
test('native ngspice solves a divider and a forward-biased generic diode when installed',async t=>{
  if(!await ngspiceAvailable()){t.skip('ngspice is not installed locally; CI installs it.');return;}
  const divider=await simulateNgspice(cloneExample('divider'),{kind:'dc'});near(divider.nodes.out,2.5,1e-5);
  const diode=instantiate(catalogById.get('diode'),'D1');diode.nodes=['out','0'];
  const c={version:1,name:'Diode operating point',mode:'analog',components:[{id:'V1',type:'V',nodes:['in','0'],value:5,x:100,y:100},{id:'R1',type:'R',nodes:['in','out'],value:1000,x:300,y:100},diode]};
  const result=await simulateNgspice(c,{kind:'dc'});assert.ok(result.nodes.out>.4&&result.nodes.out<1);
});
test('Icarus compiles every digital block and runs generated combinational assertions',async t=>{
  const version=spawnSync('iverilog',['-V'],{encoding:'utf8',timeout:3000});const major=Number(version.stdout?.match(/version\s+(\d+)/i)?.[1]);
  if(version.status!==0||!major||major<10){t.skip('A working Icarus Verilog 10+ installation is required (local 0.9.7 backend cannot compile).');return;}
  const folder=await mkdtemp(path.join(os.tmpdir(),'circuit-studio-hdl-'));let code='',index=0,instances=[],done=[];const cases=[];
  for(const spec of catalogFor('digital').filter(s=>s.type==='BLOCK')){
    const p=instantiate(spec,'U1'),shape=digitalShape(p),components=[p];
    for(let i=0;i<shape.inputs;i++)components.push({id:'I'+i,type:'INPUT',value:0,nodes:[p.nodes[i]],x:100,y:100});
    for(let i=0;i<shape.outputs;i++)components.push({id:'O'+i,type:'OUTPUT',value:1,nodes:[p.nodes[shape.inputs+i]],x:300,y:100});
    const circuit={version:1,name:spec.name,mode:'digital',components},v=generateVerilog(circuit),suffix='_'+index;
    cases.push({name:spec.name,source:v.design+v.testbench});
    code+=v.design.replaceAll('circuit_dut','circuit_dut'+suffix)+v.testbench.replaceAll('circuit_dut','circuit_dut'+suffix).replaceAll('circuit_tb','circuit_tb'+suffix).replace('module circuit_tb'+suffix+';','module circuit_tb'+suffix+'; reg done = 0;').replace('$finish;','done = 1;').replace('$dumpfile("circuit.vcd");','').replace('$dumpvars(0, circuit_tb'+suffix+');','');
    instances.push(`circuit_tb${suffix} b${index}();`);done.push(`b${index}.done`);index++;
  }
  code+=`\nmodule all_tests;\n${instances.join('\n')}\ninitial begin wait (${done.join(' && ')}); $display("ALL BLOCKS PASS"); $finish; end\nendmodule\n`;
  try{
    for(const sample of cases){await writeFile(path.join(folder,'case.v'),sample.source);const compile=spawnSync('iverilog',['-g2012','-s','circuit_tb','-o',path.join(folder,'case.out'),path.join(folder,'case.v')],{encoding:'utf8',timeout:10000});assert.equal(compile.status,0,sample.name+'\n'+compile.stderr);const run=spawnSync('vvp',[path.join(folder,'case.out')],{cwd:folder,encoding:'utf8',timeout:10000});assert.equal(run.status,0,sample.name+'\n'+run.stdout+'\n'+run.stderr);assert.match(run.stdout,/PASS:|DONE:/,sample.name);}
  }finally{assert.equal(path.dirname(path.resolve(folder)),path.resolve(os.tmpdir()));await rm(folder,{recursive:true,force:true});}
});
