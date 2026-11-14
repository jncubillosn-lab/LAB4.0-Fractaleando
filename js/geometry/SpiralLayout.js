import {rayRect} from './RayPackingLayout.js';

const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const overlap=(a,b,pad)=>a.l<b.r+pad&&a.r>b.l-pad&&a.t<b.b+pad&&a.b>b.t-pad;

// 04 is a twist of the packed 02 coordinates. It never creates independent
// generation rings or rescales the entire diagram to remove a local overlap.
export class SpiralLayout {
 // Historical W is an internal twist coefficient, not Raup's expansion
 // ratio per revolution. D is not parameterized here; this view is planar.
 compute({base,nodes,edges,metrics,nodeClearances={},W=.23}){
  metrics=new Map([...(metrics instanceof Map?metrics:new Map(metrics))].map(([id,m])=>
   [id,{...m,routingClearance:Math.max(base.stats.clearance??24,base.rects.get(id)?.routingClearance||0,nodeClearances[id]||0)}]));
  const byId=new Map(nodes.map(n=>[n.id,n])),clearance=base.stats.clearance??24;
  const lengths=edges.filter(e=>byId.get(e.to)?.parent===e.from).map(e=>{
   const a=base.positions.get(e.from),b=base.positions.get(e.to);return Math.hypot(a.x-b.x,a.y-b.y);
  }).sort((a,b)=>a-b);
  const twistScale=lengths.length?lengths[Math.floor(lengths.length/2)]:100,kappa=W/twistScale;
  const polar=new Map([...base.positions].map(([id,p])=>[id,{r:Math.hypot(p.x,p.y),a:Math.atan2(p.y,p.x)}]));
  const positions=new Map([['p1',{x:0,y:0}]]),rects=new Map([['p1',rayRect('p1',{x:0,y:0},metrics.get('p1'))]]);
  const order=nodes.filter(n=>n.id!=='p1').sort((a,b)=>polar.get(a.id).r-polar.get(b.id).r||a.id.localeCompare(b.id));
  let adjusted=0,maxDisplacement=0;
  for(const n of order){
   const original=polar.get(n.id),parent=positions.get(n.parent),m=metrics.get(n.id);
   const minimum=Math.max(original.r,parent?Math.hypot(parent.x,parent.y)+1:0);
   const step=Math.max(2,Math.min(m.w,m.h)/12);
   let best=null;
   for(let i=0;i<4000;i++){
    const r=minimum+i*step;if(best&&r-original.r>best.cost+step)break;
    for(const shift of [0,-.015,.015,-.035,.035,-.07,.07]){
     const a=original.a+kappa*r+shift,p={x:Math.cos(a)*r,y:Math.sin(a)*r},rect=rayRect(n.id,p,m);
     if([...rects.values()].some(other=>overlap(rect,other,Math.max(clearance,rect.routingClearance||0,other.routingClearance||0))))continue;
     const cost=Math.hypot(r-original.r,shift*r);
     if(!best||cost<best.cost)best={p,rect,cost};
    }
   }
   if(!best)throw Error('No se encontró espacio para girar el cuadro '+n.id);
   positions.set(n.id,best.p);rects.set(n.id,best.rect);
   if(best.cost>.01)adjusted++;maxDisplacement=Math.max(maxDisplacement,best.cost);
  }
  const all=[...rects.values()],bounds={l:Math.min(...all.map(r=>r.l)),r:Math.max(...all.map(r=>r.r)),
   t:Math.min(...all.map(r=>r.t)),b:Math.max(...all.map(r=>r.b))};
  bounds.width=bounds.r-bounds.l;bounds.height=bounds.b-bounds.t;bounds.area=bounds.width*bounds.height;
  const outwardViolations=nodes.filter(n=>n.parent&&positions.has(n.parent)&&
   Math.hypot(positions.get(n.id).x,positions.get(n.id).y)<=Math.hypot(positions.get(n.parent).x,positions.get(n.parent).y)).map(n=>n.id);
  const gaps=edges.map(e=>{const a=rects.get(e.from),b=rects.get(e.to);
   return Math.hypot(Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),Math.max(0,Math.abs(a.y-b.y)-(a.h+b.h)/2));});
  const limit=base.stats.maxAllowedGap;
  const distanceViolations=edges.flatMap((e,i)=>gaps[i]>limit+.0001?[{from:e.from,to:e.to,gap:gaps[i],limit}]:[]);
  const sectorViolations=[];
  for(const n of nodes){
   const p=positions.get(n.id),s=base.stats.sectors?.[base.stats.owners?.[n.id]];
   if(s&&Math.abs(delta(Math.atan2(p.y,p.x)-kappa*Math.hypot(p.x,p.y),s.center))>s.span/2+.08)sectorViolations.push(n.id);
  }
  return {mode:'04',positions,rects,levels:base.levels,
   stats:{...base.stats,mode:'04',engine:'spiral-from-'+base.stats.engine,sourceView:'02',W,T:0,twistScale,nodeClearances,
    baseNodeClearances:base.stats.nodeClearances,
    overlaps:0,radialOrder:outwardViolations.length===0,outwardViolations,distanceViolations,sectorViolations,
    constraintsValid:!outwardViolations.length&&!distanceViolations.length&&!sectorViolations.length&&!base.stats.disconnected.length,
    geometricallySafe:!outwardViolations.length,bounds,baseBounds:base.stats.bounds,baseMeanGap:base.stats.meanGap,
    meanGap:gaps.reduce((s,v)=>s+v,0)/Math.max(1,gaps.length),maxGap:Math.max(0,...gaps),adjusted,maxDisplacement}};
 }
}
