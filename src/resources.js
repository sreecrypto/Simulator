const identifier=/^[A-Za-z_][A-Za-z0-9_.$-]{0,63}$/;
export function resourceHash(text){let hash=2166136261;for(const c of text)hash=Math.imul(hash^c.charCodeAt(0),16777619);return (hash>>>0).toString(16);}
export function parseResource(input){
  if(!input||typeof input.spice!=='string'||input.spice.length>300000||!input.spice.trim())throw new Error('A resource needs 1–300,000 characters of SPICE model text.');
  const text=input.spice.replace(/\r/g,'');
  if(/[\x00-\x08`]/.test(text)||/\b(?:shell|system|pre_osdi|osdi|codemodel|file|popen)\b/i.test(text))throw new Error('Model resources cannot access files or execute commands.');
  const lines=[];for(const raw of text.split('\n')){const line=raw.split(';')[0].trim();if(!line||line.startsWith('*'))continue;if(line.startsWith('+')){if(!lines.length)throw new Error('Unexpected continuation line.');lines[lines.length-1]+=' '+line.slice(1).trim();}else lines.push(line);}
  const definitions=[];let current=null;
  for(const line of lines){
    const tokens=line.split(/\s+/),head=tokens[0].toLowerCase();
    if(head==='.subckt'){
      if(current)throw new Error('Nested .subckt declarations are not supported.');
      const name=tokens[1],pinNames=tokens.slice(2).filter(t=>!t.includes('=')&&!/^params:$/i.test(t));
      if(!identifier.test(name)||pinNames.length<1||pinNames.length>128||pinNames.some(n=>!/^[A-Za-z0-9_+.$-]{1,64}$/.test(n)))throw new Error('Invalid .subckt name or pin list.');
      current={name,type:'X',pinNames,lines:[],parameters:Object.fromEntries(tokens.slice(2).filter(t=>t.includes('=')).map(t=>t.split('=')))};definitions.push(current);
    }else if(head==='.ends'){if(!current)throw new Error('Unexpected .ends.');current=null;}
    else if(head==='.model'){
      const match=line.match(/^\.model\s+(\S+)\s+([A-Za-z0-9_]+)\b/i);if(!match||!identifier.test(match[1]))throw new Error('Invalid .model declaration.');
      const kind=match[2].toUpperCase(),type={D:'D',NPN:'Q',PNP:'Q',NMOS:'M',PMOS:'M',NJF:'J',PJF:'J',SW:'S',CSW:'W'}[kind];
      if(!type)throw new Error(`Model type ${kind} is not supported by the model importer.`);
      if(!current)definitions.push({name:match[1],type,pinNames:({D:['A','K'],Q:['C','B','E'],M:['D','G','S','B'],J:['D','G','S'],S:['A','B','CTRL+','CTRL−'],W:['A','B']}[type]),kind});
      if(current)current.lines.push(line);
    }else if(head.startsWith('.')){
      if(!['.param','.func'].includes(head))throw new Error(`Directive ${tokens[0]} is not allowed in model resources. Import a self-contained model without control/include commands.`);
      if(current)current.lines.push(line);
    }else {
      if(!current||!/^([RCLVIEGFHDQJMKSWXBT])/i.test(tokens[0]))throw new Error(`Unsupported resource statement: ${tokens[0]}`);
      current.lines.push(line);
    }
  }
  if(current)throw new Error('Missing .ends in subcircuit.');
  if(!definitions.length||definitions.length>100)throw new Error('Resource must contain 1–100 public .model or .subckt definitions.');
  const names=new Set();for(const d of definitions){if(names.has(d.name.toLowerCase()))throw new Error('Duplicate model name in resource.');names.add(d.name.toLowerCase());}
  return {id:'resource_'+resourceHash(text),name:String(input.name||'Imported model').slice(0,120),sourceUrl:String(input.sourceUrl||'').slice(0,2000),license:String(input.license||'Not specified by source').slice(0,500),spice:text,definitions};
}
export function validateResources(resources=[]){
  if(!Array.isArray(resources)||resources.length>20)throw new Error('Up to 20 model resources are allowed per circuit.');
  if(resources.reduce((n,r)=>n+(r.spice?.length||0),0)>2000000)throw new Error('Combined model resources exceed 2 MB.');
  const parsed=resources.map(parseResource),names=new Set();for(const resource of parsed)for(const definition of resource.definitions){if(names.has(definition.name.toLowerCase()))throw new Error(`Duplicate public model name ${definition.name} across resources.`);names.add(definition.name.toLowerCase());}return parsed;
}
export function resourceSpecs(resource){
  return resource.definitions.map((definition,index)=>({id:`ext_${resourceHash(resource.spice)}_${index}`,name:definition.name,mode:'analog',category:'Imported models',type:definition.type,pinNames:definition.pinNames,defaults:{value:1,modelName:definition.name,resourceId:resource.id},model:null,resource,support:'model',description:`${definition.type==='X'?'SPICE subcircuit':'SPICE device model'} · ${resource.sourceUrl||'local file'}. Pin order must match the source definition.`}));
}
function numeric(value,parameters){const raw=String(value).replace(/^\{(.*)\}$/,'$1');if(raw in parameters)return numeric(parameters[raw],{});const m=raw.match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)(meg|[fpnumkgt])?$/i);if(!m)throw new Error('This resource uses expressions that require ngspice.');return Number(m[1])*({f:1e-15,p:1e-12,n:1e-9,u:1e-6,m:1e-3,k:1e3,meg:1e6,g:1e9,t:1e12}[(m[2]||'').toLowerCase()]||1);}
export function expandResourceParts(circuit){
  const resources=validateResources(circuit.resources),definitions=new Map(resources.flatMap(r=>r.definitions.map(d=>[d.name.toLowerCase(),d]))),parts=[];
  function expand(p,depth=0){
    if(p.type!=='X'){parts.push(p);return;}
    const def=definitions.get(p.modelName?.toLowerCase());if(!def||def.type!=='X')throw new Error(`Subcircuit ${p.modelName} requires ngspice or an imported linear model.`);
    if(depth>=8)throw new Error('Subcircuit recursion exceeds eight levels.');
    const nets=new Map(def.pinNames.map((n,i)=>[n.toLowerCase(),p.nodes[i]])),net=n=>n==='0'?'0':nets.get(n.toLowerCase())||`__${p.id}_${n.toLowerCase()}`;
    for(const line of def.lines){
      if(line.startsWith('.'))throw new Error('Model directives require the ngspice engine.');
      const tokens=line.split(/\s+/),type=tokens[0][0].toUpperCase(),count=['E','G'].includes(type)?4:['R','C','L','V','I'].includes(type)?2:0;
      if(type==='X'){const name=tokens.at(-1),sub=definitions.get(name.toLowerCase());if(!sub)throw new Error(`Missing dependency ${name}.`);expand({id:`${p.id}_${tokens[0]}`,type:'X',modelName:name,nodes:tokens.slice(1,-1).map(net),x:p.x,y:p.y,value:1},depth+1);continue;}
      if(!count||tokens.length!==count+2)throw new Error(`Device ${tokens[0]} requires the ngspice engine.`);
      parts.push({id:`__${p.id}_${tokens[0]}`,type,nodes:tokens.slice(1,count+1).map(net),value:numeric(tokens.at(-1),def.parameters),x:p.x,y:p.y});
    }
  }
  for(const p of circuit.components)expand(p);return {...circuit,components:parts};
}
