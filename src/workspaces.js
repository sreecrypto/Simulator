import {validateCircuit} from './model.js';
import {microcontrollerProject} from './microcontrollers.js';
export function validateSession(data){
  if(!data||data.version!==1||!Array.isArray(data.documents)||data.documents.length<1||data.documents.length>24)throw new Error('Workspace bundle must contain 1–24 documents.');
  const ids=new Set();
  for(const doc of data.documents){
    if(!doc||typeof doc.id!=='string'||doc.id.length>80||ids.has(doc.id)||!['analog','digital','fsm','cpu'].includes(doc.kind)||typeof doc.name!=='string'||doc.name.length>120)throw new Error('Invalid workspace document.');
    ids.add(doc.id);
    if(['analog','digital'].includes(doc.kind)){validateCircuit(doc.content);if(doc.content.mode!==doc.kind)throw new Error('Workspace type does not match its circuit.');}
    else if(doc.kind==='cpu')microcontrollerProject(doc.content);
    else if(typeof doc.content?.source!=='string'||doc.content.source.length>100000)throw new Error('Invalid workspace source.');
  }
  if(!ids.has(data.activeId))throw new Error('Active workspace is missing.');
  return data;
}
export function makeDocument(kind,content,name){return {id:crypto.randomUUID(),kind,name:name||content.name||({fsm:'State machine',cpu:'Microcontroller program'}[kind]),content:structuredClone(content)};}
export function duplicateDocument(doc){const copy=makeDocument(doc.kind,doc.content,(doc.name+' copy').slice(0,120));if(['analog','digital'].includes(copy.kind))copy.content.name=copy.name;return copy;}
