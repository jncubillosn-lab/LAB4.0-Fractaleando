import {GraphDocument} from './core/GraphDocument.js';
import {createSeeds} from './data/seeds.js';
import {PlaneCheckpoint} from './core/PlaneCheckpoint.js';
import {TopologyRegister} from './core/TopologyRegister.js';
import {DerivedViews} from './views/DerivedViews.js';
import {PcbRouter} from './geometry/PcbRouter.js';
import {GeometryValidator} from './geometry/GeometryValidator.js';
import {SvgRenderer} from './ui/SvgRenderer.js';
import {loadNodeTypography,paintNodeLabel,nodeGeometry} from './ui/NodeTypography.js';
import {scaleCrossings,emphasizeCrossings,visibleCrossings} from './ui/CircuitSvg.js';
import {clockChildPosition,nextClockIndex} from './geometry/ClockPlacement.js';
import {WorkerTask} from './core/WorkerTask.js';
import {checkpointHasRecords} from './io/GraphFile.js';
import {bindGraphFiles} from './ui/GraphFiles.js';
import {bindDiagramExports} from './ui/DiagramExport.js';
import {validLinkStyle} from './ui/LinkStyles.js';
import {layoutPlane} from './geometry/PlaneLayout.js';
import {routeFacingLink} from './geometry/FacingPorts.js';
import {computeInitialRoutes} from './workers/initial-route.worker.js';
// P1 application coordinator: preserves the approved HTML, controls and data model.
const NS='http://www.w3.org/2000/svg';
const $=id=>document.getElementById(id);
const stage=$('stage'), camera=$('camera'), linesEl=$('lines'), nodesEl=$('nodes');
const state={nodes:[],edges:[],selected:'p1',linkFrom:null,unlinkFrom:null,linkStyle:'solid',depth:2,zoom:1,tx:0,ty:0,undo:[],pointer:null,idSerial:0,toastTimer:null,renderQueued:false,focusRoot:"p1",readableZoom:.82,edgeMode:'all'};
// Los tres identificadores son SOLO los datos iniciales; no fijan el número de brazos.
const anchors=['b0','f0','t0'];
const isFirstLevel=n=>Boolean(n&&n.parent==='p1');
const nextBranchIndex=()=>Math.max(-1,...state.nodes.map(n=>n.branch))+1;
const textCanvas=document.createElement('canvas');const ctx=textCanvas.getContext('2d');
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const graph=new GraphDocument(state);
const nodeById=id=>graph.nodeById(id);
const linksOf=id=>graph.linksOf(id);
function makeNode(id,text,branch,parent=null,width=178){return{id,text,branch,parent,width,x:0,y:0};}
const {blankSeed,seed}=createSeeds({makeNode,anchors});
function textLines(text,width,fontsize=14){
 const maxWidth=width-28;ctx.font=`${fontsize>=20?'650 ':fontsize>=15?'590 ':''}${fontsize}px Inter,Arial,sans-serif`;
 const out=[];const paragraphs=String(text||' ').split(/\n/);
 for(const para of paragraphs){const words=(para.trim()||' ').split(/\s+/);let line='';
  for(const word of words){if(ctx.measureText(word).width>maxWidth){if(line){out.push(line);line='';}let part='';for(const ch of word){if(part&&ctx.measureText(part+ch).width>maxWidth){out.push(part);part='';}part+=ch;}line=part;continue;}
   const attempt=line?line+' '+word:word;if(ctx.measureText(attempt).width>maxWidth&&line){out.push(line);line=word;}else line=attempt;
  }out.push(line||' ');
 }
 return out;
}
function legacyGeometry(n){const size=n.id==='p1'?20:isFirstLevel(n)?15:14;const wrapped=textLines(n.text,n.width,size);const lineheight=size===20?25:21;return{w:n.width,h:Math.max(n.id==='p1'?67:53,wrapped.length*lineheight+27),wrapped,size,lineheight};}
const geometry=n=>nodeGeometry(n,ctx);
// Read 0.2.8–0.2.10 checkpoints at their original dimensions, then resize
// locally with current geometry, keeping the user's edited positions.
const previousTypographyGeometry=n=>nodeGeometry(n,ctx,undefined,{growToWords:false});
// La profundidad es propiedad del grafo. No existe un máximo de seis generaciones.
// Model-level operations are separate from drawing and route finding.
const treeChildren=(id,branch)=>graph.treeChildren(id,branch);
const depthMap=()=>graph.depthMap();
const readDepthMap=()=>graph.readDepthMap();
const maximumDepth=()=>graph.maximumDepth();
function syncDepth(){const max=maximumDepth(),slider=$('depth');slider.max=String(max);
 state.depth=clamp(state.depth,0,max);slider.value=String(state.depth);
 $('depthOut').textContent=state.depth+' / '+max;
 $('scopeInfo').textContent=`${state.nodes.length} conceptos disponibles · ${state.edges.length} conexiones`;
}
const rawVisibleNodes=()=>graph.rawVisibleNodes();
const currentNodes=()=>graph.currentNodes();
// P1 01 Plano — motor de representación independiente, escrito desde cero.
// Solo depende de los nodos/vínculos y funciones de medición de la interfaz vigente.
const ROUTE_CLEAR=9, ROUTE_SEPARATION=6, PORT_STUB=19;
function sEl(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
function pathPriority(e,levels){const a=levels[e.from]??1000,b=levels[e.to]??1000;return Math.min(a,b)*10+(e.kind==='transversal'?5:0)+(Math.abs(a-b)>1?2:0);}
const router=new PcbRouter({state,nodeById,clamp,allowBendCrossings:true});
const {prefSide,assignPorts,allSegments,segmentHitsRect,onSegmentVal,segmentRelation,routeShapeValid,simplify,fastCandidates,findRouteGrid,routeEdge,linePath,intersections}=router;
// P1/01: geometría persistente. Una versión se consolida tras cada modificación.
// El filtrado de profundidad NO invoca este motor.
const plane=new PlaneCheckpoint();
const diag={initialBuilds:0,routeCalculations:0,lastRouteCalculations:0,lastOperation:'',
 lastDurationMs:0,checkpoint:0,visible:0,routes:0,pending:0};
window.P1_PLANO_DIAGNOSTICO=diag; // lectura técnica, no herramienta de interfaz
const validator=new GeometryValidator({router,rectOverlap});
const renderer=new SvgRenderer({linesEl,sEl,router,edgeKey:e=>edgeKey(e)});
const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
// Registro relacional paralelo al punto de control geométrico.
const topology=new TopologyRegister({edgeKey});
const derived=new DerivedViews({state,plane,camera,linesEl,nodesEl,sEl,router,validator,
 edgeKey,readDepthMap,fit,geometry,toast,referenceTopology:()=>topology.reference,onSelect:selectNode});
let stagedTopology=null;
function observeTopology(){
 if(!plane.ready)return;
 const levels=readDepthMap();
 const ordered=state.edges.map((e,i)=>({...e,__index:i}))
  .sort((a,b)=>pathPriority(a,levels)-pathPriority(b,levels)||a.__index-b.__index);
 // Primero recuperar las identidades persistentes; después calcular su orden.
 // De otro modo los puertos recibirían números nuevos aun sin cambiar el dibujo.
 if(stagedTopology!==null){
  const imported=stagedTopology;stagedTopology=null;
  if(!topology.restore(imported))console.warn('Registro topológico importado no reconocido; se genera uno nuevo.');
 }
 const snapshot=topology.capture({positions:plane.positions,rects:plane.rects,routes:plane.routes,edges:ordered});
 const report=topology.observe(snapshot,{editable:true});
 if(!report.valid)console.warn('Diferencia topológica respecto del punto validado:',report);
}
const rectAt=(id,p,m)=>({id,x:p.x,y:p.y,w:m.w,h:m.h,l:p.x-m.w/2,r:p.x+m.w/2,t:p.y-m.h/2,b:p.y+m.h/2});
function rectOverlap(a,b,gap=16){return a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap;}
function savedSegments(except=new Set()){
 const arr=[];for(const [key,route] of plane.routes)if(route.points&&!except.has(key))arr.push(...allSegments(route.points));return arr;
}
function routeCollidesWithBox(route,box){return Boolean(route.points&&allSegments(route.points).some(seg=>segmentHitsRect(seg.a,seg.b,box,ROUTE_CLEAR)));}
function noBoxOverlaps(rect,id){for(const [other,r] of plane.rects)if(other!==id&&rectOverlap(rect,r))return false;return true;}
function setPosition(node,p,m){
 const point={x:p.x,y:p.y};plane.positions.set(node.id,point);plane.metrics.set(node.id,m);
 plane.rects.set(node.id,rectAt(node.id,point,m));node.x=point.x;node.y=point.y;
}
function freshPosition(node,metric,reference=null){
 // R01: un nuevo término J1 se ubica como raíz independiente, no en la rama 3.
 // Mantener el punto de control: ningún brazo anterior cambia de posición.
 if(node.parent==='p1'){
  const peers=state.nodes.filter(n=>n.id!==node.id&&n.parent==='p1'&&plane.positions.has(n.id));
  const root=plane.positions.get('p1')||{x:0,y:-214};
  const rowY=peers.length?plane.positions.get(peers[peers.length-1].id).y:root.y+250;
  const rightEdge=peers.length?Math.max(...peers.map(n=>plane.rects.get(n.id).r)):root.x+60;
  const oldSegments=savedSegments();
  const choices=[];
  if(reference&&Number.isFinite(reference.x)&&Number.isFinite(reference.y))choices.push(reference);
  for(let k=0;k<45;k++)choices.push({x:rightEdge+metric.w/2+130+k*85,y:rowY});
  for(const p of choices){const r=rectAt(node.id,p,metric);
   if(noBoxOverlaps(r,node.id)&&!oldSegments.some(s=>segmentHitsRect(s.a,s.b,r,ROUTE_CLEAR+3)))return p;
  }
  // Sin espacio sin invadir trayectorias: se conserva la posición externa libre.
  return{ x:rightEdge+metric.w/2+130+45*85,y:rowY};
 }
 const parent=plane.positions.get(node.parent);
 const relatives=state.nodes.filter(n=>n.parent===node.parent&&n.id!==node.id&&plane.positions.has(n.id));
 const baseX=parent?(relatives.length?plane.positions.get(relatives[0].id).x:parent.x+230+metric.w/2):
 (reference?.x??Math.max(500,...[...plane.rects.values()].map(r=>r.r+100)));
 const top=parent?parent.y:(reference?.y??0);
 const siblings=relatives.map(n=>plane.rects.get(n.id)).filter(Boolean);
 const nextY=siblings.length?Math.max(...siblings.map(r=>r.b))+metric.h/2+48:top;
 const trial=[];
 if(reference&&Number.isFinite(reference.x)&&Number.isFinite(reference.y))trial.push(reference);
 for(const xoff of [0,80,-80,160,-160,250,-250,400,-400]){
  for(let k=0;k<38;k++){
   const dy=k===0?0:Math.ceil(k/2)*76*(k%2?1:-1);
   trial.push({x:baseX+xoff,y:nextY+dy});
  }
 }
 let fallback=null;const oldSegments=savedSegments();
 for(const p of trial){const r=rectAt(node.id,p,metric);
  if(!noBoxOverlaps(r,node.id))continue;
  if(!fallback)fallback=p;
  if(!oldSegments.some(s=>segmentHitsRect(s.a,s.b,r,ROUTE_CLEAR+3)))return p;
 }
 return fallback||{x:baseX,y:nextY};
}
function portAt(rect,side,fraction){
 const p={side};fraction=clamp(fraction,.08,.92);
 if(side==='top'||side==='bottom'){
  p.x=rect.l+fraction*rect.w;p.y=side==='top'?rect.t:rect.b;
  p.sx=p.x;p.sy=p.y+(side==='top'?-PORT_STUB:PORT_STUB);
 }else{
  p.x=side==='left'?rect.l:rect.r;p.y=rect.t+fraction*rect.h;
  p.sx=p.x+(side==='left'?-PORT_STUB:PORT_STUB);p.sy=p.y;
 }return p;
}
function portsAtNode(id){
 const found=[];for(const rt of plane.routes.values()){
  if(rt.edge.from===id)found.push(rt.fromPort);
  if(rt.edge.to===id)found.push(rt.toPort);
 }return found.filter(Boolean);
}
function candidatePorts(id,other,edge){
 const r=plane.rects.get(id),p=plane.positions.get(id),q=plane.positions.get(other);
 if(!r||!p||!q)return [];
 const side=prefSide({id,...p,parent:nodeById(id)?.parent},{id:other,...q,parent:nodeById(other)?.parent},edge);
 const dx=q.x-p.x,dy=q.y-p.y;
 const sides=[...new Set([side,Math.abs(dx)>=Math.abs(dy)?(dx>=0?'right':'left'):(dy>=0?'bottom':'top'),
 dx>=0?'right':'left',dy>=0?'bottom':'top','right','left','bottom','top'])];
 const existing=portsAtNode(id),opts=[];
 const fractionValues=[.5,.34,.66,.22,.78,.12,.88,.42,.58];
 for(const s of sides){
  for(const fraction of fractionValues){
   const p=portAt(r,s,fraction);
   if(existing.some(v=>Math.hypot(v.x-p.x,v.y-p.y)<11))continue;
   opts.push(p);
  }
 }
 return opts;
}
// Prefer several faces of each box before exhausting all candidates on one face.
// This stays local: existing valid routes and checkpoints are never displaced.
function diversePorts(candidates){
 const sides=new Map();for(const p of candidates){if(!sides.has(p.side))sides.set(p.side,[]);sides.get(p.side).push(p);}
 const result=[];let remaining=true;
 while(remaining){remaining=false;for(const group of sides.values())if(group.length){result.push(group.shift());remaining=true;}}
 return result;
}
function chooseRoute(edge,occupied){
 const a=plane.rects.get(edge.from),b=plane.rects.get(edge.to);
 if(!a||!b)return null;
 const began=performance.now();
 const optionsA=diversePorts(candidatePorts(edge.from,edge.to,edge));
 const optionsB=diversePorts(candidatePorts(edge.to,edge.from,edge));
 {
  const facing=routeFacingLink({edge,a,b,fromPorts:optionsA,toPorts:optionsB,makePort:portAt,
   usedFrom:portsAtNode(edge.from),usedTo:portsAtNode(edge.to),router,obstacles:[...plane.rects.values()],occupied,
   allowCrossings:true,onAttempt:()=>diag.routeCalculations++,deadline:began+950});
  if(facing)return {edge:{...edge},points:facing.points,crosses:facing.crosses,fromPort:facing.fromPort,toPort:facing.toPort};
 }
 const pA=optionsA;
 const pB=optionsB;
 // R01: al incorporar un brazo J1, probar primero el costado libre del núcleo.
 // Así el límite de intentos no se consume en salidas inferiores ya ocupadas.
 if(edge.from==='p1'&&nodeById(edge.to)?.parent==='p1'){
  const side=plane.positions.get(edge.to).x>=plane.positions.get('p1').x?'right':'left';
  const preference=side==='right'?['right','top','left','bottom']:['left','top','right','bottom'];
  pA.sort((a,b)=>preference.indexOf(a.side)-preference.indexOf(b.side));
 }
 const rectArray=[...plane.rects.values()];
 // En J1 explorar primero salidas diferentes del núcleo antes de gastar
 // intentos en varios puertos del mismo destino.
 const isCoreNewArm=edge.from==='p1'&&nodeById(edge.to)?.parent==='p1';
 const candidates=[];
 if(isCoreNewArm){
  for(let i=0;i<Math.min(15,pA.length);i++)candidates.push([i,0]);
  for(let j=1;j<Math.min(5,pB.length);j++)for(let i=0;i<Math.min(5,pA.length);i++)candidates.push([i,j]);
 }else{
  for(let i=0;i<Math.min(pA.length,5);i++)candidates.push([i,0]);
  for(let j=1;j<Math.min(pB.length,4);j++)candidates.push([0,j]);
  for(let i=1;i<Math.min(pA.length,4);i++)candidates.push([i,Math.min(i,pB.length-1)]);
 }
 const maxAttempts=isCoreNewArm?15:10;let attempts=0;
 for(const [i,j] of candidates){
  if(attempts>=maxAttempts||(attempts>0&&performance.now()-began>950))
   return {edge:{...edge},points:null,fromPort:null,toPort:null,unresolved:true};
  attempts++;
  const from=pA[i],to=pB[j];
  const result=routeEdge({...from,id:edge.from},{...to,id:edge.to},rectArray,occupied);
  diag.routeCalculations++;
  if(result)return {edge:{...edge},points:result.points,crosses:result.crosses,fromPort:{...from},toPort:{...to}};
 }
 return {edge:{...edge},points:null,fromPort:null,toPort:null,unresolved:true};
}
// The initial routing is expensive; keep the browser's UI responsive (phase VI).
// The Worker receives measured rectangles, never the DOM or guessed font metrics.
const initialTask=new WorkerTask(()=>new Worker(new URL('./workers/initial-route.worker.js',import.meta.url),{type:'module'}));
let initialToken=0,initialBuilding=false,pendingAutoFit=false;
function cancelInitialBuild(){
 ++initialToken;initialBuilding=false;initialTask.cancel();
}
function graphFingerprint(){return JSON.stringify({nodes:state.nodes.map(n=>[n.id,n.text,n.parent,n.branch,n.width,n.x,n.y]),edges:state.edges});}
function makeInitialCheckpoint(){
 if(initialBuilding)return false;
 const started=performance.now(),layout=layoutPlane(state.nodes,geometry);
 plane.positions=layout.positions;plane.metrics=layout.metrics;plane.rects=layout.rects;
 plane.routes=new Map();plane.retired.clear();
 for(const n of state.nodes){const p=plane.positions.get(n.id);if(p){n.x=p.x;n.y=p.y;}}
 const payload={nodes:state.nodes.map(n=>({...n})),edges:state.edges.map(e=>({...e})),
  positions:[...plane.positions],rects:[...plane.rects],levels:readDepthMap()};
 const initialFingerprint=graphFingerprint(),token=++initialToken;
 function complete(result){
  if(token!==initialToken)return;
  initialBuilding=false;
  if(graphFingerprint()!==initialFingerprint){schedule();return;}
  plane.routes=new Map(result.routes);
  plane.ready=true;plane.revision++;diag.initialBuilds++;
  diag.routeCalculations+=result.calculations;diag.lastRouteCalculations=result.calculations;
  diag.lastOperation='cálculo inicial';diag.lastDurationMs=Math.round(performance.now()-started);
  diag.checkpoint=plane.revision;
  observeTopology();schedule();
 }
 const fallback=()=>{if(token!==initialToken)return;complete(computeInitialRoutes(payload));};
 if(typeof Worker==='undefined'){fallback();return true;}
 initialBuilding=true;
 initialTask.run({...payload,token},{timeoutMs:35000,timeoutMessage:'El cálculo inicial no respondió en 35 s.'})
  .then(complete,error=>{
   if(token!==initialToken)return;
   console.warn('Worker geométrico no disponible. Calculando en este navegador.',error.message);
   fallback();
  });
 return false;
}
function validateSavedCheckpoint(payload,measure=geometry){
 if(!checkpointHasRecords(payload))return false;
 const saved=new Map(payload.positions.map(p=>[p.id,p]));
 if(saved.size!==state.nodes.length||state.nodes.some(n=>!saved.has(n.id)))return false;
 const positions=new Map(),metrics=new Map(),rects=new Map();
 for(const n of state.nodes){const p=saved.get(n.id),m=measure(n);
  if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||Math.abs(p.x)>1e7||Math.abs(p.y)>1e7)return false;
  positions.set(n.id,{x:p.x,y:p.y});metrics.set(n.id,m);rects.set(n.id,rectAt(n.id,p,m));}
 const all=[...rects.values()];for(let i=0;i<all.length;i++)for(let j=0;j<i;j++)if(rectOverlap(all[i],all[j],0))return false;
 const routeMap=new Map(),occupied=[],ports=new Map();
 const edgesByKey=new Map(state.edges.map(e=>[edgeKey(e),e]));
 for(const r of payload.routes){
  const edge=edgesByKey.get(r.key);if(!edge||routeMap.has(r.key))return false;
  if(r.points!==null){
   if(!Array.isArray(r.points)||r.points.length<2||r.points.length>150||
    r.points.some(p=>!Number.isFinite(p.x)||!Number.isFinite(p.y))||!r.fromPort||!r.toPort)return false;
   const vr=validator.validateRoute({edge,points:r.points,fromPort:r.fromPort,toPort:r.toPort},all,occupied,ports);
   if(!vr.ok)return false;
   occupied.push(...allSegments(r.points));
   for(const [id,p] of [[edge.from,r.fromPort],[edge.to,r.toPort]]){
    if(!ports.has(id))ports.set(id,[]);ports.get(id).push(p);
   }
  }
  routeMap.set(r.key,{edge:{...edge},points:r.points||null,fromPort:r.fromPort||null,toPort:r.toPort||null,unresolved:!r.points});
 }
 if(routeMap.size!==state.edges.length)return false;
 plane.positions=positions;plane.metrics=metrics;plane.rects=rects;plane.routes=routeMap;
 for(const n of state.nodes){n.x=positions.get(n.id).x;n.y=positions.get(n.id).y;}
 plane.ready=true;plane.revision++;diag.checkpoint=plane.revision;diag.lastOperation='restaurar punto de control';diag.lastRouteCalculations=0;
 observeTopology();
 return true;
}
function saveCheckpoint(){return plane.snapshot();}
function reconcileCheckpoint(){
 if(!plane.ready){makeInitialCheckpoint();return plane.ready;}
 const start=performance.now(),calcsBefore=diag.routeCalculations;
 const active=new Set(state.nodes.map(n=>n.id)),edgeSet=new Map(state.edges.map(e=>[edgeKey(e),e]));
 const changed=new Set(),removed=new Set();let changedAnything=false;
 for(const [id,old] of [...plane.positions])if(!active.has(id)){
  plane.retired.set(id,old);plane.positions.delete(id);plane.metrics.delete(id);plane.rects.delete(id);
  removed.add(id);changedAnything=true;
 }
 for(const n of state.nodes){
  const prior=plane.positions.get(n.id),metric=geometry(n),last=plane.metrics.get(n.id);
  if(!prior){const hint=plane.retired.get(n.id)||((n.x||n.y)?{x:n.x,y:n.y}:null);
   setPosition(n,freshPosition(n,metric,hint),metric);changed.add(n.id);changedAnything=true;
  }else if(!last||last.w!==metric.w||last.h!==metric.h||Math.abs(prior.x-n.x)>.05||Math.abs(prior.y-n.y)>.05){
   let p={x:n.x,y:n.y};const proposal=rectAt(n.id,p,metric);
   if(!noBoxOverlaps(proposal,n.id))p=freshPosition(n,metric,prior);
   setPosition(n,p,metric);changed.add(n.id);changedAnything=true;
  }
 }
 // Todo vínculo que desaparece sale del punto de control, sin alterar los restantes.
 for(const key of [...plane.routes.keys()])if(!edgeSet.has(key)){plane.routes.delete(key);changedAnything=true;}
 const dirty=new Set();
 for(const [key,rt] of plane.routes){
  if(rt.unresolved||!rt.points){if(changedAnything)dirty.add(key);continue;}
  if(changed.has(rt.edge.from)||changed.has(rt.edge.to)||removed.has(rt.edge.from)||removed.has(rt.edge.to))dirty.add(key);
  else for(const id of changed){if(routeCollidesWithBox(rt,plane.rects.get(id))){dirty.add(key);break;}}
 }
 for(const [key] of edgeSet)if(!plane.routes.has(key))dirty.add(key);
 if(!changedAnything&&!dirty.size){diag.lastRouteCalculations=0;diag.lastDurationMs=0;diag.lastOperation='sin cambio geométrico';diag.lastAffectedRoutes=0;return false;}
 for(const key of dirty)plane.routes.delete(key);
 const occupied=savedSegments();
 const levels=readDepthMap();const targets=[...dirty].map(key=>({key,e:edgeSet.get(key)})).filter(r=>r.e)
  .sort((a,b)=>pathPriority(a.e,levels)-pathPriority(b.e,levels));
 diag.lastAffectedRoutes=targets.length;
 for(const {key,e} of targets){
  const rt=chooseRoute(e,occupied);
  plane.routes.set(key,rt);if(rt.points)occupied.push(...allSegments(rt.points));
 }
 plane.revision++;diag.lastRouteCalculations=diag.routeCalculations-calcsBefore;
 diag.lastDurationMs=Math.round(performance.now()-start);diag.lastOperation='actualización localizada';diag.checkpoint=plane.revision;
 observeTopology();
 return true;
}
function nodeElement(n){
 const m=plane.metrics.get(n.id),p=plane.positions.get(n.id);
 const el=sEl('g',{class:'node'+(n.id==='p1'?' core':isFirstLevel(n)?' anchor':''),
 transform:`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`,'data-node-id':n.id,tabindex:0,role:'button','aria-label':n.text});
 el.append(sEl('rect',{x:-m.w/2,y:-m.h/2,width:m.w,height:m.h,rx:8,ry:8}));
 el.append(sEl('text'));
 el.addEventListener('pointerdown',e=>{
  if(e.button!==0)return;
  e.stopPropagation();const pos=plane.positions.get(n.id);
  el._drag={screenX:e.clientX,screenY:e.clientY,startX:pos.x,startY:pos.y,active:false};
  el.setPointerCapture(e.pointerId);
 });
 el.addEventListener('pointermove',e=>{
  const d=el._drag;if(!d)return;
  const dx=(e.clientX-d.screenX)/state.zoom,dy=(e.clientY-d.screenY)/state.zoom;
  if(Math.hypot(dx,dy)>4)d.active=true;
  if(d.active)el.setAttribute('transform',`translate(${(d.startX+dx).toFixed(2)} ${(d.startY+dy).toFixed(2)})`);
 });
 const drop=e=>{
  const d=el._drag;if(!d)return;el._drag=null;
  if(el.hasPointerCapture(e.pointerId))el.releasePointerCapture(e.pointerId);
  if(!d.active){el.setAttribute('transform',`translate(${d.startX} ${d.startY})`);return;}
  const dest={x:d.startX+(e.clientX-d.screenX)/state.zoom,y:d.startY+(e.clientY-d.screenY)/state.zoom};
  const rect=rectAt(n.id,dest,plane.metrics.get(n.id));
  if(!noBoxOverlaps(rect,n.id)){
   el.setAttribute('transform',`translate(${d.startX} ${d.startY})`);
   toast('No es posible superponer conceptos. Mueve el cuadro a un espacio libre.');return;
  }
  saveUndo();n.x=dest.x;n.y=dest.y;
  schedule();
 };
 el.addEventListener('pointerup',drop);
 el.addEventListener('pointercancel',e=>{if(el._drag){el.setAttribute('transform',`translate(${el._drag.startX} ${el._drag.startY})`);el._drag=null;}});
 el.addEventListener('click',e=>{e.stopPropagation();selectNode(n.id);});
 el.addEventListener('dblclick',e=>{e.stopPropagation();selectNode(n.id);$('nodeText').focus();$('nodeText').select();});
 el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectNode(n.id);}});
 return el;
}
function updateNodeElement(n){
 const el=plane.nodeEls.get(n.id),m=plane.metrics.get(n.id),p=plane.positions.get(n.id);
 if(!el||!m||!p)return;
 el.setAttribute('transform',`translate(${p.x.toFixed(2)} ${p.y.toFixed(2)})`);
 const r=el.querySelector('rect');r.setAttribute('x',-m.w/2);r.setAttribute('y',-m.h/2);
 r.setAttribute('width',m.w);r.setAttribute('height',m.h);
 refreshNodeLabel(n);
}
function syncGraphics(geometryChanged){
 if(geometryChanged){
  for(const [id,el] of plane.nodeEls)if(!plane.positions.has(id)){el.remove();plane.nodeEls.delete(id);}
  for(const n of state.nodes){
   if(!plane.nodeEls.has(n.id)){const el=nodeElement(n);plane.nodeEls.set(n.id,el);nodesEl.append(el);}
   updateNodeElement(n);
  }
  // Reusar exactamente el punto de control; presentar cruces sin descartarlos.
  const levels=readDepthMap();const ordered=state.edges.map((e,i)=>({...e,__index:i}))
   .sort((a,b)=>pathPriority(a,levels)-pathPriority(b,levels)||a.__index-b.__index);
  plane.routeEls=renderer.draw(ordered,plane.routes,{mode:'01',nodes:state.nodes,levels:graph.depthMap()});
 }
 paintVisibility();updateCamera();
}
function paintVisibility(){
 const visible=new Set(currentNodes().map(n=>n.id));let count=0,routes=0,pending=0;
 const visibleEdges=new Set();
 for(const [id,el] of plane.nodeEls)el.style.display=visible.has(id)?'':'none';
 for(const e of state.edges){const key=edgeKey(e),rt=plane.routes.get(key);
  const show=visible.has(e.from)&&visible.has(e.to);
  if(show&&rt?.points){routes++;visibleEdges.add(key);}
  if(show&&!rt?.points)pending++;
  const el=plane.routeEls.get(key);if(el)el.style.display=show?'':'none';
 }
 visibleCrossings(linesEl,visibleEdges);
 count=visible.size;diag.visible=count;diag.routes=routes;diag.pending=pending;
 syncSelectionStyles();
 $('depthOut').textContent=`${state.depth} / ${maximumDepth()} · ${count} conceptos`;
 $('scopeInfo').textContent=`${count} conceptos visibles · ${routes} vínculos trazados`;
 $('stats').textContent=`${state.nodes.length} conceptos · ${state.edges.length} vínculos · ${[...plane.routes.values()].filter(r=>!r.points).length} rutas pendientes`;
 $('footHint').textContent=`Editor 01 · ${routes} conexiones visibles · control ${plane.revision}`;
 const note=$('readHint'),topologyDiff=topology.report.issueCount||0;
 if(pending||topologyDiff){
  const parts=[];
  if(pending)parts.push(`${pending} vínculos visibles aún sin recorrido seguro. Sus datos siguen conservados.`);
  if(topologyDiff)parts.push(`${topologyDiff} diferencias de orden, puertos o cruces respecto del registro topológico. La referencia anterior se conserva.`);
  note.textContent=parts.join(' ');note.hidden=false;
 }else note.hidden=true;
 derived.paintVisibility();
}
function render(){
 state.renderQueued=false;
 const changed=reconcileCheckpoint();
 if(!plane.ready)return;
 syncGraphics(changed||plane.nodeEls.size!==plane.positions.size);
 if(pendingAutoFit){pendingAutoFit=false;fit();}
}
function scheduleVisibility(){syncDepth();if(state.renderQueued)return;paintVisibility();}
// Auditoría bajo demanda: no interviene en el tiempo habitual del dibujo.
diag.audit=()=>({...validator.audit([...plane.rects.values()],[...plane.routes.values()]),total:state.edges.length,checkpoint:plane.revision});
diag.topology=()=>topology.status(); // informe sin enrutamiento ni repintado
diag.views=()=>derived.diagnostic();

