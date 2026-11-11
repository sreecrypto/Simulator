import {validateCircuit} from './model.js';
import {operatingPoint,transient} from './analog.js';
import {evaluateDigital} from './digital.js';
export function verifyProposal(c){
  validateCircuit(c);if(!c.components.length)throw new Error('Generated circuit is empty.');
  if(c.mode==='analog'){
    operatingPoint(c);transient(c,{duration:.001,steps:8});
    return {passed:true,summary:'DC solve + 8-step transient smoke check passed. Design specifications are not proven.'};
  }
  const inputs=c.components.filter(part=>part.type==='INPUT');
  const patterns=[()=>0,()=>1,index=>index%2,index=>1-index%2];
  const vectors=inputs.length?[{},...patterns.map(pattern=>
    Object.fromEntries(inputs.map((part,index)=>[part.id,pattern(index)])))]:[{}];
  let memory={};
  for(const vector of vectors){
    memory=evaluateDigital(c,vector,memory,0).memory;
    memory=evaluateDigital(c,vector,memory,1).memory;
  }
  return {passed:true,summary:`Digital connectivity and two clock phases checked across ${vectors.length} input patterns. Functional specifications are not proven.`};
}
