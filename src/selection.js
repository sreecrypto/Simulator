export function selectionRectangle(start,end){return {x:Math.min(start.x,end.x),y:Math.min(start.y,end.y),width:Math.abs(end.x-start.x),height:Math.abs(end.y-start.y)};}
export function intersectsSelection(selection,bounds){return selection.x<=bounds.x+bounds.width&&selection.x+selection.width>=bounds.x&&selection.y<=bounds.y+bounds.height&&selection.y+selection.height>=bounds.y;}
