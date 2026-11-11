import {PcbRouter} from '../geometry/PcbRouter.js';

// All inputs are plain structured-clone data. No DOM, CSS, or canvas in workers.
export function computeInitialRoutes({nodes,edges,positions,rects,levels}){
 const state={nodes,edges},byId=new Map(nodes.map(n=>[n.id,n]));
 const router=new PcbRouter({state,nodeById:id=>byId.get(id),clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const positionMap=new Map(positions),rectMap=new Map(rects);
 const priority=e=>Math.min(levels[e.from]??1000,levels[e.to]??1000)*10+
  (e.kind==='transversal'?5:0)+(Math.abs((levels[e.from]??1000)-(levels[e.to]??1000))>1?2:0);
 const ordered=edges.map((e,i)=>({...e,__index:i})).sort((a,b)=>priority(a)-priority(b)||a.__index-b.__index);
 const ports=router.assignPorts(ordered,positionMap,rectMap),occupied=[],routes=[];
 const key=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
 for(const [i,e] of ordered.entries()){
  const from=ports.get(i+':'+e.from),to=ports.get(i+':'+e.to);
  let route;
  if(!from||!to)route={edge:{...e},points:null,unresolved:true};
  else {
   const result=router.routeEdge({...from,id:e.from},{...to,id:e.to},[...rectMap.values()],occupied);
   route=result?{edge:{...e},points:result.points,crosses:result.crosses,fromPort:{...from},toPort:{...to}}:
    {edge:{...e},points:null,unresolved:true};
  }
  routes.push([key(e),route]);
  if(route.points)occupied.push(...router.allSegments(route.points));
 }
 return {routes,calculations:ordered.length};
}
if(typeof WorkerGlobalScope!=='undefined' && self instanceof WorkerGlobalScope){
 self.addEventListener('message',event=>{
  try{self.postMessage({token:event.data.token,result:computeInitialRoutes(event.data)});}
  catch(error){self.postMessage({token:event.data.token,error:String(error?.message||error)});}
 });
}
