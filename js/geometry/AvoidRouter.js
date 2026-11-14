import {assignOrderedPorts} from './OrderedPorts.js';
import {PcbRouter} from './PcbRouter.js';
import {GeometryValidator} from './GeometryValidator.js';

let runtime;
async function browserRuntime(){
 if(!runtime)runtime=import('../vendor/libavoid.js').then(async({AvoidLib})=>{
  await AvoidLib.load(new URL('../vendor/libavoid.wasm',import.meta.url).href);return AvoidLib.getInstance();
 }).catch(error=>{runtime=null;throw error;});
 return runtime;
}

export async function computeAvoidRoutes({nodes,edges,positions,rects,levels,topologyReference},{load=browserRuntime}={}){
 const A=await load(),positionMap=new Map(positions),rectMap=new Map(rects),byId=new Map(nodes.map(n=>[n.id,n]));
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
   idealNudgingDistance:8,shapeBufferDistance:9}))router.setRoutingParameter(A.RoutingParameter[name],value);
  router.setRoutingOption(A.RoutingOption.nudgeOrthogonalTouchingColinearSegments,true);
  router.setRoutingOption(A.RoutingOption.nudgeOrthogonalSegmentsConnectedToShapes,false);
  router.setRoutingOption(A.RoutingOption.penaliseOrthogonalSharedPathsAtConnEnds,false);
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
  router.processTransaction();
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
   // Resolve shared native lanes with an incremental obstacle search. Each
   // failed segment adds only its conflicting occupied lane as a wall; the
   // rest of the scene stays available for genuine transverse crossings.
   if(rejected.length<=16){
    const walls=new Set();let trial=item.points;
    for(let attempt=0;attempt<20&&!accepted;attempt++){
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
   if(!accepted&&rejected.length<=3)consider(checker.fastCandidates(s,t,[...rectMap.values()],occupied,[e.from,e.to])?.points);
   for(const margin of !accepted&&rejected.length<=3?[100,300,700]:[]){
    if(accepted)break;
    consider(checker.findRouteGrid(s,t,[...rectMap.values()],occupied,true,margin,180));
   }
   if(accepted){
    routes.find(entry=>entry[0]===key)[1]=accepted;occupied.push(...checker.allSegments(accepted.points));
    for(const [id,p] of [[e.from,fromPort],[e.to,toPort]]){if(!used.has(id))used.set(id,[]);used.get(id).push(p);}
   }else {requestSpace(item.points);failures.push({edge:key,reason:item.reason});}
  }
  return {routes,calculations:connections.length,engine:'libavoid-0.5.0-beta.5',failures,clearanceRequests,budgetExceeded:false};
 }finally{
  router.delete();for(const object of owned.reverse())object.delete();
 }
}
