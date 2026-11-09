import { readdir } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
const dirs=['src','scripts','tests'];
let failed=false;
for(const file of ['server.mjs','server-resources.mjs','ngspice.mjs',...(await Promise.all(dirs.map(async dir=>(await readdir(dir)).filter(f=>/\.(mjs|js)$/.test(f)).map(f=>`${dir}/${f}`)))).flat()]) {
  const result=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});
  if(result.status!==0){failed=true;console.error(result.stderr);}
}
if(failed)process.exit(1);
console.log('All JavaScript files passed syntax checks.');
