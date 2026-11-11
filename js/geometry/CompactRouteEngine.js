// Enrutamiento especializado en la vista 02: transportar primero
// los recorridos interiores de subárboles que permanecen rígidos.
// Las rutas entre bloques se calculan con PcbRouter y DRC normal.
import {PcbRouter} from './PcbRouter.js';
import {GeometryValidator} from './GeometryValidator.js';

export function computeCompactRoutes({nodes,edges,positions,rects,levels,
 sourcePositions,sourceRoutes}){
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const dst=new Map(positions),src=new Map(sourcePositions),
  rectMap=new Map(rects),oldRoutes=new Map(sourceRoutes);
 const key=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
 const router=new PcbRouter({state:{nodes,edges},mode:'02',nodeById:id=>byId.get(id),
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const validator=new GeometryValidator({router,rectOverlap:(a,b,gap=0)=>
  a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap});
 const blocks=new Map();
 function moduleOf(id){
  if(blocks.has(id))return blocks.get(id);
  const chain=[],seen=new Set();let at=byId.get(id);
  while(at&&at.id!=='p1'&&!seen.has(at.id)){
   chain.unshift(at.id);seen.add(at.id);at=byId.get(at.parent);
  }
  const module=chain[1]||chain[0]||id;
  blocks.set(id,module);
  return module;
 }
 const pointMoved=(p,id)=>{
  const origin=src.get(id),target=dst.get(id);
  if(!origin||!target||!p)return null;
  return { ...p,x:p.x+target.x-origin.x,y:p.y+target.y-origin.y,
   sx:p.sx===undefined?undefined:p.sx+target.x-origin.x,
   sy:p.sy===undefined?undefined:p.sy+target.y-origin.y};
 };
 const segmentShift=(points,id)=>{
  const origin=src.get(id),target=dst.get(id);
  if(!origin||!target)return null;
  return points.map(p=>({x:p.x+target.x-origin.x,y:p.y+target.y-origin.y}));
 };
 const ordered=edges.map((e,i)=>({...e,__index:i})).sort((a,b)=>{
  const pr=e=>Math.min(levels[e.from]??1000,levels[e.to]??1000)*10+
   (e.kind==='transversal'?5:0)+
   (Math.abs((levels[e.from]??1000)-(levels[e.to]??1000))>1?2:0);
  return pr(a)-pr(b)||a.__index-b.__index;
 });
 const routes=new Map(),occupied=[],usedPorts=new Map();
 const obstacles=[...rectMap.values()],deferred=[];
 function accept(rt){
  if(!rt?.points||rt.points.length<2)return false;
  const checked=validator.validateRoute(rt,obstacles,occupied,usedPorts);
  if(!checked.ok)return false;
  const e=rt.edge,k=key(e);
  routes.set(k,rt);
  occupied.push(...router.allSegments(rt.points));
  for(const [id,p] of [[e.from,rt.fromPort],[e.to,rt.toPort]]){
   if(!usedPorts.has(id))usedPorts.set(id,[]);
   usedPorts.get(id).push(p);
  }
  return true;
 }
 let preserved=0,calculations=0;
 // Conservación directa de geometría anterior en grupos J2 trasladados.
 for(const e of ordered){
  const k=key(e),old=oldRoutes.get(k),a=dst.get(e.from),b=dst.get(e.to),
   sourceA=src.get(e.from),sourceB=src.get(e.to);
  if(!a||!b||!sourceA||!sourceB||!old?.points){
   deferred.push(e);continue;
  }
  const da={x:a.x-sourceA.x,y:a.y-sourceA.y},
    db={x:b.x-sourceB.x,y:b.y-sourceB.y};
  const internal=moduleOf(e.from)===moduleOf(e.to)&&
   Math.hypot(da.x-db.x,da.y-db.y)<.1;
  if(!internal){deferred.push(e);continue;}
  const rt={edge:e,points:segmentShift(old.points,e.from),
   fromPort:pointMoved(old.fromPort,e.from),toPort:pointMoved(old.toPort,e.to)};
  if(accept(rt))preserved++;else deferred.push(e);
 }
 // Los 43 vínculos externos no usan puertos ficticios: se transportan
 // sus puertos históricos respetando identificación y orden periférico.
 let pending=[];
 for(const e of deferred){
  const old=oldRoutes.get(key(e));
  if(!old?.fromPort||!old?.toPort){pending.push(e);continue;}
  const from=pointMoved(old.fromPort,e.from),to=pointMoved(old.toPort,e.to);
  if(!from||!to){pending.push(e);continue;}
  const existing=usedPorts.get(e.from)||[],other=usedPorts.get(e.to)||[];
  if(existing.some(p=>Math.hypot(p.x-from.x,p.y-from.y)<.5)||
     other.some(p=>Math.hypot(p.x-to.x,p.y-to.y)<.5)){
   pending.push(e);continue;
  }
  calculations++;
  const result=router.routeEdge({...from,id:e.from},{...to,id:e.to},obstacles,occupied);
  if(!result||!accept({edge:e,fromPort:from,toPort:to,points:result.points}))
   pending.push(e);
 }
 // Conservar las conexiones conceptuales aun cuando falte una ruta
 // segura. Jamás alterar silenciosamente el punto de control anterior.
 for(const e of pending)routes.set(key(e),{edge:e,points:null,
  fromPort:null,toPort:null});
 return {routes:[...routes],calculations,preserved,pending:pending.map(key),
  mode:'02',strategy:'transportar-rutas-de-subarboles'};
}