function updateCamera(){camera.setAttribute('transform',`translate(${state.tx.toFixed(2)} ${state.ty.toFixed(2)}) scale(${state.zoom.toFixed(4)})`);scaleCrossings(linesEl,Number(state.zoom.toFixed(4)));scaleCrossings(document.getElementById('derivedLines'),Number(state.zoom.toFixed(4)));}
function schedule(){syncDepth();if(state.renderQueued)return;state.renderQueued=true;requestAnimationFrame(render);}
function selected(){return nodeById(state.selected);}
function toast(msg){const el=$('toast');el.textContent=msg;el.classList.add('show');clearTimeout(state.toastTimer);state.toastTimer=setTimeout(()=>el.classList.remove('show'),3500);}
function updatePanel(){const n=selected();$('selectionInfo').textContent=n?`${n.id==='p1'?'NÚCLEO':'RAMA '+String(n.branch+1).padStart(2,'0')} · ${linksOf(n.id).length} vínculos`:'Selecciona un recuadro para editarlo.';
 $('sourceInfo').textContent=n?.source||'';$('nodeText').disabled=!n;$('nodeText').value=n?.text||'';$('widthOut').textContent=n?`${geometry(n).w} px`:'—';$('narrowBtn').disabled=!n;$('widenBtn').disabled=!n;
 $('deleteBtn').disabled=!n||n.id==='p1';$('linkBtn').disabled=!n||n.id==='p1';$('linkBtn').classList.toggle('on',state.linkFrom!==null);
 $('unlinkBtn').disabled=!n||!linksOf(n.id).some(e=>e.from!=='p1'&&e.to!=='p1');
 $('unlinkBtn').classList.toggle('on',state.unlinkFrom!==null);
 $('unlinkBtn').textContent=state.unlinkFrom?'Cancelar eliminación':'Eliminar vínculo';
 $('linkBtn').textContent=state.linkFrom?'Cancelar vínculo':'Conectar';
 $('editHint').textContent=state.unlinkFrom?'Selecciona el otro concepto de la relación que quieres retirar.':state.linkFrom?'Selecciona otro concepto para crear la conexión.':'Haz doble clic en un concepto para editar su texto.';
 $('stage').classList.toggle('connecting',false);

}
function saveUndo(){state.undo.push(JSON.stringify({nodes:state.nodes,edges:state.edges,selected:state.selected}));if(state.undo.length>36)state.undo.shift();$('undoBtn').disabled=false;}
function undo(){if(derived.mode!=='01'){toast('Regresa a 01 · Editor para editar el grafo.');return;}if(!state.undo.length)return;const s=JSON.parse(state.undo.pop());state.nodes=s.nodes;state.edges=s.edges;state.selected=s.selected;state.linkFrom=null;state.unlinkFrom=null;updatePanel();schedule();$('undoBtn').disabled=!state.undo.length;toast('Cambio deshecho.');}
function removeLink(from,to){
 const edge=state.edges.find(e=>(e.from===from&&e.to===to)||(e.from===to&&e.to===from));
 if(!edge){toast('Estos conceptos no tienen un vínculo directo.');return false;}
 if(edge.from==='p1'||edge.to==='p1'){toast('Cada vínculo del núcleo define un brazo J1. Elimina el concepto J1 para retirar ese brazo.');return false;}
 const origin=nodeById(edge.from),destination=nodeById(edge.to);
 if(!confirm(`¿Quitar la relación entre «${origin?.text}» y «${destination?.text}»?`))return false;
 saveUndo();state.edges=state.edges.filter(e=>e!==edge);
 if(destination?.parent===edge.from)destination.parent=null;
 state.linkFrom=null;state.unlinkFrom=null;
 updatePanel();schedule();toast('Vínculo retirado. Ambos conceptos se conservan.');return true;
}
function syncSelectionStyles(){
 const focused=new Set();
 for(const el of nodesEl.children)el.classList.toggle('selected',el.dataset.nodeId===state.selected);
 for(const el of linesEl.querySelectorAll('.svgline')){
  const active=el.dataset.linkFrom===state.selected||el.dataset.linkTo===state.selected;
  el.classList.toggle('active',active);if(active)focused.add(el.parentElement.dataset.edgeKey);
 }
 emphasizeCrossings(linesEl,focused);
}
function refreshNodeLabel(n){
 const el=[...nodesEl.children].find(e=>e.dataset.nodeId===n.id);
 if(!el)return;
 const g=geometry(n),text=el.querySelector('text');if(!text)return;
 paintNodeLabel(text,n,g,ctx);
 el.setAttribute('aria-label',n.text);
}
function selectNode(id){
 if(derived.mode!=='01'){state.selected=id;updatePanel();derived.switchVisibility(derived.mode);derived.paintSelection();$('editHint').textContent='Selección: ascendencia hasta J0 y todos los vínculos adyacentes.';return;}
 const changingEdges=Boolean(state.unlinkFrom||state.linkFrom);
 if(state.unlinkFrom){const first=state.unlinkFrom;if(first===id){state.unlinkFrom=null;toast('Eliminación cancelada.');}else if(removeLink(first,id)){state.unlinkFrom=null;} }
 else if(state.linkFrom){if(state.linkFrom===id){state.linkFrom=null;toast('Conexión cancelada.');}else if(state.linkFrom==='p1'||id==='p1'){state.linkFrom=null;toast('Para crear otro brazo J1, selecciona P1 y utiliza «+ Concepto».');}else if(!state.edges.some(e=>(e.from===state.linkFrom&&e.to===id)||(e.from===id&&e.to===state.linkFrom))){saveUndo();state.edges.push({from:state.linkFrom,to:id,style:state.linkStyle});state.linkFrom=null;toast('Conceptos vinculados.');}else{state.linkFrom=null;toast('Este vínculo ya existe.');}}
 state.selected=id;updatePanel();
 if(changingEdges)schedule();else syncSelectionStyles();
}
function addConcept(){
 const n=selected()||nodeById('p1');if(!n)return;
 const newArm=n.id==='p1';
 saveUndo();const id='n'+(++state.idSerial);
 // R01: un hijo directo de J0 es siempre un NUEVO brazo, con índice propio.
 const node=makeNode(id,'Nuevo concepto',newArm?nextBranchIndex():n.branch,n.id,newArm?190:180);
 const parent=plane.rects.get(n.id)||rectAt(n.id,n,geometry(n));
 const rects=state.nodes.map(other=>plane.rects.get(other.id)||rectAt(other.id,other,geometry(other)));
 Object.assign(node,clockChildPosition({parent,metric:geometry(node),index:nextClockIndex(treeChildren(n.id)),rects,segments:savedSegments()}));
 state.nodes.push(node);state.edges.push({from:n.id,to:id,style:state.linkStyle});
 state.depth=Math.max(state.depth,(readDepthMap()[id]??state.depth));
 updatePanel();schedule();
 toast(newArm?'Nuevo brazo J1 añadido al núcleo.':'Concepto añadido a los datos.');
}
function deleteSelected(){const n=selected();if(!n||n.id==='p1')return;const childCount=treeChildren(n.id).length;if(childCount&&!confirm(`Este concepto tiene ${childCount} descendientes directos, que quedarán sin padre. ¿Continuar?`))return;saveUndo();if(state.focusRoot===n.id)state.focusRoot=n.parent||'p1';state.unlinkFrom=null;state.nodes=state.nodes.filter(o=>o.id!==n.id);state.edges=state.edges.filter(e=>e.from!==n.id&&e.to!==n.id);for(const q of state.nodes)if(q.parent===n.id)q.parent=null;state.selected=n.parent&&nodeById(n.parent)?n.parent:'p1';updatePanel();schedule();toast('Concepto eliminado. Las relaciones restantes se conservan sin inventar sustituciones.');}
function centerOn(){
 const root=nodesEl.querySelector('[data-node-id="p1"]');
 const center=derived.mode!=='01'?derived.current?.layout.positions.get('p1'):null;
 const x=center?.x??nodeById('p1')?.x??0,y=center?.y??nodeById('p1')?.y??0;
 state.zoom=1;state.tx=stage.clientWidth/2-x;state.ty=stage.clientHeight/2-y;updateCamera();
}
function ensureNodeVisible(id){
 const n=nodeById(id);if(!n)return;
 const g=geometry(n),width=stage.clientWidth,height=stage.clientHeight;
 const cx=n.x*state.zoom+state.tx,cy=n.y*state.zoom+state.ty;
 const hw=g.w*state.zoom/2,hh=g.h*state.zoom/2;
 const padLeft=46,padRight=46,padTop=175,padBottom=110;
 if(cx-hw<padLeft)state.tx+=padLeft-(cx-hw);
 else if(cx+hw>width-padRight)state.tx-=cx+hw-(width-padRight);
 if(cy-hh<padTop)state.ty+=padTop-(cy-hh);
 else if(cy+hh>height-padBottom)state.ty-=cy+hh-(height-padBottom);
 updateCamera();
}
function fit(){
 if(!nodesEl.childNodes.length){centerOn();return;}
 const b=camera.getBBox();if(!Number.isFinite(b.width)||b.width<=0)return;
 const pad=85,topPad=Math.max(pad,(document.querySelector('.toplabel')?.offsetHeight||0)+35);
 const sw=Math.max(80,stage.clientWidth-pad*2),sh=Math.max(80,stage.clientHeight-topPad-pad);
 state.zoom=clamp(Math.min(sw/b.width,sh/b.height,1.1),.055,2.5);
 state.tx=stage.clientWidth/2-(b.x+b.width/2)*state.zoom;
 state.ty=topPad+sh/2-(b.y+b.height/2)*state.zoom;
 updateCamera();
}
function focusCore(){centerOn();}
function zoomBy(factor,cx=stage.clientWidth/2,cy=stage.clientHeight/2){const z=clamp(state.zoom*factor,.22,3.2);const x=(cx-state.tx)/state.zoom,y=(cy-state.ty)/state.zoom;state.zoom=z;state.tx=cx-x*z;state.ty=cy-y*z;updateCamera();}
function inFrame(clientX,clientY){const b=stage.getBoundingClientRect();return{x:clientX-b.left,y:clientY-b.top};}
// Las interacciones dependientes de coordenadas y líneas se retiraron con el motor.
// La vista activa no cambia el grafo; las representaciones derivadas son de lectura.
for(const button of document.querySelectorAll('[data-view]')){
 button.addEventListener('click',async()=>{
  const mode=button.dataset.view;
  await derived.select(mode);
  if(mode==='01'){updatePanel();syncGraphics(false);fit();}
 });
}
let panStart=null;
stage.addEventListener('pointerdown',e=>{if(e.button!==0)return;panStart={x:e.clientX,y:e.clientY,tx:state.tx,ty:state.ty};stage.setPointerCapture(e.pointerId);});
stage.addEventListener('pointermove',e=>{if(!panStart)return;state.tx=panStart.tx+e.clientX-panStart.x;state.ty=panStart.ty+e.clientY-panStart.y;updateCamera();});
for(const kind of ['pointerup','pointercancel'])stage.addEventListener(kind,e=>{panStart=null;if(stage.hasPointerCapture(e.pointerId))stage.releasePointerCapture(e.pointerId);});
stage.addEventListener('wheel',e=>{e.preventDefault();const p=inFrame(e.clientX,e.clientY);zoomBy(Math.exp(-e.deltaY*.0011),p.x,p.y);},{passive:false});
$('coreBtn').onclick=()=>centerOn('p1',1);$('fitBtn').onclick=()=>fit();$('zoomFit').onclick=()=>fit();$('zoomIn').onclick=()=>zoomBy(1.2);$('zoomOut').onclick=()=>zoomBy(1/1.2);$('undoBtn').onclick=undo;
$('resetBtn').onclick=()=>{if(!confirm('¿Cargar el ejemplo PPR? Los cambios no guardados se perderán.'))return;init(true);toast('Ejemplo PPR cargado.');};
$('newBtn').onclick=()=>{if(!confirm('¿Crear un diagrama nuevo con tres ramas? Guarda antes el JSON actual si deseas conservarlo.'))return;init(false);toast('Nuevo diagrama vacío: núcleo y tres ramas editables.');};
$('addBtn').onclick=()=>addConcept();$('deleteBtn').onclick=deleteSelected;
function setLinkStyle(style){
 if(!validLinkStyle(style))return;
 state.linkStyle=style;
 for(const button of document.querySelectorAll('[data-link-style]'))
  button.setAttribute('aria-pressed',String(button.dataset.linkStyle===style));
}
for(const button of document.querySelectorAll('button[data-link-style]'))
 button.addEventListener('click',()=>setLinkStyle(button.dataset.linkStyle));
