import {catalogById,instantiate} from './catalog.js';
export function arrange(c){
  let y=140;
  for(let start=0;start<c.components.length;start+=5){
    const row=c.components.slice(start,start+5);
    const height=Math.max(130,...row.map(p=>{const s=catalogById.get(p.libraryId);return s?.model?.inputs?Math.max(s.model.inputs,s.model.outputs)*19+90:150;}));
    row.forEach((p,i)=>{p.x=150+i*245;p.y=y+height/2;});y+=height+80;
  }
  return c;
}
export function advancedRecipe(prompt){
  const p=prompt.toLowerCase(), width=Math.min(16,Math.max(1,Number(p.match(/(\d+)\s*[- ]?bit/)?.[1]||4)));
  const c={version:1,name:'',mode:'digital',components:[],wires:[]};let serial=0;
  const part=(type,nodes,value=1,extra={})=>{const id=type==='BLOCK'?'U'+(++serial):type+(++serial);const v={id,type,nodes,value,x:100,y:100,...extra};c.components.push(v);return v;};
  const input=(name,value=0)=>part('INPUT',[name],value);
  const output=name=>{const p=part('OUTPUT',[name]);p.id='OUT_'+name;return p;};
  const block=(libraryId,nodes)=>{if(!catalogById.has(libraryId))throw new Error('Requested bit width is not available for this block. Choose 1–8, 12 or 16 bits.');return part('BLOCK',nodes,1,{libraryId});};
  const bits=(prefix,n)=>Array.from({length:n},(_,i)=>prefix+i);
  if(/ripple|full.?adder/.test(p)){
    c.name=`${width}-bit ripple-carry adder`;input('carry0');
    for(let i=0;i<width;i++){
      input('a'+i,i%2);input('b'+i,1);const x='xor'+i,g='gen'+i,h='prop'+i;
      part('XOR',['a'+i,'b'+i,x]);part('XOR',[x,'carry'+i,'sum'+i]);part('AND',['a'+i,'b'+i,g]);part('AND',[x,'carry'+i,h]);part('OR',[g,h,'carry'+(i+1)]);output('sum'+i);
    }output('carry'+width);
  }else if(/alu|arithmetic logic/.test(p)){
    c.name=`${width}-bit arithmetic / logic unit`;const a=bits('a',width),b=bits('b',width);a.forEach((n,i)=>input(n,i%2));b.forEach(n=>input(n,1));input('select');
    block('adder_'+width,[...a,...b,...bits('sum',width),'carry']);block('andbus_'+width,[...a,...b,...bits('and',width)]);
    block('mux2_'+width,[...bits('sum',width),...bits('and',width),'select',...bits('result',width)]);bits('result',width).forEach(output);output('carry');
  }else if(/counter/.test(p)){
    c.name=`${width}-bit synchronous counter`;part('CLOCK',['clk']);input('reset');input('enable',1);block('counter_'+width,['clk','reset','enable',...bits('q',width)]);bits('q',width).forEach(output);
  }else if(/shift register/.test(p)){
    c.name=`${width}-bit serial shift register`;input('data',1);part('CLOCK',['clk']);input('reset');block('shift_'+width,['data','clk','reset',...bits('q',width)]);bits('q',width).forEach(output);
  }else if(/decoder/.test(p)){
    const n=Math.min(width,6);c.name=`${n}-to-${2**n} decoder`;bits('a',n).forEach((name,i)=>input(name,i%2));block('decoder_'+n,[...bits('a',n),...bits('y',2**n)]);bits('y',2**n).forEach(output);
  }else if(/cascad|active filter|multi.?stage/.test(p)){
    c.mode='analog';const stages=Math.min(8,Math.max(2,Number(p.match(/(\d+)\s*[- ]?stage/)?.[1]||3))),gain=Number(p.match(/gain\s*(?:of|=|x)?\s*(\d+(?:\.\d+)?)/)?.[1]||2),fc=Number(p.match(/(\d+(?:\.\d+)?)\s*khz/)?.[1]||1)*1000;
    c.name=`${stages}-stage active RC filter`;part('V',['in','0'],1,{wave:'sine',frequency:fc});
    for(let i=0;i<stages;i++){const a=i===0?'in':'stage'+(i-1),b='lp'+i,out=i===stages-1?'out':'stage'+i;part('R',[a,b],1000);part('C',[b,'0'],1/(2*Math.PI*1000*fc));part('E',[out,'0',b,'0'],gain);}
  }else if(/wheatstone|bridge sensor/.test(p)){
    c.mode='analog';c.name='Wheatstone bridge with differential amplifier';part('V',['vcc','0'],5);part('R',['vcc','left'],1000);part('R',['left','0'],1000);part('R',['vcc','right'],1000);part('R',['right','0'],1100);part('E',['out','0','right','left'],10);part('R',['out','0'],10000);
  }else return null;
  return {circuit:arrange(c),explanation:`Built ${c.name} with ${c.components.length} components. ${c.mode==='digital'?'Bits are little-endian: bit 0 is the least significant bit. Use Tick / evaluate for sequential or more than 8 external inputs.':'Controlled amplifiers are ideal linear models with no supply saturation. Use AC sweep with the 1 V source for frequency response.'} This is a deterministic circuit builder; review and simulate before use.`};
}
