import { operatingPoint, transient, acSweep } from '../src/analog.js';

export async function runAnalog({ circuit, engine = 'builtin', options = {} }, ngspice) {
  if (circuit?.mode !== 'analog') throw new Error('An analog circuit is required.');
  const { kind = 'transient', duration, steps } = options;
  if (!['dc', 'ac', 'transient'].includes(kind)) throw new Error('Unknown analog analysis.');
  if (engine === 'ngspice') return ngspice(circuit, { kind, duration, steps });
  if (engine !== 'builtin') throw new Error('Unknown analog engine.');
  if (kind === 'dc') return operatingPoint(circuit);
  if (kind === 'ac') return acSweep(circuit);
  return transient(circuit, { duration, steps });
}
