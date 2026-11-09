import {validateCircuit} from './model.js';
import {expandAnalog} from './catalog.js';
import {expandResourceParts} from './resources.js';
import {sourceValue} from './waveforms.js';

// Dense modified nodal analysis with pivoting. Intended for small teaching circuits.
export function solve(a,b) {
  a=a.map((r,i)=>[...r,b[i]]);
  const n=b.length;
  for(let col=0;col<n;col++) {
    let pivot=col;
    for(let row=col+1;row<n;row++) if(Math.abs(a[row][col])>Math.abs(a[pivot][col])) pivot=row;
    if(Math.abs(a[pivot][col])<1e-18) throw new Error('Singular circuit: check ground, floating nodes, and parallel ideal voltage sources.');
    [a[col],a[pivot]]=[a[pivot],a[col]];
    for(let row=col+1;row<n;row++) {
      const f=a[row][col]/a[col][col];
      for(let k=col;k<=n;k++) a[row][k]-=f*a[col][k];
    }
  }
  const x=Array(n).fill(0);
  for(let row=n-1;row>=0;row--) {
    let v=a[row][n];
    for(let k=row+1;k<n;k++) v-=a[row][k]*x[k];
    x[row]=v/a[row][row];
  }
  if(x.some(v=>!Number.isFinite(v))) throw new Error('Numerical overflow. Check component values.');
  return x;
}
function source(p,t,dc) {
  return sourceValue(p,t,dc);
}
function prepare(c){
  validateCircuit(c);const expanded=expandAnalog(expandResourceParts(c)),nets=new Set(expanded.components.flatMap(p=>p.nodes));
  for(const p of c.components.filter(p=>p.type==='PROBE'))if(!nets.has(p.nodes[0]))throw new Error(`Voltage probe ${p.id} is not connected to a circuit net.`);
  return expanded;
}
function setup(c) {
  if(c.mode!=='analog' || !c.components.length) throw new Error('Add analog components first.');
  const unsupported=c.components.find(p=>!['R','C','L','V','I','E','G'].includes(p.type));
  if(unsupported)throw new Error(`${unsupported.id} (${unsupported.type}) requires the ngspice engine. Configure NGSPICE_BIN or export the SPICE netlist.`);
  const nodes=[...new Set(c.components.flatMap(p=>p.nodes))].filter(n=>n!=='0');
  if(!c.components.some(p=>p.nodes.includes('0'))) throw new Error('Connect a component to ground (node 0).');
  const branches=c.components.filter(p=>['V','L','E'].includes(p.type));
  if(nodes.length+branches.length>256)throw new Error('Analog analysis is limited to 256 unknowns after expanding subcircuits. Split this design into workspaces.');
  return {nodes,branches,size:nodes.length+branches.length,index:n=>nodes.indexOf(n),branch:p=>nodes.length+branches.indexOf(p)};
}
function stamp(c,layout,kind,t=0,dt=1e-5,previous={}) {
  const {size,index,branch}=layout;
  const a=Array.from({length:size},()=>Array(size).fill(0)), b=Array(size).fill(0);
  const put=(i,j,v)=>{if(i>=0&&j>=0)a[i][j]+=v;};
  const rhs=(i,v)=>{if(i>=0)b[i]+=v;};
  const conduct=(i,j,g)=>{put(i,i,g);put(j,j,g);put(i,j,-g);put(j,i,-g);};
  const current=(i,j,v)=>{rhs(i,-v);rhs(j,v);};
  for(const p of c.components) {
    const [i,j]=p.nodes.map(index);
    if(p.type==='R') conduct(i,j,1/p.value);
    if(p.type==='I') current(i,j,source(p,t,kind==='dc'));
    if(p.type==='C' && kind==='transient') {
      const g=p.value/dt;
      conduct(i,j,g); current(i,j,-g*(previous[p.id]||0));
    }
    if(p.type==='G') {const cp=index(p.nodes[2]),cn=index(p.nodes[3]);put(i,cp,p.value);put(i,cn,-p.value);put(j,cp,-p.value);put(j,cn,p.value);}
    if(['V','L','E'].includes(p.type)) {
      const k=branch(p); put(i,k,1);put(j,k,-1);put(k,i,1);put(k,j,-1);
      if(p.type==='V') rhs(k,source(p,t,kind==='dc'));
      else if(p.type==='E') {put(k,index(p.nodes[2]),-p.value);put(k,index(p.nodes[3]),p.value);}
      else if(kind==='transient') {put(k,k,-p.value/dt);rhs(k,-p.value/dt*(previous[p.id]||0));}
    }
  }
  return solve(a,b);
}
export function operatingPoint(c) {
  c=prepare(c);
  const layout=setup(c), x=stamp(c,layout,'dc');
  return {nodes:Object.fromEntries([['0',0],...layout.nodes.map((n,i)=>[n,x[i]])]),currents:Object.fromEntries(layout.branches.map((p,i)=>[p.id,x[layout.nodes.length+i]]))};
}
export function transient(c,{duration=0.01,steps=400}={}) {
  c=prepare(c);
  if(!Number.isFinite(duration) || duration<=0 || !Number.isInteger(steps) || steps<2 || steps>2000) throw new Error('Use a positive duration and 2–2000 steps.');
  const layout=setup(c), dt=duration/steps, previous={}, rows=[];
  // Zero capacitor voltage and inductor current initial conditions, backward Euler.
  for(let step=1;step<=steps;step++) {
    const t=step*dt, x=stamp(c,layout,'transient',t,dt,previous);
    const voltage=n=>n==='0'?0:x[layout.index(n)];
    for(const p of c.components) {
      if(p.type==='C') previous[p.id]=voltage(p.nodes[0])-voltage(p.nodes[1]);
      if(p.type==='L') previous[p.id]=x[layout.branch(p)];
    }
    rows.push({t,...Object.fromEntries(layout.nodes.map((n,i)=>[n,x[i]]))});
  }
  return {nodes:layout.nodes,rows};
}
export function acSweep(c,{start=10,stop=1e6,points=121}={}) {
  c=prepare(c);
  if(!Number.isFinite(start)||!Number.isFinite(stop)||start<=0||stop<=start||!Number.isInteger(points)||points<2||points>500) throw new Error('Invalid AC sweep range.');
  const layout=setup(c), {size,index,branch}=layout, rows=[];
  for(let s=0;s<points;s++) {
    const f=start*(stop/start)**(s/(points-1)), w=2*Math.PI*f;
    const a=Array.from({length:2*size},()=>Array(2*size).fill(0)),b=Array(2*size).fill(0);
    const put=(i,j,re,im=0)=>{if(i<0||j<0)return; a[i][j]+=re;a[i][j+size]-=im;a[i+size][j]+=im;a[i+size][j+size]+=re;};
    for(const p of c.components) {
      const [i,j]=p.nodes.map(index);
      if(['R','C'].includes(p.type)) {
        const re=p.type==='R'?1/p.value:0, im=p.type==='C'?w*p.value:0;
        put(i,i,re,im);put(j,j,re,im);put(i,j,-re,-im);put(j,i,-re,-im);
      }
      if(p.type==='I') {if(i>=0)b[i]-=p.value;if(j>=0)b[j]+=p.value;}
      if(p.type==='G') {const cp=index(p.nodes[2]),cn=index(p.nodes[3]);put(i,cp,p.value);put(i,cn,-p.value);put(j,cp,-p.value);put(j,cn,p.value);}
      if(['V','L','E'].includes(p.type)) {
        const k=branch(p);put(i,k,1);put(j,k,-1);put(k,i,1);put(k,j,-1);
        if(p.type==='V') b[k]=p.value; else if(p.type==='E'){put(k,index(p.nodes[2]),-p.value);put(k,index(p.nodes[3]),p.value);}else put(k,k,0,-w*p.value);
      }
    }
    const x=solve(a,b);
    rows.push({f,...Object.fromEntries(layout.nodes.map((n,i)=>[n,{magnitude:Math.hypot(x[i],x[i+size]),phase:Math.atan2(x[i+size],x[i])*180/Math.PI}]))});
  }
  return {nodes:layout.nodes,rows};
}
