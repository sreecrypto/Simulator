import {mkdtemp,writeFile,readFile,stat,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {spice,validateCircuit} from './src/model.js';
const execute=promisify(execFile);
export async function ngspiceAvailable(){try{await execute(process.env.NGSPICE_BIN||'ngspice',['--version'],{timeout:5000,windowsHide:true});return true;}catch{return false;}}
export function parseAsciiRaw(text,kind){
  const variableCount=Number(text.match(/No\. Variables:\s*(\d+)/i)?.[1]),pointCount=Number(text.match(/No\. Points:\s*(\d+)/i)?.[1]);
  if(!variableCount||!pointCount||pointCount>200000||variableCount>1024)throw new Error('Invalid or oversized ngspice raw data.');
  const block=text.split(/Variables:\s*\r?\n/i)[1];if(!block)throw new Error('Missing ngspice variables.');
  const [header,values]=block.split(/Values:\s*\r?\n/i);if(values===undefined)throw new Error('ngspice must produce ASCII raw data.');
  const variables=header.trim().split(/\r?\n/).map(line=>line.trim().split(/\s+/)[1]);
  const tokens=values.trim().split(/\s+/),points=[];let cursor=0;
  for(let row=0;row<pointCount;row++){
    cursor++;const vector=[];
    for(let col=0;col<variableCount;col++){const entry=tokens[cursor++];if(entry===undefined)throw new Error('Truncated ngspice raw data.');const [re,im=0]=entry.split(',').map(Number);if(!Number.isFinite(re)||!Number.isFinite(im))throw new Error('Nonfinite ngspice result.');vector.push({re,im});}points.push(vector);
  }
  const named=variables.map((v,i)=>({index:i,name:v?.match(/^v\((.*)\)$/i)?.[1]})).filter(v=>v.name);
  const nodes=named.map(v=>v.name);
  if(kind==='dc')return {nodes:Object.fromEntries([['0',0],...named.map(v=>[v.name,points[0][v.index].re])]),currents:{}};
  return {nodes,rows:points.map(point=>Object.fromEntries([[kind==='ac'?'f':'t',point[0].re],...named.map(v=>{const z=point[v.index];return [v.name,kind==='ac'?{magnitude:Math.hypot(z.re,z.im),phase:Math.atan2(z.im,z.re)*180/Math.PI}:z.re];})]))};
}
export async function simulateNgspice(circuit,{kind='transient',duration=.01,steps=400}={}){
  validateCircuit(circuit);if(circuit.mode!=='analog'||!['dc','transient','ac'].includes(kind)||!Number.isFinite(duration)||duration<=0||duration>1000||!Number.isInteger(steps)||steps<2||steps>2000)throw new Error('Invalid SPICE analysis settings.');
  const folder=await mkdtemp(path.join(os.tmpdir(),'circuit-studio-'));
  try{
    const analysis=kind==='dc'?'.op':kind==='ac'?'.ac dec 24 10 1000000':`.tran ${duration/steps} ${duration} 0 ${duration/steps}`;
    const netlist=spice(circuit,{duration,steps,analysis:'none'}).replace(/\.end\s*$/i,`.options filetype=ascii\n.save all\n${analysis}\n.end\n`);
    await writeFile(path.join(folder,'circuit.cir'),netlist);
    try{await execute(process.env.NGSPICE_BIN||'ngspice',['-n','-b','-r','result.raw','circuit.cir'],{cwd:folder,env:{...process.env,SPICE_ASCIIRAWFILE:'1'},timeout:30000,maxBuffer:2e6,windowsHide:true});}
    catch(error){if(error.code==='ENOENT')throw new Error('ngspice is not installed. Set NGSPICE_BIN to its executable. Models can still be edited and exported.');throw new Error(`ngspice simulation failed: ${String(error.stderr||error.stdout||error.message).slice(-2500)}`);}
    const rawPath=path.join(folder,'result.raw');if((await stat(rawPath)).size>30e6)throw new Error('SPICE result exceeds 30 MB.');const raw=await readFile(rawPath,'utf8');const data=parseAsciiRaw(raw,kind),names=new Map(circuit.components.flatMap(p=>p.nodes).map(n=>[n.toLowerCase(),n]));
    if(kind==='dc')data.nodes=Object.fromEntries(Object.entries(data.nodes).map(([n,v])=>[names.get(n)||n,v]));else{data.nodes=data.nodes.map(n=>names.get(n)||n);data.rows=data.rows.map(row=>Object.fromEntries(Object.entries(row).map(([n,v])=>[names.get(n)||n,v])));}return data;
  }finally{const target=path.resolve(folder),parent=path.resolve(os.tmpdir());if(path.dirname(target)!==parent||!path.basename(target).startsWith('circuit-studio-'))throw new Error('Unexpected SPICE temporary directory.');await rm(target,{recursive:true,force:true});}
}
