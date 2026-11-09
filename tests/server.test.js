import test from 'node:test';
import assert from 'node:assert/strict';
import {createServer} from '../server.mjs';
import {cloneExample} from '../src/examples.js';
import {parseResource} from '../src/resources.js';
test('local server serves the workbench, hides private files, and blocks cross-origin AI calls',async()=>{
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try {
    const page=await fetch(base);assert.equal(page.status,200);assert.match(await page.text(),/Circuit Studio/);
    for(const p of ['/server.mjs','/.env','/.git/config','/package.json'])assert.equal((await fetch(base+p)).status,404);
    assert.equal((await fetch(base+'/src/app.js')).status,200);
    assert.equal((await fetch(base+'/src/fonts.css')).status,200);
    assert.equal((await fetch(base+'/api/status')).status,200);
    assert.equal((await fetch(base+'/api/assistant',{method:'POST',headers:{Origin:'https://example.com'}})).status,403);
  }finally {await new Promise(resolve=>server.close(resolve));}
});
test('AI can search, download and install a missing model before building a simulatable circuit',async()=>{
  const originalFetch=globalThis.fetch,oldModel=process.env.OLLAMA_MODEL,oldURL=process.env.OLLAMA_URL;
  process.env.OLLAMA_MODEL='mock-model';process.env.OLLAMA_URL='http://ollama.test';
  const resource=parseResource({name:'Missing divider',sourceUrl:'https://example.org/model.lib',spice:'.subckt AIDIV IN OUT GND\nR1 IN OUT 1k\nR2 OUT GND 1k\n.ends AIDIV'});let retrieved=0,turn=0,searched=0;
  globalThis.fetch=async(url,options)=>{
    if(String(url).startsWith('http://ollama.test')){let payload;if(turn++===0)payload={modelSearch:'AIDIV divider'};else if(turn===2)payload={modelRequests:[{url:'https://example.org/model.lib'}]};else payload={explanation:'Uses the requested external model.',circuit:{version:1,name:'External AI circuit',mode:'analog',components:[{id:'V1',type:'V',value:5,nodes:['in','0'],x:100,y:100},{id:'X1',type:'X',modelName:'AIDIV',value:1,nodes:['in','out','0'],x:400,y:100}]}};return new Response(JSON.stringify({message:{content:JSON.stringify(payload)}}));}
    return originalFetch(url,options);
  };
  const server=createServer({engineCheck:async()=>false,searchResources:async query=>{assert.equal(query,'AIDIV divider');searched++;return [{url:'https://example.org/model.lib',title:'Model'}];},fetchResource:async input=>{assert.equal(input.url,'https://example.org/model.lib');retrieved++;return resource;}});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  try{const response=await originalFetch(`http://127.0.0.1:${server.address().port}/api/assistant`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Use the missing divider model',circuit:cloneExample('divider')})});const data=await response.json();assert.equal(response.status,200,JSON.stringify(data));assert.equal(retrieved,1);assert.equal(searched,1);assert.equal(data.attempts,3);assert.equal(data.verification.passed,true);assert.match(data.circuit.components[1].libraryId,/^ext_/);assert.equal(data.circuit.resources[0].sourceUrl,'https://example.org/model.lib');}
  finally{globalThis.fetch=originalFetch;if(oldModel===undefined)delete process.env.OLLAMA_MODEL;else process.env.OLLAMA_MODEL=oldModel;if(oldURL===undefined)delete process.env.OLLAMA_URL;else process.env.OLLAMA_URL=oldURL;await new Promise(resolve=>server.close(resolve));}
});
test('AI adapter validates generated projects and handles upstream failures',async()=>{
  const originalFetch=globalThis.fetch;
  const oldModel=process.env.OLLAMA_MODEL,oldURL=process.env.OLLAMA_URL;
  process.env.OLLAMA_MODEL='mock-model';process.env.OLLAMA_URL='http://ollama.test';
  let scenario='valid',repairCalls=0;
  globalThis.fetch=async (url,options)=>{
    if(String(url).startsWith('http://ollama.test')){
      const request=JSON.parse(options.body);assert.equal(request.stream,false);assert.equal(request.format,'json');assert.equal(request.model,'mock-model');
      if(scenario==='upstream')return new Response('',{status:503});
      const circuit=cloneExample('divider');if(scenario==='invalid'||(scenario==='repair'&&repairCalls++===0))circuit.components[0].type='MOSFET';
      if(scenario==='repair'&&repairCalls===2)assert.match(request.messages.at(-1).content,/failed validation/);
      return new Response(JSON.stringify({message:{content:JSON.stringify({explanation:'Test proposal',circuit})}}),{headers:{'Content-Type':'application/json'}});
    }
    return originalFetch(url,options);
  };
  const server=createServer();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const base=`http://127.0.0.1:${server.address().port}`;
  try{
    const post=()=>originalFetch(base+'/api/assistant',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({prompt:'Build a divider',circuit:cloneExample('divider')})});
    const success=await post();assert.equal(success.status,200);assert.equal((await success.json()).circuit.name,'5 V voltage divider');
    scenario='repair';const repaired=await post();assert.equal(repaired.status,200);const repairedData=await repaired.json();assert.equal(repairedData.attempts,2);assert.equal(repairedData.verification.passed,true);
    scenario='invalid';assert.equal((await post()).status,400);
    scenario='upstream';assert.match((await (await post()).json()).error,/model request failed/);
  }finally{
    globalThis.fetch=originalFetch;
    if(oldModel===undefined)delete process.env.OLLAMA_MODEL;else process.env.OLLAMA_MODEL=oldModel;
    if(oldURL===undefined)delete process.env.OLLAMA_URL;else process.env.OLLAMA_URL=oldURL;
    await new Promise(resolve=>server.close(resolve));
  }
});
