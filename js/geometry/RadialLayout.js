// Packed radial candidate; no edits to the graph or 01 coordinates.
// The independent audit retains the historical 2H/sector diagnostics.
// A compact, physically safe preview does not imply normative acceptance.
import {RayPackingLayout} from './RayPackingLayout.js';

export class RadialLayout {
 static gap(a,b){
  return Math.hypot(Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),
   Math.max(0,Math.abs(a.y-b.y)-(a.h+b.h)/2));
 }
 static angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
 static signature(nodes,edges){
  return JSON.stringify({nodes:nodes.map(n=>[n.id,n.parent??null,n.branch??null]).sort((a,b)=>a[0].localeCompare(b[0])),
   edges:edges.map(e=>[e.from,e.to,e.kind??'']).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
 }
 static audit({nodes,edges,positions,metrics,sectors,owner,baseHeight,clearance=14}){
  const boxes=nodes.map(n=>({id:n.id,...positions.get(n.id),w:metrics.get(n.id)?.w,h:metrics.get(n.id)?.h}));
  const byId=new Map(boxes.map(b=>[b.id,b]));
  const collisions=[],distanceViolations=[],outwardViolations=[],sectorViolations=[],orderViolations=[];
  let maxGap=0;
  for(let i=0;i<boxes.length;i++)for(let j=0;j<i;j++){
   const a=boxes[i],b=boxes[j];
   if(Math.abs(a.x-b.x)<(a.w+b.w)/2+clearance-1e-4&&
      Math.abs(a.y-b.y)<(a.h+b.h)/2+clearance-1e-4)collisions.push([a.id,b.id]);
  }
  for(const edge of edges){
   const a=byId.get(edge.from),b=byId.get(edge.to);if(!a||!b)continue;
   const gap=this.gap(a,b);maxGap=Math.max(maxGap,gap);
   if(gap>2*baseHeight+1e-4)distanceViolations.push({from:a.id,to:b.id,gap,limit:2*baseHeight});
  }
  for(const n of nodes){
   const a=byId.get(n.id),parent=byId.get(n.parent);
   if(parent&&Math.hypot(a.x,a.y)<=Math.hypot(parent.x,parent.y)+1e-4)outwardViolations.push(n.id);
   const sector=sectors.get(owner.get(n.id));
   if(sector){
    // Test the entire rectangle, not just its centre.
    const corners=[[-1,-1],[-1,1],[1,-1],[1,1]];
    if(corners.some(([sx,sy])=>Math.abs(this.angleDelta(Math.atan2(a.y+sy*a.h/2,a.x+sx*a.w/2),sector.center))>sector.span/2+1e-5))
     sectorViolations.push(n.id);
   }
  }
  // Sibling order comes from the measured 01 plane and is part of the audit.
  const siblings=new Map();
  for(const n of nodes)if(n.parent&&n.parent!=='p1'){
   if(!siblings.has(n.parent))siblings.set(n.parent,[]);siblings.get(n.parent).push(n);
  }
  // nodes are supplied in the stable sibling order chosen by compute().
  for(const list of siblings.values())for(let i=1;i<list.length;i++){
   const a=byId.get(list[i-1].id),b=byId.get(list[i].id),s=sectors.get(owner.get(a.id));
   if(s&&this.angleDelta(Math.atan2(a.y,a.x),s.center)>this.angleDelta(Math.atan2(b.y,b.x),s.center)+1e-4)
    orderViolations.push([a.id,b.id]);
  }
  const origin=byId.get('p1');
  const centered=Boolean(origin)&&Math.hypot(origin.x,origin.y)<=1e-4;
  const complete=positions.size===nodes.length&&boxes.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.w>0&&b.h>0);
  return {valid:complete&&centered&&!collisions.length&&!distanceViolations.length&&!outwardViolations.length&&!sectorViolations.length&&!orderViolations.length,
   complete,centered,overlaps:collisions.length,collisions,distanceViolations,outwardViolations,sectorViolations,orderViolations,
   baseHeight,maxAllowedGap:2*baseHeight,maxGap};
 }
 compute(input){
  const plan=new RayPackingLayout().compute(input),metrics=input.metrics instanceof Map?input.metrics:new Map(input.metrics);
  const baseHeight=Math.min(...input.nodes.map(n=>metrics.get(n.id).h));
  const audit=RadialLayout.audit({nodes:plan.ordered,edges:input.edges,positions:plan.positions,metrics,
   sectors:plan.sectors,owner:plan.owner,baseHeight,clearance:plan.clearance});
  return {mode:'02',positions:plan.positions,rects:plan.rects,levels:plan.levels,
   stats:{...plan.stats,mode:'02',nodes:input.nodes.length,disconnected:plan.disconnected,overlaps:audit.overlaps,
    constraintsValid:audit.valid&&!plan.disconnected.length,geometricallySafe:audit.complete&&audit.centered&&!audit.overlaps&&!audit.outwardViolations.length,
    radialOrder:!audit.outwardViolations.length,baseHeight,maxAllowedGap:2*baseHeight,
    distanceViolations:audit.distanceViolations,outwardViolations:audit.outwardViolations,sectorViolations:audit.sectorViolations,
    orderViolations:audit.orderViolations,collisions:audit.collisions,sectors:Object.fromEntries(plan.sectors),owners:Object.fromEntries(plan.owner),
    searchStatus:audit.valid?'satisfied':'review',graphSignature:RadialLayout.signature(input.nodes,input.edges)}};
 }
}
