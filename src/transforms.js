export function transformPoint(p,[x,y]){
  const dx=(x-p.x)*(p.mirrorX?-1:1),dy=(y-p.y)*(p.mirrorY?-1:1),r=(p.rotation||0)*Math.PI/180;
  return [p.x+dx*Math.cos(r)-dy*Math.sin(r),p.y+dx*Math.sin(r)+dy*Math.cos(r)];
}
export function duplicateParts(circuit,ids,copies=1){
  if(!Number.isInteger(copies)||copies<1||copies>32)throw new Error('Choose 1–32 copies.');
  const originals=circuit.components.filter(p=>ids.includes(p.id));if(!originals.length)throw new Error('Select a component first.');
  if(circuit.components.length+originals.length*copies>256)throw new Error('Duplicating would exceed 256 components.');
  const next=structuredClone(circuit),used=new Set(next.components.map(p=>p.id)),created=[];
  for(let copy=1;copy<=copies;copy++){
    const netMap=new Map();
    for(const original of originals){const p=structuredClone(original);let index=1,base=p.id.slice(0,16);while(used.has(`${base}_copy${index}`))index++;p.id=`${base}_copy${index}`;used.add(p.id);p.x=Math.min(20000,p.x+copy*140);p.y=Math.min(20000,p.y+copy*100);
      p.nodes=p.nodes.map(n=>{if(n==='0')return n;if(!netMap.has(n)){let name=`c${next.components.length}_${netMap.size}`;while(next.components.some(v=>v.nodes.includes(name)))name+='_';netMap.set(n,name);}return netMap.get(n);});next.components.push(p);created.push(p.id);
    }
  }
  return {circuit:next,ids:created};
}
