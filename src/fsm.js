export const defaultFSM={initial:'IDLE',states:['IDLE','RUN','DONE'],transitions:[{from:'IDLE',input:'start',to:'RUN',output:'busy'},{from:'RUN',input:'finish',to:'DONE',output:'ready'},{from:'DONE',input:'reset',to:'IDLE',output:'idle'}]};
export function validateFSM(machine) {
  if(!machine || !Array.isArray(machine.states) || machine.states.length<1 || machine.states.length>50 || machine.states.some(s=>typeof s!=='string'||!s.length||s.length>50) || new Set(machine.states).size!==machine.states.length || !machine.states.includes(machine.initial) || !Array.isArray(machine.transitions) || machine.transitions.length>200) throw new Error('Invalid FSM states or initial state.');
  const keys=new Set();
  for(const t of machine.transitions) {
    if(!machine.states.includes(t.from)||!machine.states.includes(t.to)||typeof t.input!=='string'||typeof t.output!=='string'||keys.has(JSON.stringify([t.from,t.input])))throw new Error('Invalid or ambiguous FSM transition.');
    keys.add(JSON.stringify([t.from,t.input]));
  }
  return machine;
}
export function stepFSM(machine,state,input) {
  validateFSM(machine);
  if(!machine.states.includes(state))throw new Error('Unknown current state.');
  const transition=machine.transitions.find(t=>t.from===state&&t.input===input);
  if(!transition)throw new Error(`No transition from ${state} for input “${input}”.`);
  return {state:transition.to,output:transition.output};
}
