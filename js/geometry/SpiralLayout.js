import {rayRect} from './RayPackingLayout.js';
import {RAUP_DEFAULTS,validateRaup,raupPoint} from './RaupModel.js';

const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const overlap=(a,b,pad)=>a.l<b.r+pad&&a.r>b.l-pad&&a.t<b.b+pad&&a.b>b.t-pad;

// 04 is a twist of the packed 02 coordinates. It never creates independent
// generation rings or rescales the entire diagram to remove a local overlap.
export class SpiralLayout {
 compute({base,nodes,edges,metrics,nodeClearances={},W=RAUP_DEFAULTS.W,D=RAUP_DEFAULTS.D,T=RAUP_DEFAULTS.T}){
  validateRaup({W,D,T});
  metrics=new Map([...(metrics instanceof Map?metrics:new Map(metrics))].map(([id,m])=>
   [id,{...m,routingClearance:Math.max(base.stats.clearance??24,base.rects.get(id)?.routingClearance||0,nodeClearances[id]||0)}]));
  const byId=new Map(nodes.map(n=>[n.id,n])),clearance=base.stats.clearance??24;
  const polar=new Map([...base.positions].map(([id,p])=>[id,{r:Math.hypot(p.x,p.y),a:Math.atan2(p.y,p.x)}]));
  const referenceRadius=Math.max(1,Math.min(...[...polar].filter(([id])=>id!=='p1').map(([,p])=>p.r)));
  // 02 radii describe the outer aperture, not the generating circle's centre.
  // This fixes the physical scale without multiplying every source distance.
  const apertureScale=referenceRadius*(1-D)/2,samples=new Map();
  const positions=new Map([['p1',{x:0,y:0}]]),rects=new Map([['p1',rayRect('p1',{x:0,y:0},metrics.get('p1'))]]);
  const order=nodes.filter(n=>n.id!=='p1').sort((a,b)=>polar.get(a.id).r-polar.get(b.id).r||a.id.localeCompare(b.id));
  let adjusted=0,maxDisplacement=0;
  for(const n of order){
   const original=polar.get(n.id),parent=positions.get(n.parent),m=metrics.get(n.id);
   const minimum=original.r;
   const step=Math.max(2,Math.min(m.w,m.h)/12);
   let best=null;
   for(let i=0;i<4000;i++){
    const r=minimum+i*step;if(best&&r-original.r>best.cost+step)break;
    const theta=2*Math.PI*Math.log(r/referenceRadius)/Math.log(W);
    for(const shift of [0,-.015,.015,-.035,.035,-.07,.07,-.11,.11,-.16,.16]){
     const sector=base.stats.sectors?.[base.stats.owners?.[n.id]];
     const phase=sector?.center??original.a;
     const phi=sector?Math.max(-1,Math.min(1,delta(original.a,phase)/(sector.span/2)))*Math.PI/2+shift:shift;
     const sample=raupPoint({theta,phi,phase,scale:apertureScale,W,D,T});
     // Cabinet projection: axial growth remains visible when T is nonzero.
     const p={x:sample.x,y:sample.y-sample.z/Math.SQRT2,z:sample.z},rect=rayRect(n.id,p,m);
     if(parent&&Math.hypot(p.x,p.y)<=Math.hypot(parent.x,parent.y)+1)continue;
     if([...rects.values()].some(other=>overlap(rect,other,Math.max(clearance,rect.routingClearance||0,other.routingClearance||0))))continue;
     const cost=Math.hypot(r-original.r,shift*r);
     if(!best||cost<best.cost)best={p,rect,cost,theta,phi};
    }
   }
   if(!best)throw Error('No se encontró espacio para girar el cuadro '+n.id);
   positions.set(n.id,best.p);rects.set(n.id,best.rect);
   samples.set(n.id,{theta:best.theta,phi:best.phi});
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
   const sample=samples.get(n.id);
   if(sample&&Math.abs(sample.phi)>Math.PI/2+.1601)sectorViolations.push(n.id);
  }
  const angles=[...samples.values()].map(p=>p.theta);
  return {mode:'04',positions,rects,levels:base.levels,
   stats:{...base.stats,mode:'04',engine:'raup-from-'+base.stats.engine,sourceView:'02',W,D,T,model:'raup',referenceRadius,
    rotationRange:angles.length?Math.max(...angles)-Math.min(...angles):0,nodeClearances,
    baseNodeClearances:base.stats.nodeClearances,
    overlaps:0,radialOrder:outwardViolations.length===0,outwardViolations,distanceViolations,sectorViolations,
    constraintsValid:!outwardViolations.length&&!distanceViolations.length&&!sectorViolations.length&&!base.stats.disconnected.length,
    geometricallySafe:!outwardViolations.length,bounds,baseBounds:base.stats.bounds,baseMeanGap:base.stats.meanGap,
    meanGap:gaps.reduce((s,v)=>s+v,0)/Math.max(1,gaps.length),maxGap:Math.max(0,...gaps),adjusted,maxDisplacement}};
 }
}
