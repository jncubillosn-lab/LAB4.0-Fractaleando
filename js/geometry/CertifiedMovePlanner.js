import {createCertifiedPatch,applyCertifiedPatch} from './AmbientIsotopy.js';
import {createAxisCorridorWarp,applyAxisCorridorWarp} from './AxisCorridorWarp.js';
import {referenceSectors,analyzeCompactObjectives} from './CompactObjectives.js';
import {optimizeSectorBoundaries} from './CompactSectorOptimizer.js';
import {captureEmbeddedTopology,compareEmbeddedTopology} from './EmbeddedTopology.js';

// Planificador P1-ET-02: NO mueve directamente ninguna caja.
// Cada candidato se somete al núcleo de isotopía ambiental y a la firma
// topológica de 01. Las metas se optimizan por prioridad:
// 1) topología, 2) sectores, 3) bandas radiales, 4) longitud real.
// Los estados parcialmente correctos nunca se declaran 02 aprobada.
const EPS=1e-5;
const routeLength=routes=>{
 let sum=0;
 for(const rt of routes.values()){
  if(!rt?.points?.length)return Infinity;
  for(let i=1;i<rt.points.length;i++)sum+=Math.hypot(
   rt.points[i].x-rt.points[i-1].x,rt.points[i].y-rt.points[i-1].y);
 }
 return sum;
};
const normalize=(snapshot)=>({
 ...snapshot,
 positions:snapshot.positions instanceof Map?snapshot.positions:new Map(snapshot.positions),
 rects:snapshot.rects instanceof Map?snapshot.rects:new Map(snapshot.rects),
 routes:snapshot.routes instanceof Map?snapshot.routes:new Map(snapshot.routes)
});
function ancestry(nodes){
 const byId=new Map(nodes.map(n=>[n.id,n])),children=new Map(nodes.map(n=>[n.id,[]]));
 for(const n of nodes)if(n.parent&&children.has(n.parent))children.get(n.parent).push(n.id);
 const cache=new Map();
 function descendants(id){
  if(cache.has(id))return cache.get(id);
  const out=[id];
  for(const child of children.get(id)||[])out.push(...descendants(child));
  cache.set(id,out);return out;
 }
 return {byId,children,descendants};
}
function shoulders(dx,dy){
 const x=Math.abs(dx),y=Math.abs(dy),base=54;
 return {left:dx<0?Math.ceil(x*1.14+65):base,
  right:dx>0?Math.ceil(x*1.14+65):base,
  top:dy<0?Math.ceil(y*1.14+65):base,
  bottom:dy>0?Math.ceil(y*1.14+65):base};
}
function patchRequest(targetId,targetIds,dx,dy){
 return {targetId,targetIds,dx,dy,pad:24,shoulders:shoulders(dx,dy)};
}
function preserveAchievedBands(a,b){
 // Nunca reabrir un escalón jerárquico que ya cumple su desigualdad.
 // Un objetivo incompleto sí puede mejorarse gradualmente.
 for(let i=1;i<b.radialBands.length;i++){
  const before=b.radialBands[i],beforeInner=b.radialBands[i-1],
   after=a.radialBands[i],afterInner=a.radialBands[i-1];
  if(before.min>beforeInner.max+.01&&
     !(after.min>afterInner.max+.01))return false;
 }
 return true;
}
function relativeBetter(a,b,phase){
 if(!preserveAchievedBands(a,b))return false;
 // Comparación exacta de prioridades geométricas (la norma 1 la
 // certifica el motor antes de permitir este comparador).
 if(phase==='hub'){
  return a.zonePenalty<=b.zonePenalty+EPS &&
   a.j1RadiusSum<b.j1RadiusSum-1 &&
   a.j1MaxRadius<=b.j1MaxRadius+EPS;
 }
 if(phase==='sector')
  return a.zonePenalty<b.zonePenalty-.25 &&
   a.j1MaxRadius<=b.j1MaxRadius+EPS;
 if(phase==='radial')
  return a.zonePenalty<=b.zonePenalty+EPS &&
   a.radialPenalty<b.radialPenalty-.5;
 return a.zonePenalty<=b.zonePenalty+EPS &&
  a.radialPenalty<=b.radialPenalty+EPS;
}
function describe(m,length){
 return {zonePenalty:m.zonePenalty,zoneViolations:m.zoneViolations,
  zoneValid:m.zoneValid,radialPenalty:m.radialPenalty,
  radialViolations:m.radialViolations,radialValid:m.radialValid,
  j1MaxRadius:m.j1MaxRadius,j1RadiusSum:m.j1RadiusSum,
  radialBands:m.radialBands,routeLength:length,
  centerManhattan:m.centerManhattan};
}
export function planCertifiedCompact02({
 snapshot,initialSignature,reference=null,maxHubMoves=4,
 maxSectorMoves=5,maxRadialMoves=2,maxProposals=6500,
 allowAxisCompression=true
}){
 let current=normalize(snapshot),sectors=reference||
  optimizeSectorBoundaries({nodes:current.nodes,edges:current.edges,
   positions:current.positions,rects:current.rects});
 if(!sectors.valid)return {valid:false,reason:sectors.reason||'Sectores originales inválidos'};
 const {nodes,edges}=current,{children,descendants}=ancestry(nodes),
  stats={proposed:0,rejected:0,certified:0,geometryRejected:0};
 const moves=[],timeline=[],failures=[];
 let metric=analyzeCompactObjectives({nodes,edges,positions:current.positions,
  rects:current.rects,sectors});
 if(!metric.valid)return {valid:false,reason:'Geometría inicial inválida: '+metric.errors.join(', ')};
 const referenceLength=routeLength(current.routes);
 let currentLength=referenceLength,topology=captureEmbeddedTopology(current);
 if(!topology.valid)return {valid:false,reason:'El plano inicial no supera la auditoría',issues:topology.problems};
 const oldSignature=initialSignature||topology.signature,
  t0=Date.now();
 const metricsFor=(positions,rects=current.rects)=>analyzeCompactObjectives({
  nodes,edges,positions,rects,sectors
 });
 const preview=req=>{
  stats.proposed++;
  const patch=createCertifiedPatch({rects:current.rects,...req});
  if(!patch.valid){stats.geometryRejected++;return null;}
  const candidatePositions=new Map(current.positions);
  for(const id of req.targetIds){
   const p=candidatePositions.get(id);
   if(!p)return null;
   candidatePositions.set(id,{x:p.x+req.dx,y:p.y+req.dy});
  }
  const next=metricsFor(candidatePositions);
  return next.valid?{request:req,metric:next,proof:patch.proof}:null;
 };
 const commit=(proposal,phase)=>{
  const trial=applyCertifiedPatch(current,proposal.request);
  if(!trial.valid){stats.rejected++;return false;}
  const audit=captureEmbeddedTopology(trial.snapshot);
  const compared=compareEmbeddedTopology(oldSignature,audit.signature);
  if(!audit.valid||!compared.valid||audit.audit.drawn!==edges.length){
   stats.rejected++;
   failures.push({phase,id:proposal.request.targetId,
    issues:[...audit.problems,...compared.issues].slice(0,2)});
   return false;
  }
  const next=metricsFor(trial.snapshot.positions,trial.snapshot.rects);
  if(!relativeBetter(next,metric,phase)){
   stats.rejected++;return false;
  }
  current=trial.snapshot;topology=audit;metric=next;
  currentLength=routeLength(current.routes);
  stats.certified++;
  const record={
   phase,id:proposal.request.targetId,members:proposal.request.targetIds.length,
   dx:proposal.request.dx,dy:proposal.request.dy,
   certificate:trial.proof.kind,bound:trial.proof.bound,
   minimumDerivative:trial.proof.minimumDerivative??null,
   topologyIssues:0,links:audit.audit.drawn,crossings:audit.audit.crossings,
   ...describe(metric,currentLength)
  };
  moves.push(record);timeline.push({phase,metrics:describe(metric,currentLength)});
  return true;
 };
 const evalCandidate=(group,dx,dy,phase)=>{
  if(stats.proposed>=maxProposals)return null;
  if(!Number.isFinite(dx+dy)||Math.hypot(dx,dy)<1)return null;
  const req=patchRequest(group[0],group,dx,dy);
  const candidate=preview(req);
  if(!candidate||!relativeBetter(candidate.metric,metric,phase))return null;
  const deltaZone=metric.zonePenalty-candidate.metric.zonePenalty,
   deltaRadial=metric.radialPenalty-candidate.metric.radialPenalty,
   deltaHub=metric.j1RadiusSum-candidate.metric.j1RadiusSum,
   deltaCenter=metric.centerManhattan-candidate.metric.centerManhattan;
  // El área no se optimiza directamente: las normas sobre topología,
  // pertenencia sectorial y jerarquía prevalecen sobre ella.
  const displacement=Math.hypot(dx,dy);
  candidate.score=phase==='hub'?deltaHub-.006*displacement:
   phase==='sector'?deltaZone-.002*displacement+
     .00002*deltaCenter:
   deltaRadial-.002*displacement+.00001*deltaCenter;
  return candidate;
 };
 // 1. Primer anillo: acercar cada J1 a J0 sin hacer más lejanos
 // los demás J1 ni sacar cuadros de su sector. El radio objetivo
 // depende del J2 REAL, nunca es una constante universal.
 const roots=nodes.filter(n=>n.parent==='p1').sort((a,b)=>
  (a.branch??0)-(b.branch??0)||a.id.localeCompare(b.id));
 for(let i=0;i<maxHubMoves;i++){
  const j2=metric.radialBands.find(b=>b.level===2),
   origin=current.positions.get('p1');
  if(!j2||!origin||metric.j1MaxRadius<j2.min-16)break;
  const proposals=[];
  for(const n of roots){
   const p=current.positions.get(n.id),x=p.x-origin.x,y=p.y-origin.y,
    radius=Math.hypot(x,y);
   if(radius<j2.min-16)continue;
   // Evita desplazar un J1 a una línea radial imposible en X.
   const target=Math.max(Math.abs(y)+24,j2.min-32),
    xTarget=Math.sign(x)*Math.sqrt(Math.max(0,target*target-y*y));
   const dx=xTarget-x;
   if(Math.abs(dx)<8)continue;
   for(const fraction of [1,.86,.7,.52,.34]){
    const proposal=evalCandidate([n.id],dx*fraction,0,'hub');
    if(proposal)proposals.push(proposal);
   }
  }
  if(!proposals.length)break;
  proposals.sort((a,b)=>b.score-a.score);
  let accepted=false;
  for(const p of proposals.slice(0,5)){
   if(commit(p,'hub')){accepted=true;break;}
  }
  if(!accepted)break;
 }
 // 2. Sectores: buscar desplazamientos de subárboles completos o
 // descendencias de J1. Nunca se crea un nuevo enlace, ni una caja.
 for(let step=0;step<maxSectorMoves&&stats.proposed<maxProposals;step++){
  const groups=[];
  for(const root of roots){
   const all=descendants(root.id);
   if(all.length>1)groups.push(all.slice(1));
  }
  for(const n of nodes){
   if(n.id==='p1'||n.parent==='p1')continue;
   const all=descendants(n.id);
   if(all.length>=2)groups.push(all);
  }
  // Los primeros pasos actúan sobre ramas y subárboles, no miles de
  // posiciones individuales que consumen el presupuesto de búsqueda.
  // Pasos finales: añadir hojas de J2 y luego nodos sueltos.
  if(step>=2)for(const n of nodes)
   if(n.parent&&n.parent!=='p1'&&
      (step>=4||children.get(n.parent)?.length>0&&
       roots.some(root=>n.parent===root.id)))
    groups.push([n.id]);
  const unique=new Set(),scored=[];
  for(const group of groups){
   const k=group.join('|');
   if(unique.has(k))continue;unique.add(k);
   const first=current.positions.get(group[0]);
   if(!first)continue;
   for(const size of [220,460,780]){
    for(const [x,y] of [[-1,0],[1,0],[0,-1],[0,1]]){
     const candidate=evalCandidate(group,x*size,y*size,'sector');
     if(candidate)scored.push(candidate);
     if(stats.proposed>=maxProposals)break;
    }
    if(stats.proposed>=maxProposals)break;
   }
   if(stats.proposed>=maxProposals)break;
  }
  if(!scored.length)break;
  scored.sort((a,b)=>b.score-a.score);
  let accepted=false;
  for(const p of scored.slice(0,8))if(commit(p,'sector')){
   accepted=true;break;
  }
  if(!accepted)break;
 }
 // 3. Intentar mejorar bandas sucesivas SIN deshacer el progreso
 // sectorial; no inflar niveles arbitrariamente para ganar la prueba.
 for(let i=0;i<maxRadialMoves&&stats.proposed<maxProposals;i++){
  const groups=[];
  for(const n of nodes)if(n.parent&&n.parent!=='p1'&&children.get(n.id)?.length)
   groups.push(descendants(n.id));
  const scored=[];
  for(const group of groups){
   for(const amount of [100,220,360])for(const [x,y] of [
    [-1,0],[1,0],[0,-1],[0,1]
   ]){
    const p=evalCandidate(group,x*amount,y*amount,'radial');
    if(p)scored.push(p);
    if(stats.proposed>=maxProposals)break;
   }
   if(stats.proposed>=maxProposals)break;
  }
  if(!scored.length)break;
  scored.sort((a,b)=>b.score-a.score);
  let accepted=false;
  for(const p of scored.slice(0,8))if(commit(p,'radial')){
   accepted=true;break;
  }
  if(!accepted)break;
 }
 // 4. Corredores globales: únicamente si NO deterioran sectores ni
 // radialidad. Siempre pasan por el mismo registro independiente.
 if(allowAxisCompression)for(const axis of ['y','x']){
  const proposal=createAxisCorridorWarp({rects:current.rects,
   axis,factor:.36,minGap:45,guard:20});
  if(!proposal.valid||!proposal.changed)continue;
  const trial=applyAxisCorridorWarp(current,{axis,factor:.36,minGap:45,guard:20});
  if(!trial.valid)continue;
  const target=metricsFor(trial.snapshot.positions,trial.snapshot.rects);
  const trialLength=routeLength(trial.snapshot.routes);
  const phaseImproved=preserveAchievedBands(target,metric)&&
   (target.zonePenalty<metric.zonePenalty-.1||
   (target.zonePenalty<=metric.zonePenalty+EPS&&
    (target.radialPenalty<metric.radialPenalty-.1||
     (target.radialPenalty<=metric.radialPenalty+EPS&&
      trialLength<currentLength-.01))));
  if(!phaseImproved)continue;
  const audit=captureEmbeddedTopology(trial.snapshot);
  const compared=compareEmbeddedTopology(oldSignature,audit.signature);
  if(!audit.valid||!compared.valid||audit.audit.drawn!==edges.length){
   stats.rejected++;continue;
  }
  current=trial.snapshot;topology=audit;metric=target;
  currentLength=trialLength;stats.certified++;
  moves.push({phase:'corridor',axis,saved:trial.proof.saved,
   certificate:trial.proof.kind,bound:trial.proof.bound,
   links:audit.audit.drawn,crossings:audit.audit.crossings,
   topologyIssues:0,...describe(metric,currentLength)});
  timeline.push({phase:'corridor',metrics:describe(metric,currentLength)});
 }
 const finalReport=compareEmbeddedTopology(oldSignature,topology.signature);
 const allValid=topology.valid&&finalReport.valid&&
  metric.zoneValid&&metric.radialValid&&currentLength<referenceLength-1e-5;
 return {valid:allValid,certified:topology.valid&&finalReport.valid,
  topologyPreserved:topology.valid&&finalReport.valid,
  sectorValid:metric.zoneValid,radialValid:metric.radialValid,
  lengthValid:currentLength<referenceLength-1e-5,
  reason:allValid?'Las cuatro prioridades de P1-ET-02 están demostradas':
   'Transformaciones topológicas certificadas; aún hay prioridades geométricas incumplidas',
  snapshot:current,topology,metrics:metric,
  initialLength:referenceLength,routeLength:currentLength,
  sectorReference:sectors,moves,timeline,failures:failures.slice(0,6),
  sectorOptimization:sectors.optimization||null,
  stats:{...stats,elapsedMs:Date.now()-t0}};
}
