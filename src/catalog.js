import {parseResource,resourceSpecs} from './resources.js';
// Legacy preset IDs remain readable in saved projects but are hidden from the library.
export const catalog=[];
const add=(id,name,mode,category,type,pinNames,defaults={},model=null,description='')=>catalog.push({id,name,mode,category,type,pinNames,defaults,model,description:description||`${name}. Ideal educational ${model?'subcircuit / behavioral':'primitive'} model.`,support:'simulated'});
const fmt=n=>n>=1e6?`${n/1e6}M`:n>=1000?`${n/1000}k`:n>=1?`${n}`:n>=1e-3?`${+(n*1e3).toPrecision(4)}m`:n>=1e-6?`${+(n*1e6).toPrecision(4)}µ`:`${+(n*1e9).toPrecision(4)}n`;
const values=[1,2.2,4.7,10,22,47,100,220,470,1000,2200,4700,10000,22000,47000,100000,220000,470000,1e6,2.2e6,4.7e6,10e6,22e6,47e6];
for(const [i,value] of values.entries())add(`res_${i}`,`${fmt(value)} Ω resistor`,'analog','Resistors','R',['A','B'],{value});
for(const [i,value] of [10e-12,22e-12,47e-12,100e-12,220e-12,470e-12,1e-9,2.2e-9,4.7e-9,10e-9,22e-9,47e-9,100e-9,220e-9,470e-9,1e-6,2.2e-6,4.7e-6,10e-6,22e-6,47e-6,100e-6,470e-6,1000e-6].entries())add(`cap_${i}`,`${fmt(value)}F capacitor`,'analog','Capacitors','C',['A','B'],{value});
for(const [i,value] of [1e-6,2.2e-6,4.7e-6,10e-6,22e-6,47e-6,100e-6,220e-6,470e-6,.001,.0022,.0047,.01,.022,.047,.1,.22,.47,1,2.2,4.7,10,22,47].entries())add(`ind_${i}`,`${fmt(value)}H inductor`,'analog','Inductors','L',['A','B'],{value});
for(const [i,v] of [0.5,1,1.2,1.5,1.8,2,2.5,3,3.3,4.2,5,6,7.5,9,10,12,15,18,24,28,36,48,-5,-12].entries())add(`dc_${i}`,`${v} V DC supply`,'analog','Sources','V',['+','−'],{value:v,wave:'dc'});
for(const [i,f] of [1,5,10,50,60,100,200,500,1000,2000,10000,100000].entries()) {
  add(`sine_${i}`,`${fmt(f)}Hz sine source`,'analog','Sources','V',['+','−'],{value:1,wave:'sine',frequency:f});
  add(`pulse_${i}`,`${fmt(f)}Hz pulse source`,'analog','Sources','V',['+','−'],{value:5,wave:'pulse',frequency:f});
}
for(const [i,v] of [1e-6,10e-6,50e-6,100e-6,500e-6,.001,.002,.005,.01,.02,.05,.1].entries())add(`current_${i}`,`${fmt(v)}A current source`,'analog','Sources','I',['+','−'],{value:v});
for(const gain of [0.1,0.2,0.5,1,2,5,10,20,50,100,1000,10000]) {
  add(`vcvs_${String(gain).replace('.','_')}`,`Voltage amplifier ×${gain}`,'analog','Controlled sources','E',['OUT+','OUT−','IN+','IN−'],{value:gain});
  add(`vccs_${String(gain).replace('.','_')}`,`Transconductance ${gain} S`,'analog','Controlled sources','G',['OUT+','OUT−','IN+','IN−'],{value:gain});
}
for(const [i,fc] of [10,20,50,100,200,500,1000,2000,5000,10000,20000,50000].entries()) {
  const r=1000,c=1/(2*Math.PI*r*fc);
  for(const family of ['lowpass','highpass','bandpass','notch'])add(`${family}_${i}`,`${fmt(fc)}Hz ${family} filter`,'analog','Filters','BLOCK',['IN','OUT','GND'],{}, {family,r,c,l:1/((2*Math.PI*fc)**2*c)});
}
for(const ratio of [0.1,0.2,0.25,0.33,0.5,0.66,0.75,0.8,0.9])add(`divider_${String(ratio).replace('.','_')}`,`Voltage divider ×${ratio}`,'analog','Networks','BLOCK',['IN','OUT','GND'],{}, {family:'divider',r:10000,ratio});
for(const resistance of [100,500,1000,5000,10000,50000,100000,1e6]) {
  add(`pot_${resistance}`,`${fmt(resistance)}Ω potentiometer`,'analog','Networks','BLOCK',['A','WIPER','B'],{}, {family:'divider',r:resistance,ratio:0.5});
  add(`bridge_${resistance}`,`${fmt(resistance)}Ω Wheatstone bridge`,'analog','Networks','BLOCK',['VCC','LEFT','RIGHT','GND'],{}, {family:'bridge',r:resistance});
  add(`snubber_${resistance}`,`${fmt(resistance)}Ω RC snubber`,'analog','Networks','BLOCK',['A','B'],{}, {family:'snubber',r:resistance,c:100e-9});
}
for(const stages of [2,3,4,5,6,8])add(`ladder_${stages}`,`${stages}-stage RC ladder`,'analog','Filters','BLOCK',['IN','OUT','GND'],{}, {family:'ladder',stages,r:1000,c:100e-9});
for(const gain of [1,2,5,10,20,50])add(`buffered_lp_${gain}`,`Buffered low-pass ×${gain}`,'analog','Active filters','BLOCK',['IN','OUT','GND'],{}, {family:'buffered',r:1000,c:100e-9,gain});
for(const spec of catalog)spec.hidden=true;
for(const [id,name,type,pinNames,value] of [
  ['resistor','Resistor','R',['A','B'],1000],['capacitor','Capacitor','C',['A','B'],1e-6],['inductor','Inductor','L',['A','B'],.01],
  ['voltage','Voltage / function generator','V',['+','−'],1],['current','Current source','I',['+','−'],.001],
  ['vcvs','Voltage-controlled voltage source','E',['OUT+','OUT−','IN+','IN−'],10],['vccs','Voltage-controlled current source','G',['OUT+','OUT−','IN+','IN−'],.001]
])add(id,name,'analog',['R','C','L'].includes(type)?'Passive components':['V','I'].includes(type)?'Sources':'Controlled sources',type,pinNames,{value});
add('ground','Ground','analog','Connections','GROUND',['GND'],{value:0});
add('probe','Voltage probe','analog','Connections','PROBE',['NET'],{value:0});
const devices=[
  ['diode','Diode','D',['A','K'],'DGEN','.model DGEN D(Is=1e-14 N=1 Rs=0.1)'],
  ['zener','Zener diode','D',['A','K'],'ZGEN','.model ZGEN D(Is=1e-14 N=1 Rs=1 BV=5.1 IBV=1m)'],
  ['led','LED','D',['A','K'],'LEDGEN','.model LEDGEN D(Is=1e-20 N=2 Rs=10)'],
  ['npn','NPN transistor','Q',['C','B','E'],'NPNGEN','.model NPNGEN NPN(Is=1e-15 Bf=100 Vaf=100)'],
  ['pnp','PNP transistor','Q',['C','B','E'],'PNPGEN','.model PNPGEN PNP(Is=1e-15 Bf=100 Vaf=100)'],
  ['nmos','N-channel MOSFET','M',['D','G','S','B'],'NMOSGEN','.model NMOSGEN NMOS(Level=1 Vto=2 Kp=1m Lambda=0.01)'],
  ['pmos','P-channel MOSFET','M',['D','G','S','B'],'PMOSGEN','.model PMOSGEN PMOS(Level=1 Vto=-2 Kp=1m Lambda=0.01)'],
  ['njfet','N-channel JFET','J',['D','G','S'],'NJFGEN','.model NJFGEN NJF(Vto=-2 Beta=1m)'],
  ['pjfet','P-channel JFET','J',['D','G','S'],'PJFGEN','.model PJFGEN PJF(Vto=2 Beta=1m)'],
  ['switch','Voltage-controlled switch','S',['A','B','CTRL+','CTRL−'],'SWGEN','.model SWGEN SW(Ron=1 Roff=1e9 Vt=2.5 Vh=0.1)'],
  ['opamp','Generic op-amp (supply-limited)','X',['IN+','IN−','V+','V−','OUT'],'OPAMPGEN','.subckt OPAMPGEN IP IN VP VN OUT\nB1 OUT 0 V=min(max(100000*(V(IP)-V(IN)),V(VN)),V(VP))\nR1 IP IN 1e9\n.ends OPAMPGEN'],
  ['comparator','Generic comparator','X',['IN+','IN−','V+','V−','OUT'],'COMPGEN','.subckt COMPGEN IP IN VP VN OUT\nB1 OUT 0 V=V(VN)+(V(VP)-V(VN))*(V(IP)>V(IN))\nR1 IP IN 1e9\n.ends COMPGEN'],
  ['transformer','Transformer (coupled windings)','X',['P+','P−','S+','S−'],'XFMRGEN','.subckt XFMRGEN PP PN SP SN\nL1 PP PN 1m\nL2 SP SN 1m\nK1 L1 L2 0.999\n.ends XFMRGEN']
];
for(const [id,name,type,pinNames,modelName,modelText] of devices){add(id,name,'analog','Semiconductors & ICs',type,pinNames,{value:1,modelName});Object.assign(catalog.at(-1),{support:'ngspice',modelText,description:`Generic educational ${name.toLowerCase()} model. Requires ngspice for simulation; replace with a manufacturer model when needed.`});}
for(const [id,name,type,pinNames,defaults] of [
  ['cccs','Current-controlled current source','F',['OUT+','OUT−'],{value:1,control:'V1'}],['ccvs','Current-controlled voltage source','H',['OUT+','OUT−'],{value:1,control:'V1'}],
  ['coupling','Mutual inductance','K',[],{value:.99,inductor1:'L1',inductor2:'L2'}],
  ['behavioral_v','Behavioral voltage source','BV',['+','−'],{value:1,expression:'V(in)*2'}],['behavioral_i','Behavioral current source','BI',['+','−'],{value:1,expression:'V(in)/1000'}],
  ['transmission_line','Lossless transmission line','T',['IN+','IN−','OUT+','OUT−'],{value:50,delay:1e-6}]
]){add(id,name,'analog','Advanced SPICE',type,pinNames,defaults);catalog.at(-1).support='ngspice';catalog.at(-1).description='Standard SPICE device family. Requires ngspice for simulation.';}

