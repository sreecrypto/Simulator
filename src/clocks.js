export const defaultClockFrequency=1000;
export function clockLevel(part,time){
  if(time<(part.delay||0))return 0;
  const cycles=(time-(part.delay||0))*(part.frequency||defaultClockFrequency)+(part.phase||0)/360;
  const epsilon=Number.EPSILON*Math.max(1,Math.abs(cycles))*16;
  const position=((cycles+epsilon)%1+1)%1;
  return Number(position>=1-(part.duty??50)/100);
}
export function clockEdges(part,duration,maxEvents=10000){
  const frequency=part.frequency||defaultClockFrequency,delay=part.delay||0,phase=(part.phase||0)/360,edges=[];
  if(!Number.isFinite(duration)||duration<=0||duration>1000)throw new Error('Timing window must be greater than 0 and no longer than 1,000 seconds.');
  if(delay>0&&delay<=duration)edges.push(delay);
  for(const boundary of [1-(part.duty??50)/100,1]){
    const first=Math.ceil(phase-boundary);
    for(let k=first;k<=first+maxEvents;k++){
      const time=delay+(k+boundary-phase)/frequency;
      if(time>duration+Number.EPSILON*duration*16)break;
      if(time>=0)edges.push(Math.min(time,duration));
      if(edges.length>maxEvents)throw new Error('Too many clock edges in this window. Shorten the window or reduce the clock frequency.');
    }
  }
  return edges;
}
export function nextClockTime(parts,time){
  const clocks=parts.filter(p=>p.type==='CLOCK');if(!clocks.length)return time;
  let next=Infinity;
  for(const p of clocks){
    const frequency=p.frequency||defaultClockFrequency,delay=p.delay||0,phase=(p.phase||0)/360;
    if(time<delay){next=Math.min(next,delay);continue;}
    const cycles=(time-delay)*frequency+phase;
    for(const boundary of [1-(p.duty??50)/100,1]){
      let k=Math.floor(cycles-boundary)+1;let at=delay+(k+boundary-phase)/frequency;
      if(at<=time+Number.EPSILON*Math.max(1,time)*16)at=delay+(++k+boundary-phase)/frequency;
      next=Math.min(next,at);
    }
  }
  return next;
}
