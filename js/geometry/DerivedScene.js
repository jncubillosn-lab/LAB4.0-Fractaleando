import {ViewLayouts} from './ViewLayouts.js';
import {computeAvoidRoutes} from './AvoidRouter.js';
import {bevelRoutes} from './CircuitRoutes.js';
import {PcbRouter} from './PcbRouter.js';
import {GeometryValidator} from './GeometryValidator.js';

export const SCENE_VERSION='packed-circuit-0.2.3';

// Placement and routing share the same capacity model. Space is requested
// only beside congested corridors, never by expanding every generation.
export async function computeDerivedScene(input,{load,onProgress=()=>{}}={}){
 const engine=new ViewLayouts();
 const solve=async(mode,baseLayout)=>{
  const degree=new Map(input.nodes.map(n=>[n.id,0]));
  for(const e of input.edges){degree.set(e.from,degree.get(e.from)+1);degree.set(e.to,degree.get(e.to)+1);}
  let nodeClearances=Object.fromEntries([...degree].map(([id,count])=>[id,Math.max(24,12+count*8)])),best=null;
  for(let pass=0;pass<12;pass++){
   onProgress({mode,pass:pass+1});
   const layout=engine.compute({...input,mode,baseLayout,nodeClearances});
   if(!layout.stats.geometricallySafe)throw Error('Distribución incompleta o con solapes.');
   const result=await computeAvoidRoutes({...input,positions:layout.positions,rects:layout.rects,levels:layout.levels},{load});
   const pending=result.routes.filter(([,r])=>!r.points).length;
   const candidate={layout,result};
   if(!best||pending<best.pending||pending===best.pending&&layout.stats.meanGap<best.layout.stats.meanGap)best={...candidate,pending};
   layout.stats.capacityPasses=pass+1;
   if(!pending)break;
   const next={...nodeClearances,...result.clearanceRequests};
   if(JSON.stringify(next)===JSON.stringify(nodeClearances))break;
   nodeClearances=next;
  }
  const router=new PcbRouter({state:input,nodeById:id=>input.nodes.find(n=>n.id===id),mode,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
  const validator=new GeometryValidator({router,rectOverlap:(a,b)=>ViewLayouts.overlap(a,b,0)});
  const circuit=bevelRoutes({routes:best.result.routes,rects:best.layout.rects,router,validator});
  best.result.routes=circuit.routes;best.layout.stats.circuit=circuit.stats;
  const complete=best.result.routes.filter(([,r])=>r.points);
  best.layout.stats.routing={straight:complete.filter(([,r])=>r.points.length===2).length,
   length:complete.reduce((sum,[,r])=>sum+r.points.slice(1).reduce((s,p,i)=>s+Math.hypot(p.x-r.points[i].x,p.y-r.points[i].y),0),0)};
  return best;
 };
 const baseScene=input.baseScene||await solve('02');
 if(input.mode==='02')return {...baseScene,baseScene:null};
 const scene=await solve('04',baseScene.layout);
 return {...scene,baseScene:input.baseScene?null:baseScene};
}