const bits=(prefix,n)=>Array.from({length:n},(_,i)=>prefix+i);
for(const [type,name,pins] of [['INPUT','Logic input',['OUT']],['OUTPUT','Logic output',['IN']],['CLOCK','Clock',['OUT']],['NOT','Inverter',['IN','OUT']],['AND','AND gate',['A','B','Y']],['OR','OR gate',['A','B','Y']],['XOR','XOR gate',['A','B','Y']],['NAND','NAND gate',['A','B','Y']],['NOR','NOR gate',['A','B','Y']],['XNOR','XNOR gate',['A','B','Y']],['DFF','D flip-flop',['D','CLK','Q']]])add(`logic_${type.toLowerCase()}`,name,'digital','Essentials',type,pins,{value:type==='INPUT'?0:1});
function digital(id,name,category,inputs,outputs,model){add(id,name,'digital',category,'BLOCK',[...inputs,...outputs],{}, {...model,inputs:inputs.length,outputs:outputs.length});}
for(const family of ['AND','OR','XOR','NAND','NOR','XNOR'])for(let count=2;count<=12;count++)digital(`${family.toLowerCase()}_${count}`,`${count}-input ${family}`,'Gates',bits('I',count),['Y'],{family:'gate',gate:family});
for(const width of [1,2,3,4,5,6,7,8,12,16]) {
  for(const family of ['adder','subtractor','comparator','increment','decrement','negate','parity','buffer','invert','andbus','orbus','xorbus']) {
    const two=['adder','subtractor','comparator','andbus','orbus','xorbus'].includes(family);
    const input=[...bits('A',width),...(two?bits('B',width):[])];
    const output=family==='comparator'?['LT','EQ','GT']:family==='parity'?['ODD','EVEN']:['adder','subtractor'].includes(family)?[...bits('Y',width),'CARRY'] : bits('Y',width);
    digital(`${family}_${width}`,`${width}-bit ${family}`,'Arithmetic & buses',input,output,{family,width});
  }
  digital(`mux2_${width}`,`${width}-bit 2:1 multiplexer`,'Routing',[...bits('A',width),...bits('B',width),'SEL'],bits('Y',width),{family:'mux',width});
  digital(`demux2_${width}`,`${width}-bit 1:2 demultiplexer`,'Routing',[...bits('D',width),'SEL'],[...bits('A',width),...bits('B',width)],{family:'demux',width});
  digital(`register_${width}`,`${width}-bit D register`,'Sequential',[...bits('D',width),'CLK'],bits('Q',width),{family:'register',width,sequential:true});
  digital(`counter_${width}`,`${width}-bit up counter`,'Sequential',['CLK','RESET','ENABLE'],bits('Q',width),{family:'counter',width,sequential:true});
  digital(`shift_${width}`,`${width}-bit shift register`,'Sequential',['DATA','CLK','RESET'],bits('Q',width),{family:'shift',width,sequential:true});
}
for(let width=1;width<=6;width++) {
  digital(`decoder_${width}`,`${width}-to-${2**width} decoder`,'Encoders & decoders',bits('A',width),bits('Y',2**width),{family:'decoder',width});
  digital(`encoder_${width}`,`${2**width}-to-${width} priority encoder`,'Encoders & decoders',bits('I',2**width),[...bits('Y',width),'VALID'],{family:'encoder',width});
}
for(let width=2;width<=12;width++)for(const direction of ['left','right'])digital(`rotate_${direction}_${width}`,`${width}-bit rotate ${direction}`,'Arithmetic & buses',bits('A',width),bits('Y',width),{family:'rotate',width,direction});
export const catalogById=new Map(catalog.map(c=>[c.id,c]));
export const catalogFor=mode=>catalog.filter(c=>c.mode===mode&&!c.hidden&&!c.disabled);
export function registerResources(resources=[]){for(const input of resources){const resource=parseResource(input);for(const spec of resourceSpecs(resource)){if(!catalogById.has(spec.id))catalog.push(spec);catalogById.set(spec.id,spec);}}}
export function componentSpec(p){return p.libraryId?catalogById.get(p.libraryId):null;}
export function instantiate(spec,id,x=200,y=180){return {id,type:spec.type,libraryId:spec.id,x,y,value:1,...structuredClone(spec.defaults),nodes:spec.pinNames.map((_,i)=>`${id}_p${i}`)};}
export function expandAnalog(circuit){
  const parts=[],usedNodes=new Set(circuit.components.flatMap(p=>p.nodes));
  for(const p of circuit.components){
    if(['GROUND','PROBE'].includes(p.type))continue;
    if(p.type==='I'&&p.sourceResistance>0){parts.push({...p,sourceResistance:0},{id:`__${p.id}_rout`,type:'R',nodes:[...p.nodes],value:p.sourceResistance,x:p.x,y:p.y});continue;}
    if(p.type==='V'&&p.sourceResistance>0){let n=`__${p.id}_src`;while(usedNodes.has(n))n+='_';usedNodes.add(n);parts.push({...p,nodes:[n,p.nodes[1]],sourceResistance:0},{id:`__${p.id}_rout`,type:'R',nodes:[n,p.nodes[0]],value:p.sourceResistance,x:p.x,y:p.y});continue;}
    if(p.type!=='BLOCK'){parts.push(p);continue;}
    const spec=componentSpec(p),m=spec.model,[a,b,g,h]=p.nodes;let number=0;const internals=new Map();
    const put=(type,nodes,value)=>parts.push({id:`__${p.id}_${number++}`,type,nodes,value,x:p.x,y:p.y});
    const internal=s=>{if(internals.has(s))return internals.get(s);let key=`__${p.id}_${s}`;while(usedNodes.has(key))key+='_';usedNodes.add(key);internals.set(s,key);return key;};
    if(m.family==='divider'){put('R',[a,b],m.r*(1-m.ratio));put('R',[b,g],m.r*m.ratio);}
    if(m.family==='bridge'){put('R',[a,b],m.r);put('R',[b,h],m.r);put('R',[a,g],m.r);put('R',[g,h],m.r);}
    if(m.family==='snubber'){put('R',[a,internal('rc')],m.r);put('C',[internal('rc'),b],m.c);}
    if(['lowpass','highpass','bandpass','notch'].includes(m.family)){
      if(m.family==='lowpass'){put('R',[a,b],m.r);put('C',[b,g],m.c);}
      if(m.family==='highpass'){put('C',[a,b],m.c);put('R',[b,g],m.r);}
      if(m.family==='bandpass'){put('C',[a,internal('lc')],m.c);put('L',[internal('lc'),b],m.l);put('R',[b,g],m.r);}
      if(m.family==='notch'){put('R',[a,b],m.r);put('L',[b,internal('lc')],m.l);put('C',[internal('lc'),g],m.c);}
    }
    if(m.family==='ladder'){for(let i=0;i<m.stages;i++){const left=i===0?a:internal('s'+(i-1)),right=i===m.stages-1?b:internal('s'+i);put('R',[left,right],m.r);put('C',[right,g],m.c);}}
    if(m.family==='buffered'){const n=internal('lp');put('R',[a,n],m.r);put('C',[n,g],m.c);put('E',[b,g,n,g],m.gain);}
  }
  return {...circuit,components:parts};
}
