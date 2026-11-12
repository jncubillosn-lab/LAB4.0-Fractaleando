import {TopologyRegister} from '../core/TopologyRegister.js';
import {PcbRouter} from './PcbRouter.js';
import {GeometryValidator} from './GeometryValidator.js';
import {analyzeRadialHierarchy} from './RadialHierarchy.js';
import {computeAngularGrowth} from './AngularGrowthLayout.js';

// P1-ET-02 · Primer principio: conservar una inmersión topológica YA validada.
// Cada propuesta procede de una isotopía explícita del plano
// (x,y) -> (F(x),G(y)), F y G estrictamente crecientes e invertibles.
// La derivación de rutas usa la MISMA transformación, sin reenrutarlas.
// Se rechaza cualquier paso sin certificado independiente del original.
export function computeCompact02(input){
 const {nodes,edges,positions:rawPositions,rects:rawRects,routes:rawRoutes,
  reference,levels={}}=input;
 const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
 const positions=new Map(rawPositions),rects=new Map(rawRects),routes=new Map(rawRoutes);
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const ordered=edges.map((e,i)=>({...e,__index:i})).sort((a,b)=>{
  const score=x=>{
   const u=levels[x.from]??1000,v=levels[x.to]??1000;
   return Math.min(u,v)*10+(x.kind==='transversal'?5:0)+(Math.abs(u-v)>1?2:0);
  };
  return score(a)-score(b)||a.__index-b.__index;
 });
 const router=new PcbRouter({state:{nodes,edges},nodeById:id=>byId.get(id),
  clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),mode:'02'});
 const validator=new GeometryValidator({router,rectOverlap:(a,b,gap=0)=>
  a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap});
 const topology=new TopologyRegister({edgeKey});
 const result={mode:'02',valid:false,topologyValid:false,zoneValid:false,
  lengthValid:false,reason:null,attempted:0,accepted:0};
 const length=rs=>{
  let sum=0;
  for(const e of ordered){
   const r=rs.get(edgeKey(e));
   if(!Array.isArray(r?.points)||r.points.length<2)return NaN;
   for(let i=1;i<r.points.length;i++){
    const a=r.points[i-1],b=r.points[i];
    sum+=Math.hypot(b.x-a.x,b.y-a.y);
   }
  }
  return sum;
 };
 // Cota inferior para CUALQUIER ruta ortogonal que use los mismos
 // extremos. Si supera la longitud de 01, ningún reenrutamiento local
 // puede salvar la norma 03 sin cambiar la geometría sectorial.
 const manhattanBound=rs=>ordered.reduce((sum,e)=>{
  const p=rs.get(edgeKey(e))?.points;
  return sum+(!p?.length?Infinity:
   Math.abs(p[0].x-p.at(-1).x)+Math.abs(p[0].y-p.at(-1).y));
 },0);
 const snapshot=(ps,rs,rr)=>{
  if(!topology.restore(reference))return {ok:false,reason:'registro original inválido'};
  const audit=validator.audit([...rr.values()],ordered.map(e=>rs.get(edgeKey(e))).filter(Boolean));
  const signature=topology.capture({positions:ps,rects:rr,routes:rs,edges:ordered});
  const report=topology.compareEmbedding(reference,signature);
  const all=ordered.every(e=>Array.isArray(rs.get(edgeKey(e))?.points));
  return {ok:all&&audit.boxes===0&&audit.invalid===0&&audit.portsRepeated===0&&
   audit.drawn===edges.length&&report.valid&&signature.pending.length===0,
   report,audit,signature};
 };
 // Identidad EXACTA: compare() permite incorporaciones en 01, pero 02 no.
 // Si el grafo o una sola ruta no pertenecen al mismo documento, bloquear.
 const nodeIds=nodes.map(n=>n.id),edgeIds=edges.map(edgeKey);
 const sameSet=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&
  new Set(b).size===b.length&&a.every(id=>b.includes(id));
 const referenceNodes=TopologyRegister.validShape(reference)?
  reference.nodeOrders.x.flat():[];
 const identitiesOK=TopologyRegister.validShape(reference)&&
  sameSet(reference.edges,edgeIds)&&sameSet(referenceNodes,nodeIds)&&
  reference.pending.length===0&&
  edges.every(e=>routes.get(edgeKey(e))?.edge?.from===e.from&&
   routes.get(edgeKey(e))?.edge?.to===e.to);
 const ready=identitiesOK&&positions.size===nodes.length&&
  rects.size===nodes.length&&routes.size===edges.length&&byId.has('p1');
 const original=ready?snapshot(positions,routes,rects):null;
 if(!original?.ok) {
  result.reason='01 no tiene un punto topológico y geométrico íntegro que permita iniciar 02';
  result.audit=original?.audit||null;result.report=original?.report||null;
  return result;
 }
 // Candidata geométrica desde J0: genera únicamente posiciones y cuadros.
 // NO se fusiona con el checkpoint porque la primera norma exige verificar
 // las rutas completas y su inmersión original. Estadística de diagnóstico.
 const angularCandidate=computeAngularGrowth({nodes,edges,positions,rects});
 const originalLength=length(routes);
 if(!Number.isFinite(originalLength)){
  result.reason='01 contiene rutas sin longitud verificable';return result;
 }
 const roots=nodes.filter(n=>n.parent==='p1').sort((a,b)=>
  (a.branch??0)-(b.branch??0)||a.id.localeCompare(b.id));
 const owner=new Map([['p1',null]]);
 const children=new Map(nodes.map(n=>[n.id,[]]));
 for(const n of nodes)if(children.has(n.parent))children.get(n.parent).push(n);
 const queue=[...roots];
 for(const r of roots)owner.set(r.id,r.id);
 for(let i=0;i<queue.length;i++){
  const node=queue[i],branch=owner.get(node.id);
  for(const ch of children.get(node.id)||[])if(!owner.has(ch.id)){
   owner.set(ch.id,branch);queue.push(ch);
  }
 }
 const orphans=nodes.filter(n=>n.id!=='p1'&&!owner.has(n.id)).map(n=>n.id);
 const allRect=[...rects.values()];
 const makeAxis=(axis,gapScale=.8,separators=[],extra=0)=>{
  const bounds=axis==='x'?['l','r']:['t','b'];
  // Una caja y un margen a su alrededor son una región de traslación rígida.
  // El ancho/alto NO cambia; los puertos y stubs quedan sobre su perímetro.
  const margin=36;
  const intervals=allRect.map(r=>[r[bounds[0]]-margin,r[bounds[1]]+margin])
   .sort((a,b)=>a[0]-b[0]);
  const union=[];
  for(const v of intervals){
   if(union.length&&v[0]<=union.at(-1)[1])union.at(-1)[1]=Math.max(union.at(-1)[1],v[1]);
   else union.push([...v]);
  }
  const gaps=[];
  for(let i=1;i<union.length;i++){
   const lo=union[i-1][1],hi=union[i][0];
   if(hi-lo<.1)continue;
   const center=(lo+hi)/2;
   const separator=separators.some(s=>s>lo+1&&s<hi-1);
   const factor=separator&&extra>0?1+extra/(hi-lo):gapScale;
   gaps.push({lo,hi,factor});
  }
  // piecewise affine, en todo punto la derivada es positiva; con factores
  // de contracción/expansión >0 resulta una biyección del eje.
  const fn=v=>{
   let delta=0;
   for(const g of gaps){
    if(v<=g.lo)break;
    const inside=Math.min(v,g.hi)-g.lo;
    delta+=(g.factor-1)*inside;
   }
   return v+delta;
  };
  return {fn,gaps,monotone:gaps.every(g=>g.factor>0&&Number.isFinite(g.factor))};
 };
 const componentBounds=roots.map(root=>{
  const rs=nodes.filter(n=>owner.get(n.id)===root.id)
   .map(n=>rects.get(n.id)).filter(Boolean);
  return {root:root.id,l:Math.min(...rs.map(r=>r.l)),r:Math.max(...rs.map(r=>r.r))};
 }).sort((a,b)=>a.l-b.l);
 const separators=[];
 for(let i=1;i<componentBounds.length;i++){
  const a=componentBounds[i-1],b=componentBounds[i];
  // Solo se ensancha un espacio que YA está vacío entre ramas completas.
  if(b.l>a.r+90)separators.push((a.r+b.l)/2);
 }
 const transform=(xScale,yScale,extra)=>{
  const fx=makeAxis('x',xScale,separators,extra),
   fy=makeAxis('y',yScale);
  if(!fx.monotone||!fy.monotone)return null;
  const origin=positions.get('p1');
  const dx=fx.fn(origin.x),dy=fy.fn(origin.y);
  const map=p=>({x:fx.fn(p.x)-dx,y:fy.fn(p.y)-dy});
  const ps=new Map([...positions].map(([id,p])=>[id,map(p)]));
  const rr=new Map([...rects].map(([id,r])=>{
   const p=ps.get(id);
   return [id,{...r,x:p.x,y:p.y,l:p.x-r.w/2,r:p.x+r.w/2,
    t:p.y-r.h/2,b:p.y+r.h/2}];
  }));
  const rs=new Map([...routes].map(([key,r])=>[key,{...r,
   points:r.points?.map(map)||null,
   fromPort:r.fromPort?{...r.fromPort,...map(r.fromPort),
    sx:fx.fn(r.fromPort.sx)-dx,sy:fy.fn(r.fromPort.sy)-dy}:null,
   toPort:r.toPort?{...r.toPort,...map(r.toPort),
    sx:fx.fn(r.toPort.sx)-dx,sy:fy.fn(r.toPort.sy)-dy}:null}]));
  // Las polilíneas también sufren exactamente la misma homeomorfía:
  // ningún cruce se añade o desaparece por la transformación ideal.
  return {ps,rr,rs,fx,fy};
 };
 const angles=(draft)=>{
  const ps=draft.ps,rr=draft.rr;
  if(orphans.length||!roots.length)return {valid:false,overlapCount:Infinity,
   unassigned:orphans};
  // Un sector comprende el cuadro COMPLETO, no únicamente su centro.
  const byRoot=new Map(roots.map(r=>[r.id,[]]));
  for(const n of nodes){
   if(n.id==='p1')continue;
   const r=rr.get(n.id),branch=owner.get(n.id);
   if(!r||!byRoot.has(branch))return {valid:false,overlapCount:Infinity,unassigned:[n.id]};
   for(const [x,y] of [[r.l,r.t],[r.l,r.b],[r.r,r.t],[r.r,r.b]]){
    let a=Math.atan2(y,x);
    if(a<0)a+=2*Math.PI;
    byRoot.get(branch).push(a);
   }
  }
  const tagged=[...byRoot].flatMap(([id,as])=>as.map(a=>({id,a})))
   .sort((x,y)=>x.a-y.a);
  const TAU=2*Math.PI;
  let best=Infinity,orderedSectors=[];
  // Si los sectores no se cruzan, siempre hay un hueco entre puntos
  // pertenecientes a DOS ramas distintas. Solo probar esos cortes
  // es completo para decidir separabilidad circular, y evita O(N²).
  const seams=[];
  for(let i=0;i<tagged.length;i++){
   const left=tagged[i],right=tagged[(i+1)%tagged.length];
   const next=i===tagged.length-1?right.a+TAU:right.a;
   if(left.id!==right.id&&next-left.a>1e-8)
    seams.push(((next+left.a)/2)%TAU);
  }
  if(!seams.length)seams.push(0);
  for(const seam of seams){
   const spans=[...byRoot].map(([id,as])=>{
    const vals=as.map(a=>(a-seam+TAU)%TAU);
    return {id,min:Math.min(...vals),max:Math.max(...vals)};
   }).sort((a,b)=>a.min-b.min);
   let overlap=0;
   for(let i=1;i<spans.length;i++)overlap+=Math.max(0,spans[i-1].max-spans[i].min);
   if(overlap<best){best=overlap;orderedSectors=spans;}
   if(overlap<.000001)break;
  }
  return {valid:best<.000001,overlapCount:best,
   sectors:orderedSectors,unassigned:orphans};
 };
 const radial=draft=>analyzeRadialHierarchy({nodes,positions:draft.ps,j0Id:'p1'});
 const area=rr=>{
  const a=[...rr.values()];
  return (Math.max(...a.map(r=>r.r))-Math.min(...a.map(r=>r.l)))*
   (Math.max(...a.map(r=>r.b))-Math.min(...a.map(r=>r.t)));
 };
 // La traslación de J0 al origen también es una isotopía certificada.
 const centered=transform(1,1,0);
 const centeredCheck=centered?snapshot(centered.ps,centered.rs,centered.rr):null;
 if(!centeredCheck?.ok){
  result.reason='No se puede centralizar J0 conservando la referencia de 01';
  result.report=centeredCheck?.report||original.report;
  result.audit=centeredCheck?.audit||original.audit;
  return result;
 }
 let best={...centered,geometry:centeredCheck,zone:angles(centered),
  radial:radial(centered),length:originalLength,extra:0};
 // No se promueve jamás una simple propuesta a punto de control.
 // Se ordenan transformaciones matemáticamente inyectivas y SE CERTIFICA
 // cada finalista antes de aceptarla. Una propuesta rechazada no cambia
 // el punto de control válido anterior.
 const certify=(draft)=>{
  if(!draft)return null;result.attempted++;
  const cert=snapshot(draft.ps,draft.rs,draft.rr);
  if(!cert.ok)return null;
  result.accepted++;
  return {...draft,geometry:cert,zone:angles(draft),
   radial:radial(draft),length:length(draft.rs)};
 };
 const proposals=[];
 const propose=(fx,fy,extra=0)=>{
  const draft=transform(fx,fy,extra);
  if(!draft)return;
  const zone=angles(draft),radius=radial(draft),routeLength=length(draft.rs);
  if(Number.isFinite(routeLength))proposals.push({...draft,zone,radial:radius,length:routeLength,extra});
 };
 // Etapa 1: reducir distancias únicamente en espacios vacíos de 01.
 // Estas deformaciones son globales e invertibles; NO crean rutas nuevas.
 for(const factor of [.95,.85,.7,.55,.4,.25])propose(factor,factor,0);
 proposals.sort((a,b)=>a.length-b.length);
 // Primer candidato topológicamente y geométricamente aprobado.
 for(const candidate of proposals.slice(0,6)){
  if(candidate.zone.valid)continue;
  const trial=certify(candidate);
  if(trial&&trial.length<best.length-1e-5){best=trial;break;}
 }
 // Etapa 2: buscar sectores angulares sin restringir su ancho al de
 // una órbita. Etapa 3: entre las soluciones que ya satisfacen 1 y 2,
 // minimizar la longitud REAL de todas las rutas (no centros).
 if(separators.length===Math.max(0,roots.length-1)){
  const extras=[0,150,300,600,1000,1600,2500,4000,6500,10000,15000,25000];
  for(const extra of extras){
   for(const xf of [.25,.4,.55,.7,.85]){
    for(const yf of [.25,.45,.65,.85]){
     if(extra===0&&xf===yf)continue;
     propose(xf,yf,extra);
    }
   }
  }
 }
 // Primero zonas, luego crecimiento radial: si ninguno lo logra,
 // conservar el mejor sector con radio insuficiente SOLO para diagnóstico.
 // Ningún candidato sin norma radial puede entrar al conjunto 'valid'.
 const radialDeficit=r=>r.valid?0:r.violations.reduce((sum,v)=>
  sum+Math.max(0,1e-7-v.clearance),0);
 const zoned=proposals.filter(p=>p.zone.valid)
  .sort((a,b)=>Number(b.radial.valid)-Number(a.radial.valid)||
   radialDeficit(a.radial)-radialDeficit(b.radial)||a.length-b.length);
 for(const candidate of zoned){
  if(best.zone.valid&&best.radial.valid&&candidate.radial.valid&&
     candidate.length>=best.length-1e-5)continue;
  const trial=certify(candidate);
  if(!trial?.zone.valid)continue;
  const better=!best.zone.valid||
   (trial.radial.valid&&!best.radial.valid)||
   (trial.radial.valid&&best.radial.valid&&trial.length<best.length-1e-5)||
   (!trial.radial.valid&&!best.radial.valid&&
    (radialDeficit(trial.radial)<radialDeficit(best.radial)-1e-5||
     (Math.abs(radialDeficit(trial.radial)-radialDeficit(best.radial))<1e-5&&
      trial.length<best.length-1e-5)));
  if(better)best=trial;
  if(best.radial.valid&&best.length<originalLength-1e-5)break;
  if(result.attempted>18)break;
 }
 const radialOK=best.radial.valid;
 const lengthOK=best.zone.valid&&radialOK&&best.length<originalLength-1e-5;
 const sourceArea=area(rects);
 Object.assign(result,{valid:Boolean(best.geometry?.ok&&best.zone.valid&&radialOK&&lengthOK),
  topologyValid:Boolean(best.geometry?.ok),
  zoneValid:best.zone.valid,radialValid:radialOK,lengthValid:lengthOK,
  reason:!best.geometry?.ok?'Sin topología válida':
   !best.zone.valid?'Topología conservada; no se encontró distribución sectorial válida':
   !radialOK?'No se respeta el orden radial J0, J1, J2…: es necesario cambiar las direcciones de crecimiento desde el núcleo':
   !lengthOK?(manhattanBound(best.rs)>=originalLength?
    'Zonas conservadas, pero la distancia Manhattan mínima ya supera toda la longitud de 01; requiere otra deformación geométrica':
    'Zonas válidas sin reducción de longitud real'):'Todas las normas verificadas',
  positions:[...best.ps],rects:[...best.rr],routes:[...best.rs],
  topology:best.geometry.signature,report:best.geometry.report,audit:best.geometry.audit,
  stats:{mode:'02',nodes:best.ps.size,arms:roots.length,overlaps:best.geometry.audit.boxes,
   zoneValid:best.zone.valid,sectorOverlap:best.zone.overlapCount,
   sectors:best.zone.sectors,unassigned:best.zone.unassigned,
   radialValid:radialOK,radialBands:best.radial.summary,
   radialViolations:best.radial.violations,radialErrors:best.radial.errors,
   angularGeometryTrial:{
    geometryValid:angularCandidate.valid,
    topologicalRoutesVerified:false,
    reason:'La geometría radial se ha calculado; sus recorridos todavía requieren certificación completa contra 01',
    ...angularCandidate.stats
   },
   sourceRouteLength:originalLength,routeLength:best.length,
   sourceManhattanBound:manhattanBound(routes),manhattanBound:manhattanBound(best.rs),
   reductionPercent:100*(1-best.length/originalLength),
   sourceArea,area:area(best.rr),sourceCrossings:original.signature.crossings.reduce((n,c)=>n+c.count,0),
   crossings:best.geometry.signature.crossings.reduce((n,c)=>n+c.count,0),
   attempted:result.attempted,accepted:result.accepted,
   topologyValid:best.geometry.ok,radiusByLevel:null},
  levels});
 return result;
}
