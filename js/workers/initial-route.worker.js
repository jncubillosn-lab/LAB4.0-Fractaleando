import {computeCompactRoutes} from '../geometry/CompactRouteEngine.js';
import {PcbRouter} from '../geometry/PcbRouter.js';

// All inputs are plain structured-clone data. No DOM, CSS, or canvas in workers.
export function computeInitialRoutes({nodes,edges,positions,rects,levels,mode='01',
 sourcePositions=null,sourceRoutes=null}){
 if(mode==='02'&&sourcePositions&&sourceRoutes)
  return computeCompactRoutes({nodes,edges,positions,rects,levels,sourcePositions,sourceRoutes});
 const state={nodes,edges},byId=new Map(nodes.map(n=>[n.id,n]));
 const router=new PcbRouter({state,nodeById:id=>byId.get(id),mode,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
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
 // On a different browser/font metric, a preassigned port may be blocked.
 // Retry *only* unresolved edges using vacant independent ports. Existing
 // successful paths are immutable: this is Walk Around, not global relayout.
 let attempts=ordered.length;
 const missing=routes.filter(([key,r])=>!r.points);
 const retryBudget=mode==='01'?120:Math.min(1400,Math.max(180,missing.length*18));
 const routeBudgetMs=mode==='01'?2900:mode==='02'?6800:mode==='03'?2500:4700;
 const retryDeadline=performance.now()+(mode==='01'?12000:24000);
 if(missing.length){
  const used=new Map();
  for(const [,r] of routes)if(r.points){
   for(const [id,port] of [[r.edge.from,r.fromPort],[r.edge.to,r.toPort]]){
    if(!used.has(id))used.set(id,[]);used.get(id).push(port);
   }
  }
  function freePorts(id,otherId,edge){
   const r=rectMap.get(id),at=positionMap.get(id),target=positionMap.get(otherId),other=byId.get(otherId),node=byId.get(id);
   if(!r||!at||!target)return [];
   const preferred=router.prefSide({...node,...at},{...other,...target},edge);
   const dx=target.x-at.x,dy=target.y-at.y;
   const sides=[...new Set([preferred,dx>=0?'right':'left',dy>=0?'bottom':'top',
    dy>=0?'top':'bottom',dx>=0?'left':'right'])];
   const out=[];
   // Breadth-first across faces, not nine attempts on a single face.
   for(const fraction of [.5,.31,.69,.19,.81,.41,.59]){
    for(const side of sides){
     const port={side},stub=router.portStub;
     if(side==='top'||side==='bottom'){
      port.x=r.l+fraction*r.w;port.y=side==='top'?r.t:r.b;
      port.sx=port.x;port.sy=port.y+(side==='top'?-stub:stub);
     }else{
      port.x=side==='left'?r.l:r.r;port.y=r.t+fraction*r.h;
      port.sx=port.x+(side==='left'?-stub:stub);port.sy=port.y;
     }
     if((used.get(id)||[]).some(p=>Math.hypot(p.x-port.x,p.y-port.y)<11))continue;
     out.push(port);
    }
   }
   return out;
  }
  for(const [key,missingRoute] of missing){
   const edge=missingRoute.edge;
   const a=freePorts(edge.from,edge.to,edge),b=freePorts(edge.to,edge.from,edge);
   const choices=[];
   for(let i=0;i<Math.min(a.length,mode==='04'?22:9);i++)for(let j=0;j<Math.min(b.length,mode==='04'?15:6);j++)choices.push([i,j]);
   choices.sort((p,q)=>(p[0]+p[1])-(q[0]+q[1]));
   const begun=performance.now();let replacement=null;
   for(const [i,j] of choices){
    if(attempts-ordered.length>retryBudget||performance.now()-begun>routeBudgetMs||performance.now()>retryDeadline)break;
    const from=a[i],to=b[j];attempts++;
    const result=router.routeEdge({...from,id:edge.from},{...to,id:edge.to},[...rectMap.values()],occupied);
    if(result){replacement={edge:{...edge},points:result.points,crosses:result.crosses,fromPort:from,toPort:to};break;}
   }
   if(replacement){
    const index=routes.findIndex(([k])=>k===key);routes[index]=[key,replacement];
    occupied.push(...router.allSegments(replacement.points));
    for(const [id,port] of [[edge.from,replacement.fromPort],[edge.to,replacement.toPort]]){
     if(!used.has(id))used.set(id,[]);used.get(id).push(port);
    }
   }
  }
 }
 return {routes,calculations:attempts};
}
if(typeof WorkerGlobalScope!=='undefined' && self instanceof WorkerGlobalScope){
 self.addEventListener('message',event=>{
  try{self.postMessage({token:event.data.token,result:computeInitialRoutes(event.data)});}
  catch(error){self.postMessage({token:event.data.token,error:String(error?.message||error)});}
 });
}
