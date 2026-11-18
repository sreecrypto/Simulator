import { runAnalog } from '../../backend/analog.mjs';
import { runFSM } from '../../backend/fsm.mjs';
import { runMicrocontroller } from '../../backend/microcontrollers.mjs';
import { digitalTimeline, truthTable } from '../digital.js';

export function runInBrowser(mode, input) {
  if (mode === 'analog') return runAnalog({ ...input, engine: 'builtin' });
  if (mode === 'fsm') return runFSM(input);
  if (mode === 'microcontrollers') return runMicrocontroller(input);
  if (mode === 'digital' && input.circuit?.mode === 'digital') {
    if (input.kind === 'truth') return { rows: truthTable(input.circuit) };
    if (input.kind === 'tick') return digitalTimeline(input.circuit, { duration: input.duration });
  }
  throw new Error('This analysis requires the desktop server.');
}
