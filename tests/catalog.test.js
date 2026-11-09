import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,catalogFor,instantiate} from '../src/catalog.js';
import {validateCircuit,spice} from '../src/model.js';
import {operatingPoint,acSweep} from '../src/analog.js';
import {evaluateDigital,digitalShape} from '../src/digital.js';
import {recipe} from '../src/assistant.js';
import {verifyProposal} from '../src/verification.js';
import {makeDocument,duplicateDocument,validateSession} from '../src/workspaces.js';
const primitive=(id,type,nodes,value)=>({id,type,nodes,value,x:150,y:150});
const project=(mode,components)=>({version:1,name:'test',mode,components,wires:[]});
test('library uses editable analog families and keeps old preset IDs importable',()=>{
  assert.equal(catalogFor('analog').filter(s=>s.type==='R').length,1);assert.equal(catalogFor('analog').filter(s=>s.type==='C').length,1);assert.equal(catalogFor('analog').filter(s=>s.type==='L').length,1);assert.equal(catalogFor('digital').length,281);
  assert.equal(new Set(catalog.map(s=>s.id)).size,catalog.length);
  assert.equal(new Set(catalog.map(s=>s.mode+':'+s.name)).size,catalog.length);
  for(const spec of catalog){const p=instantiate(spec,'U1');validateCircuit(project(spec.mode,[p]));assert.ok(['simulated','ngspice'].includes(spec.support));}
});
test('every analog catalog entry solves in a representative grounded fixture',()=>{
  for(const spec of catalog.filter(s=>s.mode==='analog'&&s.support==='simulated'&&!['GROUND','PROBE'].includes(s.type))){
    const p=instantiate(spec,'U1');
    p.nodes=p.nodes.length===2?['out','0']:p.nodes.length===3?['in','out','0']:spec.type==='BLOCK'?['in','left','right','0']:['out','0','in','0'];
    const c=project('analog',[primitive('Vtest','V',['in','0'],1),primitive('Rfeed','R',['in','out'],1000),primitive('Rload','R',['out','0'],10000),p]);
    const result=operatingPoint(c);assert.ok(Object.values(result.nodes).every(Number.isFinite),spec.name);
    assert.ok(acSweep(c,{start:100,stop:1000,points:2}).rows.every(row=>Object.values(row).every(v=>typeof v==='number'||Number.isFinite(v.magnitude))),spec.name);
    assert.ok(!spice(c).includes('BLOCK'),spec.name);
  }
});
test('every digital catalog block executes driven inputs and produces binary outputs',()=>{
  for(const spec of catalogFor('digital')){
    if(spec.type!=='BLOCK')continue;
    const p=instantiate(spec,'U1'),shape=digitalShape(p),components=[p];
    for(let i=0;i<shape.inputs;i++)components.push(primitive('I'+i,'INPUT',[p.nodes[i]],i%2));
    for(let i=0;i<shape.outputs;i++)components.push(primitive('O'+i,'OUTPUT',[p.nodes[shape.inputs+i]],1));
    const c=project('digital',components),first=evaluateDigital(c),next=evaluateDigital(c,{},first.memory,1);
    assert.equal(Object.keys(next.outputs).length,shape.outputs,spec.name);assert.ok(Object.values(next.outputs).every(v=>v===0||v===1),spec.name);
  }
});
test('4-bit arithmetic, priority encoding and mux use little-endian bit order',()=>{
  const run=(id,values)=>{
    const spec=catalog.find(s=>s.id===id),p=instantiate(spec,'U1'),shape=digitalShape(p);
    const c=project('digital',[p,...values.map((v,i)=>primitive('I'+i,'INPUT',[p.nodes[i]],v))]);
    const result=evaluateDigital(c);return p.nodes.slice(shape.inputs).map(n=>result.nets[n]);
  };
  assert.deepEqual(run('adder_4',[1,1,1,1,1,0,0,0]),[0,0,0,0,1]);
  assert.deepEqual(run('subtractor_4',[0,0,0,0,1,0,0,0]),[1,1,1,1,1]);
  assert.deepEqual(run('comparator_4',[1,0,0,0,0,1,0,0]),[1,0,0]);
  assert.deepEqual(run('encoder_2',[0,1,0,1]),[1,1,1]);
  assert.deepEqual(run('mux2_2',[1,0,0,1,1]),[0,1]);
});
test('advanced circuit builders generate connected, simulatable large designs',()=>{
  for(const prompt of ['Build a 16-bit ripple-carry adder','Build an 8-bit ALU','Build a 4-bit counter','Build an 8-bit shift register','Build a 4-bit decoder','Build a 3-stage active filter with gain 2','Build a Wheatstone bridge']){
    const result=recipe(prompt);validateCircuit(result.circuit);assert.equal(verifyProposal(result.circuit).passed,true,prompt);
  }
  const adder=recipe('Build a 16-bit ripple-carry adder').circuit;assert.ok(adder.components.length>100);
});
test('controlled amplifier and expanded divider retain expected gain',()=>{
  const p=instantiate(catalog.find(s=>s.id==='divider_0_25'),'U1');p.nodes=['in','out','0'];
  const c=project('analog',[primitive('V1','V',['in','0'],8),p,primitive('E1','E',['amp','0','out','0'],10)]);
  const result=operatingPoint(c);assert.ok(Math.abs(result.nodes.out-2)<1e-9);assert.ok(Math.abs(result.nodes.amp-20)<1e-9);
});
test('workspace bundles validate and duplicate without sharing document mutations',()=>{
  const a=makeDocument('analog',recipe('voltage divider').circuit),b=duplicateDocument(a);
  assert.notEqual(a.id,b.id);b.content.components[0].value=12;assert.equal(a.content.components[0].value,5);
  assert.equal(b.content.name,b.name);assert.notEqual(a.content.name,b.content.name);
  const session={version:1,activeId:b.id,documents:[a,b,makeDocument('cpu',{source:'HLT'})]};validateSession(session);validateSession(JSON.parse(JSON.stringify(session)));
  assert.throws(()=>validateSession({...session,activeId:'missing'}),/Active/);assert.throws(()=>validateSession({...session,documents:[a,a]}),/Invalid/);
});
