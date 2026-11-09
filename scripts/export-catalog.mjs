import {writeFile,mkdir} from 'node:fs/promises';
import {catalog,catalogFor} from '../src/catalog.js';
import {recipe} from '../src/assistant.js';
await mkdir(new URL('../docs/',import.meta.url),{recursive:true});
let text='# Component families — v0.3\n\nAnalog components are editable families: one resistor, capacitor and inductor entry each. Values are set in component properties. Legacy valued presets remain readable in old project files but are hidden from the library. Generic nonlinear and advanced SPICE families require an installed ngspice engine. Manufacturer models can be imported separately; the LTspice library itself is not bundled.\n\nDigital buses use separate pins, bit 0 first. Subtractor CARRY means borrow. Priority encoders select the highest numbered asserted input. Counter RESET is active-high asynchronous; ENABLE gates rising-edge updates. Registers and shifts update on rising edges. Clock inputs must be driven.\n';
for(const mode of ['analog','digital']){
  text+=`\n## ${mode==='analog'?'Analog / electronic':'Digital / logic'} — ${catalogFor(mode).length} entries\n\n| ID | Component | Category | Pins (ordered) | Engine |\n| --- | --- | --- | --- | --- |\n`;
  for(const spec of catalogFor(mode))text+=`| ${spec.id} | ${spec.name} | ${spec.category} | ${spec.pinNames.join(', ')||'Inductor reference fields'} | ${spec.support==='ngspice'?'ngspice':'Built-in'} |\n`;
}
await writeFile(new URL('../docs/CATALOG.md',import.meta.url),text);
await mkdir(new URL('../examples/',import.meta.url),{recursive:true});
for(const [name,prompt] of [['alu-8bit','Build an 8-bit ALU'],['ripple-adder-16bit','Build a 16-bit ripple-carry adder'],['counter-8bit','Build an 8-bit counter'],['active-filter','Build a 3-stage active filter with gain 2'],['wheatstone-bridge','Build a Wheatstone bridge']])await writeFile(new URL(`../examples/${name}.json`,import.meta.url),JSON.stringify(recipe(prompt).circuit,null,2)+'\n');
console.log('Exported current component-family catalog and 5 advanced circuit examples.');
