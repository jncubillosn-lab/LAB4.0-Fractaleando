/**
 * Propone la posición de un hijo sin quitar la selección al padre.
 * La secuencia avanza 3:30 horas y compara dos direcciones candidatas según
 * el espacio libre. La búsqueda usa cuadros y segmentos ya existentes para
 * evitar que cumplir una dirección obligue siempre a alejar el nuevo concepto.
 */
// Seven half-hour ticks: 12, 3:30, 7, 10:30, 2, ...
export const nextClockIndex=children=>Math.max(children.length,...children.map(n=>
 Number.isInteger(n.clockStep)&&n.clockStep>=0?n.clockStep+1:0));
function rayInterval(box,dx,dy,parent){
 let lo=0,hi=Infinity;
 for(const [low,high,origin,direction] of [[box.l,box.r,parent.x,dx],[box.t,box.b,parent.y,dy]]){
  if(Math.abs(direction)<1e-9){if(origin<low||origin>high)return null;continue;}
  const a=(low-origin)/direction,b=(high-origin)/direction;
  lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));if(lo>hi)return null;
 }
 return hi>=0?{lo,hi}:null;
}
// Find the nearest free point on each of the next two rays, without coarse
// distance steps. Previously placed concepts and routes remain untouched.
export function clockChildPosition({parent,metric,index,rects=[],segments=[]}){
 const blocked=[...rects.map(r=>({l:r.l-metric.w/2-16,r:r.r+metric.w/2+16,
  t:r.t-metric.h/2-16,b:r.b+metric.h/2+16})),
  ...segments.map(s=>({l:Math.min(s.a.x,s.b.x)-metric.w/2-12,r:Math.max(s.a.x,s.b.x)+metric.w/2+12,
   t:Math.min(s.a.y,s.b.y)-metric.h/2-12,b:Math.max(s.a.y,s.b.y)+metric.h/2+12}))];
 const candidate=clockStep=>{
  const angle=(clockStep*7%24)*Math.PI/12-Math.PI/2,dx=Math.cos(angle),dy=Math.sin(angle);
  let distance=Math.min(Math.abs(dx)<1e-9?Infinity:((parent.w+metric.w)/2+60)/Math.abs(dx),
   Math.abs(dy)<1e-9?Infinity:((parent.h+metric.h)/2+60)/Math.abs(dy));
  const intervals=blocked.map(box=>rayInterval(box,dx,dy,parent)).filter(Boolean).sort((a,b)=>a.lo-b.lo);
  for(const {lo,hi} of intervals){if(lo>distance)break;if(hi>=distance)distance=hi+1;}
  return {x:parent.x+dx*distance,y:parent.y+dy*distance,clockStep,distance};
 };
 const first=candidate(index),second=candidate(index+1),best=second.distance<first.distance-.001?second:first;
 const {distance,...position}=best;return position;
}
