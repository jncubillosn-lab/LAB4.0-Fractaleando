import {TopologyRegister} from '../core/TopologyRegister.js';
import {PcbRouter} from './PcbRouter.js';
import {GeometryValidator} from './GeometryValidator.js';

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
 const snapshot=(ps,rs,rr)=>{
  if(!topology.restore(reference))return {ok:false,reason:'registro original inválido'};
  const audit=validator.audit([...rr.values()],ordered.map(e=>rs.get(edgeKey(e))).filter(Boolean));
  const signature=topology.capture({positions:ps,rects:rr,routes:rs,edges:ordered});
  const report=topology.compare(reference,signature);
  const all=ordered.every(e=>Array.isArray(rs.get(edgeKey(e))?.points));
  return {ok:all&&audit.boxes===0&&audit.invalid===0&&audit.portsRepeated===0&&
   audit.drawn===edges.length&&report.valid&&signature.pending.length===0,
   report,audit,signature};
 };
 const ready=TopologyRegister.validShape(reference)&&positions.size===nodes.length&&
  rects.size===nodes.length&&routes.size===edges.length&&byId.has('p1');
 const original=ready?snapshot(positions,routes,rects):null;
 if(!original?.ok) {
  result.reason='01 no tiene un punto topológico y geométrico íntegro que permita iniciar 02';
  result.audit=original?.audit||null;result.report=original?.report||null;
  return result;
 }
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
  const values=[...byRoot.values()].flat().sort((a,b)=>a-b);
  const TAU=2*Math.PI;
  let best=Infinity,orderedSectors=[];
  // Buscar cualquier corte angular de los sectores. Nunca se exige ancho
  // fijo ni se impone el orden cartesiano de los conceptos de 01.
  const seams=[];
  for(let i=0;i<values.length;i++){
   const next=i===values.length-1?values[0]+TAU:values[i+1];
   if(next-values[i]>.000001)seams.push((next+values[i])/2%TAU);
  }
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
 const area=rr=>{
  const a=[...rr.values()];
  return (Math.max(...a.map(r=>r.r))-Math.min(...a.map(r=>r.l)))*
   (Math.max(...a.map(r=>r.b))-Math.min(...a.map(r=>r.t)));
 };
 let best={ps:positions,rr:rects,rs:routes};
 best={...best,source:true,geometry:original,zone:angles(best),length:originalLength};
 // Norma 01: sólo se adoptan candidatos que superen el control independiente.
 const certify=(draft)=>{
  if(!draft)return null;result.attempted++;
  const cert=snapshot(draft.ps,draft.rs,draft.rr);
  if(!cert.ok)return null;
  result.accepted++;
  return {...draft,geometry:cert,zone:angles(draft),length:length(draft.rs)};
 };
 // Compactación topológicamente segura: estrechar únicamente corredores
 // vacíos y conservar exactamente sus rutas. El núcleo queda en (0,0).
 for(const factor of [.90,.75,.6,.45]){
  const trial=certify(transform(factor,factor,0));
  if(trial&&trial.length<best.length-1e-5)best=trial;
 }
 // Norma 02: el intento sectorial parte de una inmersión ya certificada.
 // Se ensanchan solamente franjas vacías entre ramas para separarlas,
 // conservando los 71 cruces de referencia cuando los había.
 if(!best.zone.valid&&separators.length===Math.max(0,roots.length-1)){
  for(const extra of [150,300,600,1000,1600,2500,4000,6500,10000,15000,25000]){
   const draft=transform(.65,.65,extra);
   if(!draft)continue;
   const zoned=angles(draft);
   if(!zoned.valid)continue;
   const trial=certify(draft);
   if(trial?.zone.valid&&(!best.zone.valid||trial.length<best.length))best=trial;
  }
 }
 // Regla 03: solo cuando 01 y 02 están aprobadas.
 if(best.zone.valid){
  for(const factor of [.8,.65,.5,.35]){
   const trial=certify(transform(factor,factor,0));
   if(trial?.zone.valid&&trial.length<best.length)best=trial;
  }
 }
 const lengthOK=best.zone.valid&&best.length<originalLength-1e-5;
 const sourceArea=area(rects);
 Object.assign(result,{valid:Boolean(best.geometry?.ok&&best.zone.valid&&lengthOK),
  topologyValid:Boolean(best.geometry?.ok),
  zoneValid:best.zone.valid,lengthValid:lengthOK,
  reason:!best.geometry?.ok?'Sin topología válida':
   !best.zone.valid?'Topología conservada; no se encontró distribución sectorial válida':
   !lengthOK?'Zonas válidas sin reducción de longitud real':'Todas las normas verificadas',
  positions:[...best.ps],rects:[...best.rr],routes:[...best.rs],
  topology:best.geometry.signature,report:best.geometry.report,audit:best.geometry.audit,
  stats:{mode:'02',nodes:best.ps.size,arms:roots.length,overlaps:best.geometry.audit.boxes,
   zoneValid:best.zone.valid,sectorOverlap:best.zone.overlapCount,
   sectors:best.zone.sectors,unassigned:best.zone.unassigned,
   sourceRouteLength:originalLength,routeLength:best.length,
   reductionPercent:100*(1-best.length/originalLength),
   sourceArea,area:area(best.rr),sourceCrossings:original.signature.crossings.reduce((n,c)=>n+c.count,0),
   crossings:best.geometry.signature.crossings.reduce((n,c)=>n+c.count,0),
   attempted:result.attempted,accepted:result.accepted,
   topologyValid:best.geometry.ok,radiusByLevel:null},
  levels});
 return result;
}
