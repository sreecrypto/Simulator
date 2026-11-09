export function wirePath(start,end){
  const middle=(start[0]+end[0])/2;
  return `M${start[0]} ${start[1]}H${middle}V${end[1]}H${end[0]}`;
}
export function nearestPort(ports,point,tolerance,exclude=null){
  let match=null,best=tolerance;
  for(const port of ports){
    if(exclude&&port.id===exclude.id&&port.index===exclude.index)continue;
    const distance=Math.hypot(port.point[0]-point[0],port.point[1]-point[1]);
    if(distance<=best){best=distance;match=port;}
  }
  return match;
}
