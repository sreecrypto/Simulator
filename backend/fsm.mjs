import { validateFSM, stepFSM } from '../src/fsm.js';

export function runFSM({ machine, action, state, input }) {
  if (action === 'reset') return { state: validateFSM(machine).initial };
  if (action === 'step') {
    if (typeof input !== 'string') throw new Error('Enter an input event.');
    return stepFSM(machine, state, input);
  }
  throw new Error('Unknown state machine action.');
}
