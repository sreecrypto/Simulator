import {validateCircuit} from './model.js';
import {componentSpec} from './catalog.js';
import {clockLevel,clockEdges} from './clocks.js';
export function digitalShape(p){
  const spec=componentSpec(p);
  if(p.type==='BLOCK')return {inputs:spec.model.inputs,outputs:spec.model.outputs,sequential:!!spec.model.sequential};
  return {inputs:['INPUT','CLOCK'].includes(p.type)?0:p.type==='OUTPUT'||p.type==='NOT'?1:2,outputs:p.type==='OUTPUT'?0:1,sequential:p.type==='DFF'};
}
const unpack=(value,width)=>Array.from({length:width},(_,i)=>Math.floor(value/2**i)%2);
const pack=values=>values.reduce((n,b,i)=>n+b*2**i,0);
function combinational(p,v){
  const m=componentSpec(p)?.model;
  if(!m){const [a,b]=v;return [{AND:a&b,OR:a|b,XOR:a^b,NAND:1-(a&b),NOR:1-(a|b),XNOR:1-(a^b),NOT:1-a}[p.type]];}
  const {family,width}=m,a=pack(v.slice(0,width)),b=pack(v.slice(width,width*2)),mask=2**width-1;
  switch(family){
    case 'gate': {const and=Number(v.every(Boolean)),or=Number(v.some(Boolean)),xor=v.reduce((n,b)=>n^b,0);return [{AND:and,OR:or,XOR:xor,NAND:1-and,NOR:1-or,XNOR:1-xor}[m.gate]];}
    case 'adder':return [...unpack((a+b)&mask,width),Number(a+b>mask)];
    case 'subtractor':return [...unpack((a-b+2**width)&mask,width),Number(a<b)];
    case 'comparator':return [Number(a<b),Number(a===b),Number(a>b)];
    case 'increment':return unpack((a+1)&mask,width);
    case 'decrement':return unpack((a-1+2**width)&mask,width);
    case 'negate':return unpack((-a+2**width)&mask,width);
    case 'buffer':return v;
    case 'invert':return v.map(b=>1-b);
    case 'andbus':return unpack(a&b,width);
    case 'orbus':return unpack(a|b,width);
    case 'xorbus':return unpack(a^b,width);
    case 'parity':{const odd=v.reduce((n,b)=>n^b,0);return [odd,1-odd];}
    case 'mux':return v.slice(v.at(-1)?width:0,v.at(-1)?2*width:width);
    case 'demux':return v.at(-1)?[...Array(width).fill(0),...v.slice(0,width)]:[...v.slice(0,width),...Array(width).fill(0)];
    case 'decoder':return Array.from({length:2**width},(_,i)=>Number(i===a));
    case 'encoder':{const position=v.lastIndexOf(1);return [...unpack(Math.max(0,position),width),Number(position>=0)];}
    case 'rotate':return m.direction==='left'?[v.at(-1),...v.slice(0,-1)]:[...v.slice(1),v[0]];
    default:throw new Error(`Missing behavioral implementation for ${family}.`);
  }
}
function sequential(p,values,old={}){
  if(p.type==='DFF'){const [d,clk]=values;return {q:!old.clk&&clk?d:old.q??0,clk};}
  const m=componentSpec(p).model,mask=2**m.width-1;
  const clk=m.family==='register'?values[m.width]:values[m.family==='counter'?0:1];
  const rising=!old.clk&&clk;let q=old.q??0;
  if(m.family==='register'&&rising)q=pack(values.slice(0,m.width));
  if(m.family==='counter'){if(values[1])q=0;else if(rising&&values[2])q=(q+1)&mask;}
  if(m.family==='shift'){if(values[2])q=0;else if(rising)q=((q<<1)|values[0])&mask;}
  return {q,clk};
}
export function evaluateDigital(c,inputs={},memory={},tick=0,time=null){
  validateCircuit(c);if(c.mode!=='digital')throw new Error('Choose a digital circuit.');
  const nets=Object.create(null),drivers=new Set();
  for(const p of c.components){
    const shape=digitalShape(p);
    for(const out of p.nodes.slice(shape.inputs)){
      if(drivers.has(out))throw new Error(`Multiple drivers on ${out}.`);drivers.add(out);
    }
    if(p.type==='INPUT'){const value=inputs[p.id]??p.value??0;if(![0,1].includes(value))throw new Error('Digital inputs must be binary.');nets[p.nodes[0]]=value;}
    if(p.type==='CLOCK')nets[p.nodes[0]]=time===null?tick%2:clockLevel(p,time);
    if(shape.sequential)unpack(memory[p.id]?.q??0,shape.outputs).forEach((v,i)=>nets[p.nodes[shape.inputs+i]]=v);
  }
  const gates=c.components.filter(p=>!['INPUT','OUTPUT','CLOCK'].includes(p.type)&&!digitalShape(p).sequential);
  function settle(){
    for(let pass=0;pass<=gates.length;pass++){
      let changed=false;
      for(const p of gates){
        const shape=digitalShape(p),values=p.nodes.slice(0,shape.inputs).map(n=>nets[n]);
        if(values.some(v=>v===undefined))continue;
        combinational(p,values).forEach((v,i)=>{const name=p.nodes[shape.inputs+i];if(nets[name]!==v){nets[name]=v;changed=true;}});
      }
      if(!changed)return;
    }
    throw new Error('Combinational feedback did not settle. Use a D flip-flop for state.');
  }
  settle();const next={};
  for(const p of c.components.filter(p=>digitalShape(p).sequential)){
    const shape=digitalShape(p),values=p.nodes.slice(0,shape.inputs).map(n=>nets[n]);
    if(values.some(v=>v===undefined))throw new Error(`Unconnected data or clock on ${p.id}.`);
    next[p.id]=sequential(p,values,memory[p.id]);
  }
  for(const p of c.components.filter(p=>digitalShape(p).sequential)){const shape=digitalShape(p);unpack(next[p.id].q,shape.outputs).forEach((v,i)=>nets[p.nodes[shape.inputs+i]]=v);}
  settle();for(const p of c.components)if(p.nodes.some(n=>nets[n]===undefined))throw new Error(`Undriven net on ${p.id}.`);
  return {nets,memory:next,outputs:Object.fromEntries(c.components.filter(p=>p.type==='OUTPUT').map(p=>[p.id,nets[p.nodes[0]]]))};
}
export function digitalTimeline(c,{duration=.01,maxEvents=10000}={}){
  validateCircuit(c);if(c.mode!=='digital')throw new Error('Choose a digital circuit.');
  if(!Number.isFinite(duration)||duration<=0||duration>1000)throw new Error('Timing window must be between 0 and 1,000 seconds.');
  const times=new Set([0,duration]);
  for(const p of c.components.filter(p=>p.type==='CLOCK'))for(const time of clockEdges(p,duration,maxEvents)){times.add(time);if(times.size>maxEvents)throw new Error('Timing trace exceeds 10,000 events. Shorten the window.');}
  const tolerance=Number.EPSILON*Math.max(duration,1)*32,sorted=[...times].sort((a,b)=>a-b).filter((t,i,a)=>i===0||t-a[i-1]>tolerance);
  let memory={};const rows=[];
  for(const time of sorted){const state=evaluateDigital(c,{},memory,0,time);memory=state.memory;rows.push({t:time,...state.nets});}
  return {nodes:Object.keys(rows[0]).filter(n=>n!=='t'),rows,duration,outputNodes:Object.fromEntries(c.components.filter(p=>p.type==='OUTPUT').map(p=>[p.id,p.nodes[0]]))};
}
export function truthTable(c){
  if(c.components.some(p=>p.type==='CLOCK'||digitalShape(p).sequential))throw new Error('Truth tables require combinational circuits. Use Tick for sequential circuits.');
  const inputs=c.components.filter(p=>p.type==='INPUT');if(inputs.length>8)throw new Error('Truth tables support at most eight inputs. Use Tick / evaluate for larger designs.');
  return Array.from({length:2**inputs.length},(_,i)=>{const values=Object.fromEntries(inputs.map((p,j)=>[p.id,(i>>(inputs.length-j-1))&1]));return {...values,...evaluateDigital(c,values).outputs};});
}
