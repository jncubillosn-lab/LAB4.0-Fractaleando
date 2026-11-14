const opposite={top:'bottom',bottom:'top',left:'right',right:'left'};
const normal={top:[0,-1],bottom:[0,1],left:[-1,0],right:[1,0]};
const horizontalFace=side=>side==='top'||side==='bottom';
const fraction=(p,r)=>horizontalFace(p.side)?(p.x-r.l)/r.w:(p.y-r.t)/r.h;
const manhattan=(a,b)=>Math.abs(a.x-b.x)+Math.abs(a.y-b.y);

// Central reflection: e.g. upper-right at 2 h becomes lower-left at 8 h.
export function reflectedEntry(source,fromRect,toRect,makePort){
 return makePort(toRect,opposite[source.side],1-fraction(source,fromRect));
}

export function facingPortPairs({a,b,fromPorts,toPorts,makePort,usedFrom=[],usedTo=[]}){
 const dx=b.x-a.x,dy=b.y-a.y,pairs=[],seen=new Set();
 const free=(p,used)=>!used.some(old=>Math.hypot(old.x-p.x,old.y-p.y)<11);
 const forward=p=>{const [nx,ny]=normal[p.side];return nx*dx+ny*dy>1e-7;};
 const toward=p=>{const [nx,ny]=normal[p.side];return nx*dx+ny*dy< -1e-7;};
 const gapX=Math.abs(dx)-(a.w+b.w)/2,gapY=Math.abs(dy)-(a.h+b.h)/2;
 const preferred=gapX>gapY?(dx>0?'right':'left'):(dy>0?'bottom':'top');
 const add=(from,to,direct=false)=>{
  if(!free(from,usedFrom)||!free(to,usedTo))return;
  const key=[from.x,from.y,to.x,to.y].map(v=>v.toFixed(4)).join('|');if(seen.has(key))return;seen.add(key);
  const opposed=opposite[from.side]===to.side;
  pairs.push({from,to,direct,rank:direct?0:opposed&&from.side===preferred?1:opposed?2:3,
   distance:manhattan(from,to),offset:manhattan(from,a)+manhattan(to,b)});
 };
 // A common coordinate on facing faces avoids two artificial elbows.
 for(const horizontal of [true,false]){
  const forwardBox=horizontal?b.l>a.r:b.t>a.b,backwardBox=horizontal?a.l>b.r:a.t>b.b;
  if(!forwardBox&&!backwardBox)continue;
  const lo=horizontal?Math.max(a.t+a.h*.08,b.t+b.h*.08):Math.max(a.l+a.w*.08,b.l+b.w*.08);
  const hi=horizontal?Math.min(a.b-a.h*.08,b.b-b.h*.08):Math.min(a.r-a.w*.08,b.r-b.w*.08);
  if(lo>hi)continue;
  const sideA=horizontal?(forwardBox?'right':'left'):(forwardBox?'bottom':'top'),sideB=opposite[sideA];
  const values=[(lo+hi)/2,...fromPorts.filter(p=>p.side===sideA).map(p=>horizontal?p.y:p.x),
   ...toPorts.filter(p=>p.side===sideB).map(p=>horizontal?p.y:p.x)];
  for(const value of values)if(value>=lo&&value<=hi){
   add(makePort(a,sideA,horizontal?(value-a.t)/a.h:(value-a.l)/a.w),
    makePort(b,sideB,horizontal?(value-b.t)/b.h:(value-b.l)/b.w),true);
  }
 }
 for(const from of fromPorts)if(forward(from))add(from,reflectedEntry(from,a,b,makePort));
 // Other free pairs remain available when reflection is occupied or obstructed.
 for(const from of fromPorts)if(forward(from))for(const to of toPorts)if(toward(to))add(from,to);
 return pairs.sort((p,q)=>p.rank-q.rank||p.distance-q.distance||p.offset-q.offset);
}

// Local routing only: the initial 01 reference and previously valid links are
// untouched. Compare safe short candidates before committing to a long detour.
export function routeFacingLink({edge,a,b,fromPorts,toPorts,makePort,usedFrom,usedTo,router,
 obstacles,occupied,onAttempt=()=>{},deadline=Infinity}){
 const pairs=facingPortPairs({a,b,fromPorts,toPorts,makePort,usedFrom,usedTo});
 const own=[edge.from,edge.to];let best=null;
 const accept=(result,pair)=>{
  if(!result)return;
  const length=result.points.slice(1).reduce((sum,p,i)=>sum+manhattan(result.points[i],p),0);
  if(!best||result.crosses<best.crosses||result.crosses===best.crosses&&
   (length<best.length-.001||Math.abs(length-best.length)<.001&&result.points.length<best.points.length))
   best={...result,length,fromPort:pair.from,toPort:pair.to};
 };
 for(const pair of pairs.slice(0,24)){
  if(performance.now()>=deadline)break;
  const {from,to}=pair;onAttempt();
  const fast=router.fastCandidates({x:from.sx,y:from.sy},{x:to.sx,y:to.sy},obstacles,occupied,own);
  if(!fast)continue;
  const points=router.simplify([{x:from.x,y:from.y},...fast.points,{x:to.x,y:to.y}]);
  if(router.routeShapeValid(points,obstacles,own,occupied,false)!==0)continue;
  accept({points,crosses:0},pair);
  if(pair.direct&&points.length===2)return best;
 }
 if(best)return best;
 for(const pair of pairs.slice(0,4)){
  if(performance.now()>=deadline)break;
  onAttempt();
  const result=router.routeEdge({...pair.from,id:edge.from},{...pair.to,id:edge.to},obstacles,occupied);
  accept(result,pair);
  if(best?.crosses===0)break;
 }
 return best;
}
