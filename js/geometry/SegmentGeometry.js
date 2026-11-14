// Shared numerical geometry. Coordinates remain unchanged: a nearly
// orthogonal segment is intersected as the actual line that will be drawn.
export const ORTHOGONAL_TOLERANCE=.01;
export const PORT_TOLERANCE=.12;
const EPS=1e-9;
export function segmentAxis(a,b){
 const dx=Math.abs(a.x-b.x),dy=Math.abs(a.y-b.y);
 if(dx+dy<ORTHOGONAL_TOLERANCE)return null;
 if(dy<ORTHOGONAL_TOLERANCE)return 'h';
 if(dx<ORTHOGONAL_TOLERANCE)return 'v';
 return null;
}
export function routeSegments(points){
 const out=[];
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i];
  if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<ORTHOGONAL_TOLERANCE)continue;
  out.push({a,b,h:segmentAxis(a,b)==='h'});
 }
 return out;
}
/** Exact finite-segment intersection, including endpoint contacts. */
export function segmentIntersection(a,b,c,d){
 const rx=b.x-a.x,ry=b.y-a.y,sx=d.x-c.x,sy=d.y-c.y,den=rx*sy-ry*sx;
 if(Math.abs(den)<=EPS*Math.max(1,Math.hypot(rx,ry)*Math.hypot(sx,sy)))return null;
 const t=((c.x-a.x)*sy-(c.y-a.y)*sx)/den;
 const u=((c.x-a.x)*ry-(c.y-a.y)*rx)/den;
 if(t<-EPS||t>1+EPS||u<-EPS||u>1+EPS)return null;
 return {x:a.x+t*rx,y:a.y+t*ry,t,u};
}
/** Clip against a padded rectangle without assigning an approximate axis. */
export function segmentEntersRect(a,b,r,pad=0){
 let first=0,last=1;
 for(const [p,delta,lo,hi] of [[a.x,b.x-a.x,r.l-pad,r.r+pad],[a.y,b.y-a.y,r.t-pad,r.b+pad]]){
  if(Math.abs(delta)<=EPS){if(p<=lo+EPS||p>=hi-EPS)return false;continue;}
  let t0=(lo-p)/delta,t1=(hi-p)/delta;
  if(t0>t1)[t0,t1]=[t1,t0];
  first=Math.max(first,t0);last=Math.min(last,t1);
  if(last-first<=EPS)return false;
 }
 return last-first>EPS;
}
/** The first segment must leave its own face, never cross its own box. */
export function leavesRect(a,b,r){
 const dx=b.x-a.x,dy=b.y-a.y;
 return (Math.abs(a.x-r.l)<PORT_TOLERANCE&&dx<0&&Math.abs(dy)<ORTHOGONAL_TOLERANCE)||
  (Math.abs(a.x-r.r)<PORT_TOLERANCE&&dx>0&&Math.abs(dy)<ORTHOGONAL_TOLERANCE)||
  (Math.abs(a.y-r.t)<PORT_TOLERANCE&&dy<0&&Math.abs(dx)<ORTHOGONAL_TOLERANCE)||
  (Math.abs(a.y-r.b)<PORT_TOLERANCE&&dy>0&&Math.abs(dx)<ORTHOGONAL_TOLERANCE);
}