$('linkBtn').onclick=()=>{state.unlinkFrom=null;if(state.linkFrom){state.linkFrom=null;toast('Conexión cancelada.');}else if(selected()){state.linkFrom=state.selected;toast('Ahora selecciona el concepto de destino.');}updatePanel();};
$('unlinkBtn').onclick=()=>{state.linkFrom=null;if(state.unlinkFrom){state.unlinkFrom=null;toast('Eliminación cancelada.');}else if(selected()){state.unlinkFrom=state.selected;toast('Ahora selecciona el concepto conectado cuyo vínculo quieres retirar.');}updatePanel();};
let typingStarted=false,geometryTypingTimer=null;$('nodeText').addEventListener('focus',()=>typingStarted=false);
function cancelPendingTyping(){clearTimeout(geometryTypingTimer);geometryTypingTimer=null;typingStarted=false;}
$('nodeText').addEventListener('input',e=>{
 const n=selected();if(!n)return;if(!typingStarted){saveUndo();typingStarted=true;}
 const shown=plane.metrics.get(n.id)||geometry(n);n.text=e.target.value||' ';const next=geometry(n);
 $('widthOut').textContent=next.w+' px';clearTimeout(geometryTypingTimer);geometryTypingTimer=null;
 if(next.w===shown.w&&next.h===shown.h)refreshNodeLabel(n);
 else geometryTypingTimer=setTimeout(()=>{geometryTypingTimer=null;schedule();},240);
});
$('nodeText').addEventListener('blur',()=>{typingStarted=false;if(geometryTypingTimer){clearTimeout(geometryTypingTimer);geometryTypingTimer=null;schedule();}});
function changeWidth(delta){const n=selected();if(!n)return;saveUndo();n.width=clamp(geometry(n).w+delta,n.id==='p1'?96:125,350);$('widthOut').textContent=geometry(n).w+' px';schedule();}
$('narrowBtn').onclick=()=>changeWidth(-20);$('widenBtn').onclick=()=>changeWidth(20);
$('depth').addEventListener('input',e=>{state.depth=Number(e.target.value);scheduleVisibility();});
// El filtro es solo visibilidad: conserva coordenadas, zoom y cámara.
$('showAllBtn').onclick=()=>{state.depth=maximumDepth();scheduleVisibility();};
window.addEventListener('keydown',e=>{const target=e.target.tagName.toLowerCase();if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){if(target!=='textarea'&&target!=='input'){e.preventDefault();undo();}}if(e.key==='Escape'&&(state.linkFrom||state.unlinkFrom)){state.linkFrom=null;state.unlinkFrom=null;updatePanel();}});
function importGraph(data){
 cancelPendingTyping();
 cancelInitialBuild();
 saveUndo();
 derived.reset();
 derived.restoreData(data.derivedViews);
 topology.reset();
 stagedTopology=data.topologyRegister??null;
 state.nodes=data.nodes.map(n=>({...n}));
 state.edges=data.edges.map(e=>({...e}));
 state.focusRoot='p1';
 state.selected='p1';
 state.linkFrom=null;
 state.unlinkFrom=null;
 state.depth=maximumDepth();
 setLinkStyle('solid');
 state.idSerial=Math.max(0,...state.nodes.map(n=>Number(n.id.match(/^n([0-9]+)$/)?.[1]||0)));
 plane.ready=false;
 plane.nodeEls.clear();
 plane.routeEls.clear();
 linesEl.replaceChildren();
 nodesEl.replaceChildren();
 const restored=validateSavedCheckpoint(data.planeCheckpoint)||
  validateSavedCheckpoint(data.planeCheckpoint,previousTypographyGeometry)||
  validateSavedCheckpoint(data.planeCheckpoint,legacyGeometry);
 if(!restored)plane.ready=false;
 pendingAutoFit=true;
 updatePanel();
 schedule();
}
const graphFiles=bindGraphFiles({
 fileInput:$('fileInput'),loadButton:$('loadBtn'),saveButton:$('jsonBtn'),toast,onImport:importGraph,
 snapshot:()=>({schema:'p1.graph.v1',nodes:state.nodes,edges:state.edges,planeCheckpoint:saveCheckpoint(),
  topologyRegister:topology.reference,derivedViews:derived.exportData()})
});
// Exportación sin cambiar el modelo, el zoom ni la posición del lienzo.
// SVG autónomo: incluye los estilos de los nodos, las líneas y las máscaras.
const themeButton=$('themeBtn');
function setTheme(theme){
 const dark=theme==='dark';
 document.documentElement.dataset.theme=dark?'dark':'light';
 themeButton.textContent=dark?'Claro':'Oscuro';
 themeButton.setAttribute('aria-pressed',dark?'true':'false');
 try{localStorage.setItem('p1-color-theme',dark?'dark':'light');}catch{}
}
let selectedTheme='light';
try{selectedTheme=localStorage.getItem('p1-color-theme')==='dark'?'dark':'light';}catch{}
setTheme(selectedTheme);
themeButton.onclick=()=>setTheme(document.documentElement.dataset.theme==='dark'?'light':'dark');
bindDiagramExports({
 svgButton:$('svgBtn'),pngButton:$('pngBtn'),stage,camera,linesEl,nodesEl,plane,derived,state,diag,toast,sEl
});
function init(useDemo=true){
 graphFiles.cancel();
 cancelPendingTyping();
 cancelInitialBuild();
 plane.reset();
 derived.reset();
 topology.reset();
 stagedTopology=null;
 linesEl.replaceChildren();
 nodesEl.replaceChildren();
 const demo=useDemo?seed():blankSeed();
 state.nodes=demo.nodes;
 state.edges=demo.edges;
 state.selected='p1';
 state.linkFrom=null;
 state.unlinkFrom=null;
 setLinkStyle('solid');
 state.focusRoot='p1';
 state.depth=maximumDepth();
 state.undo=[];
 state.idSerial=0;
 syncDepth();
 updatePanel();
 $('undoBtn').disabled=true;
 pendingAutoFit=true;
 schedule();
}
const ro=new ResizeObserver(()=>{updateCamera();});ro.observe(stage);
const bootButtons=[...document.querySelectorAll('button')];
bootButtons.forEach(button=>button.disabled=true);
loadNodeTypography().catch(error=>console.warn('Tipografía de respaldo:',error.message)).then(()=>{
 bootButtons.forEach(button=>button.disabled=false);init();
});
