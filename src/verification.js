import {validateCircuit} from './model.js';
import {operatingPoint,transient} from './analog.js';
import {evaluateDigital} from './digital.js';
export function verifyProposal(c){
  validateCircuit(c);if(!c.components.length)throw new Error('Generated circuit is empty.');
  if(c.mode==='analog'){
    operatingPoint(c);transient(c,{duration:.001,steps:8});
    return {passed:true,summary:'DC solve + 8-step transient smoke check passed. Design specifications are not proven.'};
  }
  const initial=evaluateDigital(c);evaluateDigital(c,{},initial.memory,1);
  return {passed:true,summary:'Digital connectivity + two clock phases checked. Functional specifications are not proven.'};
}
