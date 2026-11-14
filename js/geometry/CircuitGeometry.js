import {segmentAxis,segmentIntersection} from './SegmentGeometry.js';

export function circuitAxis(a,b){
 return segmentAxis(a,b)||(Math.abs(Math.abs(b.x-a.x)-Math.abs(b.y-a.y))<.01&&Math.hypot(b.x-a.x,b.y-a.y)>.01?'d':null);
}

// H/V/45 geometry. A crossing is accepted right beside or at a bend: there
// is no clearance threshold to the bend. Collinear shared lanes still fail.
export function circuitRelation(a,b,c,d,separation=3){
 const vx=b.x-a.x,vy=b.y-a.y,wx=d.x-c.x,wy=d.y-c.y;
 const length=Math.hypot(vx,vy),otherLength=Math.hypot(wx,wy);
 if(length<1e-8||otherLength<1e-8)return {overlap:false,cross:0};
 if(Math.abs(vx*wy-vy*wx)<1e-8*length*otherLength){
  const ux=vx/length,uy=vy/length,dist=Math.abs((c.x-a.x)*uy-(c.y-a.y)*ux);
  const p=(c.x-a.x)*ux+(c.y-a.y)*uy,q=(d.x-a.x)*ux+(d.y-a.y)*uy;
  const shared=Math.min(length,Math.max(p,q))-Math.max(0,Math.min(p,q));
  return {overlap:dist<separation-1e-6&&shared>.5,cross:0};
 }
 const hit=segmentIntersection(a,b,c,d);
 return hit?{overlap:false,cross:1,at:{x:hit.x,y:hit.y}}:{overlap:false,cross:0};
}

// Arc-length positions count a crossing at a vertex once, including diagonals.
export function routeCrossings(points,otherPoints){
 const events=[];let offset=0;
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.y-a.y);
  for(let j=1;j<otherPoints.length;j++){
   const hit=segmentIntersection(a,b,otherPoints[j-1],otherPoints[j]);
   if(hit&&!events.some(e=>Math.hypot(e.x-hit.x,e.y-hit.y)<1e-6))events.push({x:hit.x,y:hit.y,at:offset+hit.t*length});
  }
  offset+=length;
 }
 return events.sort((a,b)=>a.at-b.at);
}
