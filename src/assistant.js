import {cloneExample} from './examples.js';
import {advancedRecipe} from './builders.js';
export function recipe(prompt) {
  const advanced=advancedRecipe(prompt);if(advanced)return advanced;
  const p=prompt.toLowerCase();
  let key;
  if(/half.?adder/.test(p))key='halfadder';
  else if(/flip.?flop|dff/.test(p))key='flipflop';
  else if(/divider/.test(p))key='divider';
  else if(/rlc|resonan/.test(p))key='rlc';
  else if(/low.?pass|rc filter/.test(p))key='lowpass';
  if(!key)throw new Error('Offline recipes support voltage dividers, RC/RLC filters, half adders, flip-flops, ripple-carry adders, ALUs, counters, shift registers, decoders, multistage active filters and Wheatstone bridges. Enable a local model for broader requests.');
  const circuit=cloneExample(key);
  const volts=p.match(/(\d+(?:\.\d+)?)\s*v(?:olt)?s?\b/);
  const source=circuit.components.find(c=>c.type==='V');
  if(volts&&source)source.value=Number(volts[1]);
  return {circuit,explanation:`Prepared ${circuit.name}${volts&&source?` with a ${volts[1]} V source`:''}. This is an offline recipe, not a language model. Only the source voltage is extracted from your prompt; edit other values in the inspector. Review connections, then apply and run the simulation.`};
}
