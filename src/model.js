import {componentSpec,expandAnalog,registerResources} from './catalog.js';
import {validateResources} from './resources.js';
import {validateGenerator,spiceSource} from './waveforms.js';
export const analogTypes = ['R','C','L','V','I','E','G','D','Q','M','J','S','W','F','H','X','BV','BI','T','K','GROUND','PROBE'];
export const digitalTypes = ['INPUT','CLOCK','OUTPUT','NOT','AND','OR','XOR','NAND','NOR','XNOR','DFF'];
export const pins = {R:2,C:2,L:2,V:2,I:2,E:4,G:4,D:2,Q:3,M:4,J:3,S:4,W:2,F:2,H:2,BV:2,BI:2,T:4,K:0,GROUND:1,PROBE:1,INPUT:1,CLOCK:1,OUTPUT:1,NOT:2,AND:3,OR:3,XOR:3,NAND:3,NOR:3,XNOR:3,DFF:3};
export const pinCount=p=>componentSpec(p)?.pinNames.length??pins[p.type];
export function validateCircuit(c) {
  if (!c || c.version !== 1 || !['analog','digital'].includes(c.mode) || typeof c.name !== 'string' || c.name.length > 120 || !Array.isArray(c.components) || c.components.length > 256) throw new Error('Invalid circuit project (version 1, analog/digital, maximum 256 components).');
  const resources=validateResources(c.resources);registerResources(resources);
  const ids = new Set();
  for (const part of c.components) {
    if (!part || !/^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(part.id) || Object.hasOwn(Object.prototype,part.id) || ids.has(part.id)) throw new Error('Component IDs must be unique letters, digits and underscores, without reserved object names.');
    ids.add(part.id);
    const spec=componentSpec(part);
    if ((part.libraryId && (!spec || spec.mode!==c.mode || spec.type!==part.type)) || (part.type==='BLOCK'&&!spec) || (part.type!=='BLOCK'&&!(c.mode === 'analog' ? analogTypes : digitalTypes).includes(part.type))) throw new Error(`Unsupported ${c.mode} component: ${part.type}`);
    if (!Array.isArray(part.nodes) || part.nodes.length !== pinCount(part) || part.nodes.some(n=> typeof n !== 'string' || !/^[A-Za-z0-9_]{1,24}$/.test(n) || ['__proto__','constructor','prototype','t','f'].includes(n))) throw new Error(`Invalid nodes on ${part.id}. Use letters, digits or underscores; t and f are reserved for simulation axes.`);
    if (![part.x,part.y].every(n=>Number.isFinite(n) && n>=0 && n<=20000)) throw new Error(`Invalid position on ${part.id}.`);
    if (c.mode === 'analog' && (!Number.isFinite(part.value) || (['R','C','L'].includes(part.type) && part.value <= 0))) throw new Error(`Invalid SI value on ${part.id}.`);
    if (['INPUT'].includes(part.type) && ![0,1].includes(part.value)) throw new Error('Inputs must be 0 or 1.');
    if(['V','I','CLOCK'].includes(part.type))validateGenerator(part);
    if(part.rotation!==undefined&&(!Number.isInteger(part.rotation)||part.rotation%90!==0))throw new Error('Rotation must be a multiple of 90 degrees.');
    for(const key of ['mirrorX','mirrorY'])if(part[key]!==undefined&&typeof part[key]!=='boolean')throw new Error('Invalid mirror transform.');
    if(part.modelName!==undefined&&!/^[A-Za-z_][A-Za-z0-9_.$-]{0,63}$/.test(part.modelName))throw new Error('Invalid SPICE model name.');
    if(['D','Q','M','J','S','W','X'].includes(part.type)){
      const resourceDefinition=resources.flatMap(r=>r.definitions).find(d=>d.name.toLowerCase()===part.modelName?.toLowerCase());
      const bundled=spec?.modelText&&spec.defaults.modelName.toLowerCase()===part.modelName?.toLowerCase();
      if(!bundled&&!resourceDefinition)throw new Error(`${part.id} needs its actual SPICE model definition. Import the model resource and set its model name.`);
      if(resourceDefinition&&resourceDefinition.type!==part.type)throw new Error(`${part.id} does not match the imported model's device type.`);
    }
    if(part.expression!==undefined&&(typeof part.expression!=='string'||part.expression.length>2000||/[\r\n;`]/.test(part.expression)||/\b(?:file|shell|system)\b/i.test(part.expression)))throw new Error('Invalid behavioral expression.');
    if(part.control!==undefined&&!/^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(part.control))throw new Error('Current control must name a voltage source reference.');
    if(part.type==='K'&&(![part.inductor1,part.inductor2].every(n=>typeof n==='string'&&/^[A-Za-z][A-Za-z0-9_]{0,23}$/.test(n))||Math.abs(part.value)>1))throw new Error('Mutual inductance needs two inductor references and a coupling coefficient between -1 and 1.');
    if (part.frequency !== undefined && (!Number.isFinite(part.frequency) || part.frequency <= 0)) throw new Error('Source frequency must be positive.');
    if (part.offset !== undefined && !Number.isFinite(part.offset)) throw new Error('Source offset must be finite.');
  }
  if (c.wires !== undefined && (!Array.isArray(c.wires) || c.wires.length > 200 || c.wires.some(w=> !Array.isArray(w.points) || w.points.length>20 || w.points.some(p=>!Array.isArray(p) || p.length!==2 || p.some(v=>!Number.isFinite(v) || v<0 || v>1600))))) throw new Error('Invalid wire geometry.');
  return c;
}
export function parseValue(text) {
  const match = String(text).trim().match(/^([+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?)\s*(meg|[fpnumkgt])?\s*(?:ohm|Ω|v|a|f|h|hz|s)?$/i);
  if (!match) throw new Error('Use a number or engineering value, such as 4.7k, 100n or 5.');
  const factors = {f:1e-15,p:1e-12,n:1e-9,u:1e-6,m:1e-3,k:1e3,meg:1e6,g:1e9,t:1e12};
  const n = Number(match[1]) * (factors[(match[2] || '').toLowerCase()] || 1);
  if (!Number.isFinite(n)) throw new Error('Value must be finite.');
  return n;
}
export function formatValue(n,unit='') {
  if (n === 0) return `0${unit}`;
  for (const [scale,prefix] of [[1e9,'G'],[1e6,'meg'],[1e3,'k'],[1,''],[1e-3,'m'],[1e-6,'u'],[1e-9,'n'],[1e-12,'p']]) {
    if (Math.abs(n)>=scale) return `${Number((n/scale).toPrecision(4))}${prefix}${unit}`;
  }
  return `${n.toExponential(3)}${unit}`;
}
export function spice(c,{duration=.01,steps=400,analysis='default'}={}) {
  validateCircuit(c);
  if (c.mode !== 'analog') throw new Error('SPICE export is available for analog circuits. Use JSON for digital projects.');
  c=expandAnalog(c);
  const exportedIds=new Set();
  const definitions=[...new Set([...c.components.map(p=>componentSpec(p)?.modelText).filter(Boolean),...validateResources(c.resources).map(r=>r.spice)])];
  return [`* ${c.name.replace(/[\r\n]/g,' ')}`, '* Generated by Circuit Studio. Units are SI.', ...c.components.map(p=> {
    const prefix=['BV','BI'].includes(p.type)?'B':p.type;
    const base=p.id.startsWith(prefix) ? p.id : prefix+p.id;let id=base,suffix=2;
    while(exportedIds.has(id.toLowerCase()))id=base+'_'+suffix++;
    exportedIds.add(id.toLowerCase());
    let value=String(p.value);
    if(['V','I'].includes(p.type))value=spiceSource(p,{duration,steps});
    if(['D','Q','M','J','S','W','X'].includes(p.type)){if(!p.modelName)throw new Error(`${p.id} needs a SPICE model.`);value=p.modelName;}
    if(['F','H','W'].includes(p.type))value=`${p.control||'V1'} ${value}`;
    if(['BV','BI'].includes(p.type))value=`${p.type==='BV'?'V':'I'}=${p.expression||'0'}`;
    if(p.type==='T')value=`Z0=${p.value} TD=${p.delay||1e-6}`;
    if(p.type==='K')value=`${p.inductor1} ${p.inductor2} ${p.value}`;
    return `${id} ${p.nodes.join(' ')} ${value}`;
  }),...definitions,...(analysis==='none'?[]:['.op',`.tran ${duration/steps} ${duration}`]),'.end',''].join('\n');
}
