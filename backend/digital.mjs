import { digitalTimeline, truthTable } from '../src/digital.js';
import { verifyWithIcarus } from './icarus.mjs';

export function runDigital({ circuit, kind, duration }) {
  if (circuit?.mode !== 'digital') throw new Error('A digital circuit is required.');
  if (kind === 'truth') return { rows: truthTable(circuit) };
  if (kind === 'tick') return digitalTimeline(circuit, { duration });
  if (kind === 'verify') return verifyWithIcarus(circuit);
  throw new Error('Unknown digital analysis.');
}
