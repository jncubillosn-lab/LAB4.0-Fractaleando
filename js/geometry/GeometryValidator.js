import {segmentAxis,segmentEntersRect,leavesRect} from './SegmentGeometry.js';
// Independent DRC-like checks. Cannot approve a path merely because
// it avoids third-party boxes: endpoints, ports, and continuity matter (H02).
export class GeometryValidator {
 constructor({router,rectOverlap}){this.router=router;this.rectOverlap=rectOverlap;}
 close(a,b,epsilon=.12){return Math.hypot(a.x-b.x,a.y-b.y)<=epsilon;}
 isPortOnRect(p,r){
  if(!p||!['top','right','bottom','left'].includes(p.side))return false;
  if(![p.x,p.y,p.sx,p.sy].every(Number.isFinite))return false;
  const stub=this.router.portStub;
  if(p.side==='top'||p.side==='bottom')return Math.abs(p.y-(p.side==='top'?r.t:r.b))<.12&&p.x>r.l+3&&p.x<r.r-3&&
   Math.abs(p.sx-p.x)<.12&&Math.abs(p.sy-p.y-(p.side==='top'?-stub:stub))<.12;
  return Math.abs(p.x-(p.side==='left'?r.l:r.r))<.12&&p.y>r.t+3&&p.y<r.b-3&&
   Math.abs(p.sy-p.y)<.12&&Math.abs(p.sx-p.x-(p.side==='left'?-stub:stub))<.12;
 }
 validateRoute(route,rects,occupied=[],usedPorts=new Map()){
  if(!route?.points)return {ok:false,reason:'Ruta sin puntos'};
  const {points,fromPort,toPort,edge}=route;
  if(!Array.isArray(points)||points.length<2||points.length>150||points.some(p=>!p||!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e8||Math.abs(p.y)>1e8))return {ok:false,reason:'Puntos inválidos'};
  const first=rects.find(r=>r.id===edge.from),last=rects.find(r=>r.id===edge.to);
  if(!first||!last||!this.isPortOnRect(fromPort,first)||!this.isPortOnRect(toPort,last))return {ok:false,reason:'Puerto ajeno al perímetro'};
  if(!this.close(points[0],fromPort)||!this.close(points.at(-1),toPort))return {ok:false,reason:'Extremo de la ruta desconectado'};
  for(const [id,port] of [[edge.from,fromPort],[edge.to,toPort]]){
   if((usedPorts.get(id)||[]).some(p=>Math.hypot(p.x-port.x,p.y-port.y)<8))return {ok:false,reason:'Puerto repetido'};
  }
  const segments=this.router.allSegments(points);
  if(segments.length!==points.length-1||segments.some(s=>!segmentAxis(s.a,s.b)))return {ok:false,reason:'Segmento no ortogonal o vacío'};
  if(!leavesRect(segments[0].a,segments[0].b,first)||
     !leavesRect(segments.at(-1).b,segments.at(-1).a,last))
   return {ok:false,reason:'La ruta no sale o llega por la cara de su puerto'};
  // Independent acceptance: do not inherit the router's endpoint exemptions.
  let crossings=0;
  for(const [i,s] of segments.entries()){
   for(const r of rects){
    if(r.id===edge.from&&i===0||r.id===edge.to&&i===segments.length-1)continue;
    if(segmentEntersRect(s.a,s.b,r,this.router.clearance))
     return {ok:false,reason:'Ruta invade obstáculo o solapa otra ruta'};
   }
   for(const old of occupied){const q=this.router.segmentRelation(s.a,s.b,old.a,old.b);
    if(q.overlap)return {ok:false,reason:'Ruta invade obstáculo o solapa otra ruta'};
    crossings+=q.cross;
   }
  }
  return {ok:true,crossings};
 }
 audit(rects,routes){
  let boxes=0,invalid=0,crossings=0,portsRepeated=0,drawn=0;const details=[];
  for(let i=0;i<rects.length;i++)for(let j=0;j<i;j++)if(this.rectOverlap(rects[i],rects[j],0))boxes++;
  const occupied=[],ports=new Map();
  for(const rt of routes){if(!rt.points)continue;drawn++;
   const v=this.validateRoute(rt,rects,occupied,ports);
   if(!v.ok){invalid++;details.push({edge:rt.edge,reason:v.reason});if(v.reason==='Puerto repetido')portsRepeated++;}
   else crossings+=v.crossings;
   occupied.push(...this.router.allSegments(rt.points));
   for(const [id,p] of [[rt.edge.from,rt.fromPort],[rt.edge.to,rt.toPort]])if(p){if(!ports.has(id))ports.set(id,[]);ports.get(id).push(p);}
  }
  return {boxes,invalid,crossings,portsRepeated,drawn,details};
 }
}
