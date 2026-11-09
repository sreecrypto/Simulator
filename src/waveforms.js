export const waveforms=['dc','sine','square','triangle','sawtooth','pulse','noise','arbitrary'];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function validateGenerator(p){
  if(p.wave&&!waveforms.includes(p.wave))throw new Error('Unknown source waveform.');
  const ranges={frequency:[1e-6,1e10],offset:[-1e12,1e12],phase:[-36000,36000],duty:[0.001,99.999],symmetry:[0.001,99.999],delay:[0,1e6],rise:[0,1e6],fall:[0,1e6],burstCycles:[0,1e9],sweepStop:[1e-6,1e10],sweepTime:[1e-12,1e6],modFrequency:[1e-6,1e10],modDepth:[0,100],deviation:[0,1e10],sourceResistance:[0,1e12]};
  for(const [key,[min,max]] of Object.entries(ranges))if(p[key]!==undefined&&(!Number.isFinite(p[key])||p[key]<min||p[key]>max))throw new Error(`Invalid generator ${key} (${min}–${max}).`);
  if(p.sweep&&!['off','linear','log'].includes(p.sweep))throw new Error('Invalid sweep mode.');
  if(p.modulation&&!['off','am','fm'].includes(p.modulation))throw new Error('Invalid modulation.');
  if(p.outputEnabled!==undefined&&typeof p.outputEnabled!=='boolean')throw new Error('Output enable must be boolean.');
  if(p.wave==='arbitrary'){
    if(!Array.isArray(p.points)||p.points.length<2||p.points.length>2048)throw new Error('Arbitrary wave requires 2–2048 time/value pairs.');
    for(let i=0;i<p.points.length;i++){const row=p.points[i];if(!Array.isArray(row)||row.length!==2||row.some(v=>!Number.isFinite(v))||row[0]<0||(i&&row[0]<=p.points[i-1][0]))throw new Error('Arbitrary waveform times must be nonnegative and strictly increasing.');}
  }
}
export function sourceValue(p,time,dc=false){
  if(p.outputEnabled===false)return 0;
  if(!p.wave||p.wave==='dc')return p.value;
  const offset=p.offset||0;if(dc)return offset;
  const t=time-(p.delay||0);if(t<0)return offset;
  const f=p.frequency||1000,phase=(p.phase||0)/360;
  let cycles=f*t;
  if(p.sweep&&p.sweep!=='off'){
    const duration=p.sweepTime||1,stop=p.sweepStop||f,local=Math.min(t,duration);
    if(p.sweep==='linear')cycles=f*local+(stop-f)*local*local/(2*duration);
    else {const k=Math.log(stop/f)/duration;cycles=Math.abs(k)<1e-15?f*local:f*Math.expm1(k*local)/k;}
    if(t>duration)cycles+=stop*(t-duration);
  }
  const fm=p.modFrequency||100;
  if(p.modulation==='fm')cycles+=(p.deviation||0)*(1-Math.cos(2*Math.PI*fm*t))/(2*Math.PI*fm);
  if(p.burstCycles>0&&cycles>=p.burstCycles)return offset;
  const angle=cycles+phase,u=((angle%1)+1)%1,duty=(p.duty??50)/100,sym=(p.symmetry??50)/100;
  let signal=0;
  if(p.wave==='sine')signal=Math.sin(2*Math.PI*angle);
  if(p.wave==='square'||p.wave==='pulse'){
    const rise=Math.min((p.rise||0)*f,duty),fall=Math.min((p.fall||0)*f,1-duty);
    let level=u<duty?1:0;if(rise>0&&u<rise)level=u/rise;if(fall>0&&u>=duty&&u<duty+fall)level=1-(u-duty)/fall;
    signal=p.wave==='pulse'?level:2*level-1;
  }
  if(p.wave==='triangle')signal=u<sym?-1+2*u/sym:1-2*(u-sym)/(1-sym);
  if(p.wave==='sawtooth')signal=2*u-1;
  if(p.wave==='noise'){const k=Math.floor(t*f),seed=Math.sin(k*127.1+(p.seed||1)*311.7)*43758.5453;signal=2*(seed-Math.floor(seed))-1;}
  if(p.wave==='arbitrary'){
    const points=p.points||[[0,0],[1,1]],period=points.at(-1)[0],at=period>0?u*period:0;
    const end=points.findIndex(row=>row[0]>=at);
    if(end<=0)signal=points[0][1];else {const a=points[end-1],b=points[end];signal=a[1]+(b[1]-a[1])*(at-a[0])/(b[0]-a[0]);}
  }
  const envelope=p.modulation==='am'?1+(p.modDepth||0)/100*Math.sin(2*Math.PI*fm*t):1;
  return offset+p.value*signal*envelope;
}
export function sampleGenerator(p,duration=2/(p.frequency||1000),count=400){
  validateGenerator(p);return Array.from({length:count+1},(_,i)=>{const t=duration*i/count;return [t,sourceValue(p,t)];});
}
export function spiceSource(p,{duration=.01,steps=400}={}){
  if(p.outputEnabled===false)return '0';
  if(!p.wave||p.wave==='dc')return String(p.value);
  if(p.wave==='sine'&&(!p.modulation||p.modulation==='off')&&(!p.sweep||p.sweep==='off')&&!p.burstCycles)return `SIN(${p.offset||0} ${p.value} ${p.frequency||1000} ${p.delay||0} 0 ${p.phase||0}) AC ${p.value}`;
  if(['square','pulse'].includes(p.wave)&&!p.phase&&(!p.modulation||p.modulation==='off')&&(!p.sweep||p.sweep==='off')&&!p.burstCycles){const period=1/(p.frequency||1000),low=(p.offset||0)-(p.wave==='square'?p.value:0),high=(p.offset||0)+p.value;return `PULSE(${low} ${high} ${p.delay||0} ${p.rise||period/1e6} ${p.fall||period/1e6} ${period*(p.duty??50)/100} ${period}) AC ${p.value}`;}
  const data=sampleGenerator(p,duration,Math.min(10000,Math.max(1000,steps*4)));
  return `PWL(${data.flat().join(' ')}) AC ${p.value}`;
}
