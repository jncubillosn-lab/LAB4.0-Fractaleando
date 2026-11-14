import {segmentAxis} from './SegmentGeometry.js';
import {routeCrossings} from './CircuitGeometry.js';

// Bevel actual coordinates, then audit those coordinates. Never decorate an
// orthogonal centreline with diagonals that the geometry checks cannot see.
export function bevelRoutes({routes,rects,router,validator}){
 const output=new Map(routes),bounds=[...rects.values()];let beveled=0,retained=0,savedLength=0;
 const length=points=>points.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-points[i].x,p.y-points[i].y),0);
 for(const [key,route] of output){
  if(!route.points)continue;
  let points=route.points.map(p=>({...p}));
  const others=[...output].filter(([id,r])=>id!==key&&r.points);
  const occupied=others.flatMap(([routeKey,r])=>router.allSegments(r.points).map(s=>({...s,routeKey})));
  const signature=candidate=>{
   const events=others.flatMap(([other,r])=>routeCrossings(candidate,r.points).map(e=>({other,at:e.at})));
   return JSON.stringify(events.sort((a,b)=>a.at-b.at||a.other.localeCompare(b.other)).map(e=>e.other));
  };
  const baseline=signature(points),originalLength=length(points);
  for(let i=1;i<points.length-1;i++){
   const a=points[i-1],b=points[i],c=points[i+1],first=segmentAxis(a,b),second=segmentAxis(b,c);
   if(!first||!second||first===second)continue;
   const ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y);
   const room=Math.min(12,ab*.4,bc*.4,i===1?ab-9.05:Infinity,i===points.length-2?bc-9.05:Infinity);
   let accepted=false;
   for(const size of [...new Set([room,Math.min(room,6),Math.min(room,3),Math.min(room,.75)])]){
    if(size<.05)continue;
    const p={x:b.x+(a.x-b.x)*size/ab,y:b.y+(a.y-b.y)*size/ab};
    const q={x:b.x+(c.x-b.x)*size/bc,y:b.y+(c.y-b.y)*size/bc};
    const candidate=[...points.slice(0,i),p,q,...points.slice(i+1)];
    if(!validator.validateRoute({...route,points:candidate},bounds,occupied).ok||signature(candidate)!==baseline)continue;
    points=candidate;i++;beveled++;accepted=true;break;
   }
   if(!accepted)retained++;
  }
  savedLength+=originalLength-length(points);
  output.set(key,{...route,points,style:'circuit45'});
 }
 return {routes:[...output],stats:{beveledCorners:beveled,retainedCorners:retained,savedLength}};
}
