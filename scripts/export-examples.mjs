import {mkdir,writeFile} from 'node:fs/promises';
import {examples} from '../src/examples.js';
import {defaultFSM} from '../src/fsm.js';
import {demoProgram} from '../src/cpu.js';
await mkdir(new URL('../examples/',import.meta.url),{recursive:true});
for(const [name,circuit] of Object.entries(examples)) await writeFile(new URL(`../examples/${name}.json`,import.meta.url),JSON.stringify(circuit,null,2)+'\n');
await writeFile(new URL('../examples/state-machine.json',import.meta.url),JSON.stringify(defaultFSM,null,2)+'\n');
await writeFile(new URL('../examples/addition.asm',import.meta.url),demoProgram+'\n');
console.log('Wrote 5 circuit projects, an FSM definition, and a CPU program.');
