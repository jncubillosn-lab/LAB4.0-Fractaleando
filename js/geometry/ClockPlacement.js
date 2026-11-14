import {segmentEntersRect} from './SegmentGeometry.js';

// Advance five hours per sibling: 12, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7.
// If that ray is occupied, extend it; never move an existing concept or route.
export function clockChildPosition({parent,metric,index,rects=[],segments=[]}){
 const angle=(index*5%12)*Math.PI/6-Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle);
 const gap=60,step=Math.max(64,metric.h+32),half=Math.hypot(metric.w,metric.h)/2;
 const radius=Math.min(Math.abs(dx)<1e-9?Infinity:((parent.w+metric.w)/2+gap)/Math.abs(dx),
  Math.abs(dy)<1e-9?Infinity:((parent.h+metric.h)/2+gap)/Math.abs(dy));
 const points=[...rects.flatMap(r=>[{x:r.l,y:r.t},{x:r.r,y:r.b}]),...segments.flatMap(s=>[s.a,s.b])];
 const outside=Math.max(radius,...points.map(p=>Math.hypot(p.x-parent.x,p.y-parent.y)+half+20));
 for(let distance=radius;distance<=outside+step;distance+=step){
  const p={x:parent.x+dx*distance,y:parent.y+dy*distance};
  const box={l:p.x-metric.w/2,r:p.x+metric.w/2,t:p.y-metric.h/2,b:p.y+metric.h/2};
  if(rects.some(r=>box.l<r.r+16&&box.r>r.l-16&&box.t<r.b+16&&box.b>r.t-16))continue;
  if(segments.some(s=>segmentEntersRect(s.a,s.b,box,12)))continue;
  return p;
 }
 throw Error('No se encontró espacio libre en la dirección del nuevo concepto.');
}
