// Experimento aislado: compara rutas sobre EXACTAMENTE las mismas posiciones y puertos.
// No cambia P1 ni se incorpora al sitio. Requiere: npm i --no-save libavoid-js@0.5.0-beta.5
import {readFileSync,writeFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {AvoidLib} from 'libavoid-js';
import {computeInitialRoutes} from '../../js/workers/initial-route.worker.js';
import {PcbRouter} from '../../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../../js/geometry/GeometryValidator.js';

const fixture=JSON.parse(readFileSync(new URL('../../tests/route-fixture.json',import.meta.url),'utf8'));
const state={nodes:fixture.nodes,edges:fixture.edges};
const byId=new Map(state.nodes.map(n=>[n.id,n]));
const pcb=new PcbRouter({state,nodeById:id=>byId.get(id),clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
const overlap=(a,b,gap=0)=>a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap;
const validate=new GeometryValidator({router:pcb,rectOverlap:overlap});
const key=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
const priority=e=>Math.min(fixture.levels[e.from]??1000,fixture.levels[e.to]??1000)*10+
 (e.kind==='transversal'?5:0)+(Math.abs((fixture.levels[e.from]??1000)-(fixture.levels[e.to]??1000))>1?2:0);
const ordered=fixture.edges.map((e,i)=>({...e,__index:i})).sort((a,b)=>priority(a)-priority(b)||a.__index-b.__index);
const ports=pcb.assignPorts(ordered,new Map(fixture.positions),new Map(fixture.rects));
const rects=fixture.rects.map(([,r])=>r);
const add=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<.01;
function mergeRoute(from,to,path){
 if(!path.length)return null;
 const raw=[{x:from.x,y:from.y},{x:from.sx,y:from.sy},...path,{x:to.sx,y:to.sy},{x:to.x,y:to.y}];
 const dedup=raw.filter((p,i)=>i===0||!add(raw[i-1],p));
 return pcb.simplify(dedup);
}
function routeLength(points){return points?.slice(1).reduce((n,p,i)=>n+Math.abs(points[i].x-p.x)+Math.abs(points[i].y-p.y),0)||0;}
function evaluate(routes,mode){
 const occupied=[],used=new Map(),status={mode,complete:0,pending:0,invalid:0,crosses:0,length:0,points:0,reasons:{},examples:[],invalidParallel:0,invalidNearCross:0};
 for(const [,rt] of routes){
  if(!rt.points){status.pending++;continue;}
  status.complete++;status.length+=routeLength(rt.points);status.points+=rt.points.length;
  const out=validate.validateRoute(rt,rects,occupied,used);
  if(!out.ok){
   status.invalid++;status.reasons[out.reason]=(status.reasons[out.reason]||0)+1;
   if(status.examples.length<8)status.examples.push({edge:key(rt.edge),reason:out.reason});
   let parallel=false,nearCross=false;
   for(const s of pcb.allSegments(rt.points))for(const old of occupied){
    const rel=pcb.segmentRelation(s.a,s.b,old.a,old.b);
    if(!rel.overlap)continue;
    const same=(Math.abs(s.a.y-s.b.y)<.001)===(Math.abs(old.a.y-old.b.y)<.001);
    if(same)parallel=true;else nearCross=true;
   }
   if(parallel)status.invalidParallel++;
   if(nearCross)status.invalidNearCross++;
  }
  else status.crosses+=out.crossings;
  occupied.push(...pcb.allSegments(rt.points));
  for(const [id,p] of [[rt.edge.from,rt.fromPort],[rt.edge.to,rt.toPort]])if(p){if(!used.has(id))used.set(id,[]);used.get(id).push(p);}
 }
 return status;
}
const started=performance.now();
const baseline=computeInitialRoutes(fixture);
const baseTime=performance.now()-started;
console.log('BASELINE',JSON.stringify({...evaluate(baseline.routes,'PcbRouter'),ms:+baseTime.toFixed(1),calculations:baseline.calculations}));
const loadStart=performance.now();
await AvoidLib.load();
const Avoid=AvoidLib.getInstance();
console.log('LIBAVOID_LOADED',JSON.stringify({ms:+(performance.now()-loadStart).toFixed(1),flags:{OrthogonalRouting:Avoid.OrthogonalRouting,ConnType_Orthogonal:Avoid.ConnType_Orthogonal}}));
const trials=[];
for(const profile of ['default','strict']) {
const start=performance.now();
// Los valores son los enums oficiales de libavoid: RouterFlag.OrthogonalRouting=2, ConnType_Orthogonal=2.
// La versión WASM no exporta esas constantes como propiedades de JS.
const ORTHOGONAL=2;
const engine=new Avoid.Router(ORTHOGONAL);
if(profile==='strict'){
 // Libavoid: segmentPenalty 0, crossingPenalty 2, fixedSharedPathPenalty 4,
 // idealNudgingDistance 7. Mantener intactos los puertos del experimento.
 engine.setRoutingParameter(0,25);
 engine.setRoutingParameter(2,250000);
 engine.setRoutingParameter(4,250000);
 engine.setRoutingParameter(7,12);
 engine.setRoutingOption(0,true);
}
const shapes=[];
for(const r of rects){
 const rectangle=new Avoid.Rectangle(new Avoid.Point(r.l-9,r.t-9),new Avoid.Point(r.r+9,r.b+9));
 shapes.push(new Avoid.ShapeRef(engine,rectangle));
}
const conns=[];
for(const [i,e] of ordered.entries()){
 const from=ports.get(i+':'+e.from),to=ports.get(i+':'+e.to);
 if(!from||!to){conns.push({e,from,to,conn:null});continue;}
 const c=new Avoid.ConnRef(engine,
  new Avoid.ConnEnd(new Avoid.Point(from.sx,from.sy)),
  new Avoid.ConnEnd(new Avoid.Point(to.sx,to.sy)));
 c.setRoutingType(ORTHOGONAL);
 conns.push({e,from,to,conn:c});
}
engine.processTransaction();
const ms=performance.now()-start;
const candidates=conns.map(({e,from,to,conn})=>{
 let points=null;
 if(conn){
  const poly=conn.displayRoute(),inner=[];
  if(!globalThis.polyReported){console.log('POLY_API',JSON.stringify({methods:Object.getOwnPropertyNames(Object.getPrototypeOf(poly)),props:Object.keys(poly),size:poly.size?.(),psType:typeof poly.ps}));globalThis.polyReported=true;}
  const accessor=poly.get_ps??poly.getPs??poly.getPoint??poly.at;
  if(typeof accessor!=='function')throw Error('No existe método público de lectura de puntos');
  for(let i=0;i<poly.size();i++){const p=accessor.call(poly,i);inner.push({x:p.x,y:p.y});}
  points=mergeRoute(from,to,inner);
 }
 return [key(e),{edge:e,points,fromPort:from||null,toPort:to||null}];
});
const compare=evaluate(candidates,'Libavoid Orthogonal');

let brokenWithoutOtherRoutes=0;
for(const [,rt] of candidates){
 if(rt.points&&pcb.routeShapeValid(rt.points,rects,[rt.edge.from,rt.edge.to],[],true)===null)brokenWithoutOtherRoutes++;
}
const result={name:profile,...compare,ms:+ms.toFixed(1),brokenWithoutOtherRoutes};
trials.push(result);
console.log('PROFILE',JSON.stringify(result));
}
const summary={baseline:{...evaluate(baseline.routes,'PcbRouter'),ms:+baseTime.toFixed(1)},trials,library:'libavoid-js@0.5.0-beta.5'};
console.log('COMPARISON',JSON.stringify(summary));
writeFileSync(new URL('./resultado.json',import.meta.url),JSON.stringify(summary,null,2)+'\n');
