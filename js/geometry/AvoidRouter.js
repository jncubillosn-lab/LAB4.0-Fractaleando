import {assignOrderedPorts,portAt,portCycle,samePortCycle} from './OrderedPorts.js';
import {portInset} from './PortPolicy.js';
import {routeFacingLink} from './FacingPorts.js';
import {PcbRouter} from './PcbRouter.js';
import {GeometryValidator} from './GeometryValidator.js';

let runtime;
async function browserRuntime(){
 if(!runtime)runtime=import('../vendor/libavoid.js').then(async({AvoidLib})=>{
  await AvoidLib.load(new URL('../vendor/libavoid.wasm',import.meta.url).href);return AvoidLib.getInstance();
 }).catch(error=>{runtime=null;throw error;});
 return runtime;
}

export async function computeAvoidRoutes({nodes,edges,positions,rects,levels,topologyReference,repairAttempts=20},{load=browserRuntime,onProgress=()=>{}}={}){
 const A=await load(),positionMap=new Map(positions),rectMap=new Map(rects),byId=new Map(nodes.map(n=>[n.id,n]));
 const compactRecovery=repairAttempts<20;
 const priority=e=>Math.min(levels[e.from]??1000,levels[e.to]??1000)*10+(e.kind==='transversal'?5:0)+(Math.abs((levels[e.from]??1000)-(levels[e.to]??1000))>1?2:0);
 const ordered=edges.map((e,i)=>({...e,__index:i})).sort((a,b)=>priority(a)-priority(b)||a.__index-b.__index);
 const ports=assignOrderedPorts({nodes,edges:ordered,positions:positionMap,rects:rectMap,reference:topologyReference});
 const checker=new PcbRouter({state:{nodes,edges},nodeById:id=>byId.get(id),mode:'02',clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const validator=new GeometryValidator({router:checker,rectOverlap:(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t});
 const router=new A.Router(A.RouterFlag.OrthogonalRouting.value),owned=[],connections=[];
 const keep=value=>{owned.push(value);return value;};
 const point=(x,y)=>keep(new A.Point(x,y));
 try{
  for(const [name,value] of Object.entries({segmentPenalty:10,crossingPenalty:0,fixedSharedPathPenalty:0,
   idealNudgingDistance:compactRecovery?4:8,shapeBufferDistance:9}))router.setRoutingParameter(A.RoutingParameter[name],value);
  router.setRoutingOption(A.RoutingOption.nudgeOrthogonalTouchingColinearSegments,true);
  router.setRoutingOption(A.RoutingOption.nudgeOrthogonalSegmentsConnectedToShapes,false);
  router.setRoutingOption(A.RoutingOption.penaliseOrthogonalSharedPathsAtConnEnds,false);
  if(compactRecovery){
   router.setRoutingOption(A.RoutingOption.performUnifyingNudgingPreprocessingStep,false);
   router.setRoutingOption(A.RoutingOption.nudgeSharedPathsWithCommonEndPoint,false);
  }
  const shapes=new Map();
  for(const r of rectMap.values())shapes.set(r.id,new A.ShapeRef(router,keep(new A.Rectangle(point(r.l,r.t),point(r.r,r.b)))));
  for(const [i,e] of ordered.entries()){
   const fromPort=ports.get(i+':'+e.from),toPort=ports.get(i+':'+e.to);
   if(!fromPort||!toPort){connections.push({e});continue;}
   const ends=[];
   for(const [id,p] of [[e.from,fromPort],[e.to,toPort]]){
    const r=rectMap.get(id),pinId=i+1;
    const pin=new A.ShapeConnectionPin(shapes.get(id),pinId,p.x-r.l,p.y-r.t,false,0,{top:1,bottom:2,left:4,right:8}[p.side]);
    pin.setExclusive(true);ends.push(keep(new A.ConnEnd(shapes.get(id),pinId)));
   }
   const conn=new A.ConnRef(router,ends[0],ends[1]);
   conn.setRoutingType(A.ConnType.ConnType_Orthogonal);
   connections.push({e,conn,fromPort,toPort});
  }
  onProgress('native-start');router.processTransaction();onProgress('native-done');
  const routes=[],occupied=[],used=new Map(),failures=[],clearanceRequests={},rejected=[];
  const requestSpace=points=>{
   let hits=0;
   for(const a of checker.allSegments(points))for(const b of occupied){
    const q=checker.segmentRelation(a.a,a.b,b.a,b.b);if(!q.overlap)continue;
    let x,y,distance=0;
    if(a.h===b.h){
     const lo=Math.max(Math.min(a.h?a.a.x:a.a.y,a.h?a.b.x:a.b.y),Math.min(a.h?b.a.x:b.a.y,a.h?b.b.x:b.b.y));
     const hi=Math.min(Math.max(a.h?a.a.x:a.a.y,a.h?a.b.x:a.b.y),Math.max(a.h?b.a.x:b.a.y,a.h?b.b.x:b.b.y));
     if(a.h){x=(lo+hi)/2;y=(a.a.y+b.a.y)/2;distance=Math.abs(a.a.y-b.a.y);}
     else{x=(a.a.x+b.a.x)/2;y=(lo+hi)/2;distance=Math.abs(a.a.x-b.a.x);}
    }else {x=a.h?b.a.x:a.a.x;y=a.h?a.a.y:b.a.y;}
    const close=[...rectMap.values()].map(r=>({r,d:Math.hypot(Math.max(0,r.l-x,x-r.r),Math.max(0,r.t-y,y-r.b))}))
     .sort((a,b)=>a.d-b.d).slice(0,2);
    for(const {r,d} of close)if(d<100)clearanceRequests[r.id]=Math.max(clearanceRequests[r.id]||0,
     (r.routingClearance||24)+Math.max(6,Math.ceil((8-distance)*2)));
    if(++hits>=3)return;
   }
  };
  for(const {e,conn,fromPort,toPort} of connections){
   const key=[e.from,e.to].sort().map(encodeURIComponent).join('|');
   let route={edge:e,points:null,unresolved:true};
   if(conn&&conn.hasValidRoute()){
    const path=conn.displayRoute(),middle=[];for(let i=0;i<path.size();i++){const p=path.at(i);middle.push({x:p.x,y:p.y});}
    const points=checker.simplify([{x:fromPort.x,y:fromPort.y},...middle,{x:toPort.x,y:toPort.y}]);
    const candidate={edge:e,points,fromPort,toPort};
    const checked=validator.validateRoute(candidate,[...rectMap.values()],occupied,used);
    if(checked.ok){route=candidate;occupied.push(...checker.allSegments(points));
     for(const [id,p] of [[e.from,fromPort],[e.to,toPort]]){if(!used.has(id))used.set(id,[]);used.get(id).push(p);}
    }else {rejected.push({key,e,fromPort,toPort,points,reason:checked.reason});}
   }
   routes.push([key,route]);
  }
  // Native nudging can leave a small number of conflicts in narrow corridors.
  // Search those corridors against the complete accepted scene, with the same
  // ports and the independent checker. Never loosen acceptance on a retry.
  for(const item of rejected){
   const {key,e,fromPort,toPort}=item;
   const start={x:fromPort.x,y:fromPort.y},end={x:toPort.x,y:toPort.y};
   const s={x:fromPort.sx,y:fromPort.sy},t={x:toPort.sx,y:toPort.sy};
   let accepted=null;
   const consider=middle=>{
    if(!middle)return;
    const candidate={edge:e,fromPort,toPort,points:checker.simplify([start,...middle,end])};
    if(validator.validateRoute(candidate,[...rectMap.values()],occupied,used).ok)accepted=candidate;
   };
   // Try short local lanes first. The tighter spiral bounds native repairs;
   // unresolved corridors then feed the placement capacity model.
   if(compactRecovery){
    consider(checker.fastCandidates(s,t,[...rectMap.values()],occupied,[e.from,e.to])?.points);
    if(!accepted)consider(checker.wideCandidates(start,s,t,end,[...rectMap.values()],occupied,[e.from,e.to])?.points);
    if(!accepted)consider(checker.findRouteGrid(s,t,[...rectMap.values()],occupied,true,350,300));
   }
   // Resolve shared native lanes with an incremental obstacle search. Each
   // failed segment adds only its conflicting occupied lane as a wall; the
   // rest of the scene stays available for genuine transverse crossings.
   if(!accepted&&repairAttempts>0&&(compactRecovery||rejected.length<=16)){
    const walls=new Set();let trial=item.points;
    for(let attempt=0;attempt<repairAttempts&&!accepted;attempt++){
     const previous=walls.size;
     for(const a of checker.allSegments(trial))for(let i=0;i<occupied.length;i++){
      const b=occupied[i];if(checker.segmentRelation(a.a,a.b,b.a,b.b).overlap)walls.add(i);
     }
     if(previous===walls.size)break;
     const local=new A.Router(A.RouterFlag.OrthogonalRouting.value),values=[];
     const pt=(x,y)=>{const p=new A.Point(x,y);values.push(p);return p;};
     const box=(l,t,r,b)=>{const rect=new A.Rectangle(pt(l,t),pt(r,b));values.push(rect);new A.ShapeRef(local,rect);};
     try{
      local.setRoutingParameter(A.RoutingParameter.shapeBufferDistance,0);
      local.setRoutingParameter(A.RoutingParameter.segmentPenalty,10);
      for(const r of rectMap.values())box(r.l-9,r.t-9,r.r+9,r.b+9);
      for(const index of walls){const b=occupied[index],pad=3.25;
       box(Math.min(b.a.x,b.b.x)-pad,Math.min(b.a.y,b.b.y)-pad,Math.max(b.a.x,b.b.x)+pad,Math.max(b.a.y,b.b.y)+pad);
      }
      const ends=[new A.ConnEnd(pt(s.x,s.y)),new A.ConnEnd(pt(t.x,t.y))];values.push(...ends);
      const conn=new A.ConnRef(local,...ends);conn.setRoutingType(A.ConnType.ConnType_Orthogonal);local.processTransaction();
      if(!conn.hasValidRoute())break;
      const path=conn.displayRoute(),middle=[];for(let i=0;i<path.size();i++){const p=path.at(i);middle.push({x:p.x,y:p.y});}
      trial=checker.simplify([start,...middle,end]);consider(middle);
     }finally{local.delete();for(const object of values.reverse())object.delete();}
    }
   }
   if(!accepted&&!compactRecovery&&rejected.length<=3)consider(checker.fastCandidates(s,t,[...rectMap.values()],occupied,[e.from,e.to])?.points);
   for(const margin of !accepted&&!compactRecovery&&rejected.length<=3?[100,300,700]:[]){
    if(accepted)break;
    consider(checker.findRouteGrid(s,t,[...rectMap.values()],occupied,true,margin,180));
   }
   if(accepted){
    routes.find(entry=>entry[0]===key)[1]=accepted;occupied.push(...checker.allSegments(accepted.points));
    for(const [id,p] of [[e.from,fromPort],[e.to,toPort]]){if(!used.has(id))used.set(id,[]);used.get(id).push(p);}
   }else {requestSpace(item.points);failures.push({edge:key,reason:item.reason});}
  }
  let extraCalculations=0;
  if(compactRecovery&&routes.filter(([,r])=>!r.points).length<=4)for(const [index,e] of ordered.entries()){
   const key=[e.from,e.to].sort().map(encodeURIComponent).join('|'),entry=routes.find(([k])=>k===key);
   if(entry[1].points)continue;
   const a=rectMap.get(e.from),b=rectMap.get(e.to);
   const reserved=id=>ordered.flatMap((edge,i)=>i===index||edge.from!==id&&edge.to!==id?[]:[ports.get(i+':'+id)]).filter(Boolean);
   const candidates=id=>{
    const r=rectMap.get(id),out=[ports.get(index+':'+id)].filter(Boolean);
    for(const side of ['top','right','bottom','left']){
     const horizontal=side==='top'||side==='bottom',length=horizontal?r.w:r.h,inset=portInset(r,side);
     for(const f of [.5,.25,.75,0,1,.125,.875,.375,.625]){
      const at=inset+f*(length-2*inset),p=portAt(side,horizontal?r.l+at:side==='left'?r.l:r.r,
       horizontal?(side==='top'?r.t:r.b):r.t+at,rectMap,id);if(p)out.push(p);
     }
    }
    return out;
   };
   const before=new Map([e.from,e.to].map(id=>[id,portCycle({edges:ordered,ports,id})]));
   const admissible=(id,p)=>{
    const k=index+':'+id,previous=ports.get(k);ports.set(k,p);
    const ok=samePortCycle(before.get(id),portCycle({edges:ordered,ports,id}));
    previous?ports.set(k,previous):ports.delete(k);return ok;
   };
   const makePort=(r,side,f)=>{
    const horizontal=side==='top'||side==='bottom';
    return portAt(side,horizontal?r.l+f*r.w:side==='left'?r.l:r.r,
     horizontal?(side==='top'?r.t:r.b):r.t+f*r.h,rectMap,r.id);
   };
   const recover=(from,to)=>{
    const s={x:from.sx,y:from.sy},t={x:to.sx,y:to.sy},own=[e.from,e.to];
    const middle=checker.fastCandidates(s,t,[...rectMap.values()],occupied,own)?.points||
     checker.findRouteGrid(s,t,[...rectMap.values()],occupied,true,350,100);
    if(!middle)return null;
    const points=checker.simplify([{x:from.x,y:from.y},...middle,{x:to.x,y:to.y}]);
    const check=validator.validateRoute({edge:e,points,fromPort:from,toPort:to},[...rectMap.values()],occupied,used);
    return check.ok?{points,crosses:check.crossings||0}:null;
   };
   const result=routeFacingLink({edge:e,a,b,fromPorts:candidates(e.from),toPorts:candidates(e.to),makePort,
    usedFrom:reserved(e.from),usedTo:reserved(e.to),router:checker,obstacles:[...rectMap.values()],occupied,
    acceptPair:(from,to)=>admissible(e.from,from)&&admissible(e.to,to),routeCandidate:recover,
    portSpacing:8,allowAnyFace:true,allowCrossings:true,deadline:performance.now()+400,onAttempt:()=>extraCalculations++});
   if(!result)continue;
   const candidate={edge:e,points:result.points,fromPort:result.fromPort,toPort:result.toPort};
   if(!validator.validateRoute(candidate,[...rectMap.values()],occupied,used).ok)continue;
   entry[1]=candidate;occupied.push(...checker.allSegments(candidate.points));
   for(const [id,p] of [[e.from,candidate.fromPort],[e.to,candidate.toPort]]){
    ports.set(index+':'+id,p);if(!used.has(id))used.set(id,[]);used.get(id).push(p);
   }
   const failure=failures.findIndex(f=>f.edge===key);if(failure>=0)failures.splice(failure,1);
  }
  // Every unresolved spiral corridor must request real capacity. A conflict
  // far from a box can otherwise leave requestSpace empty and stop retries
  // with the identical placement. Reserve space at both terminal nodes too.
  if(compactRecovery)for(const [,route] of routes)if(!route.points){
   for(const id of [route.edge.from,route.edge.to])clearanceRequests[id]=Math.max(clearanceRequests[id]||0,
    (rectMap.get(id).routingClearance||24)+12);
  }
  onProgress('repairs-done');
  return {routes,calculations:connections.length+extraCalculations,engine:'libavoid-0.5.0-beta.5',failures,clearanceRequests,budgetExceeded:false};
 }finally{
  router.delete();for(const object of owned.reverse())object.delete();
 }
}
