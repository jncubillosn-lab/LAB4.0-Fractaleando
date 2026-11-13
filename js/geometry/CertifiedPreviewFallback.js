import {applyAxisCorridorWarp} from './AxisCorridorWarp.js';
import {captureEmbeddedTopology,compareEmbeddedTopology} from './EmbeddedTopology.js';
import {analyzeCompactObjectives} from './CompactObjectives.js';
import {translateWholePlane} from './AmbientIsotopy.js';

// La vista de trabajo NO debe exhibir una distribución más extensa
// ni con más recorrido si todavía no satisface P1-ET-02. Se conserva
// el intento angular en el diagnóstico, pero nunca se confunde con
// una 02 compacta. Las alternativas se construyen únicamente con
// homeomorfismos certificados y todos los enlaces originales.
export function measureRouteLength(routes){
 let sum=0;
 for(const r of routes.values()){
  if(!Array.isArray(r.points)||r.points.length<2)return Infinity;
  for(let i=1;i<r.points.length;i++)
   sum+=Math.hypot(r.points[i].x-r.points[i-1].x,
    r.points[i].y-r.points[i-1].y);
 }
 return sum;
}
export function measureRectArea(rects){
 const list=[...rects.values()];
 if(!list.length)return Infinity;
 const left=Math.min(...list.map(r=>r.l)),right=Math.max(...list.map(r=>r.r));
 const top=Math.min(...list.map(r=>r.t)),bottom=Math.max(...list.map(r=>r.b));
 return (right-left)*(bottom-top);
}
export function makeCertifiedCompactFallback({
 centered,plan,initialSignature,nodes,edges
}){
 let current=centered;
 let audit=captureEmbeddedTopology(current);
 if(!audit.valid||audit.audit.drawn!==edges.length)
  return {valid:false,reason:'El plano de partida no supera la auditoría'};
 const initialArea=measureRectArea(current.rects);
 const initialLength=measureRouteLength(current.routes);
 let area=initialArea,length=initialLength;
 const report0=compareEmbeddedTopology(initialSignature,audit.signature);
 if(!report0.valid)return {valid:false,reason:'El punto de partida difiere de 01'};
 const steps=[];
 for(const axis of ['x','y']){
  const trial=applyAxisCorridorWarp(current,{
   axis,factor:.36,minGap:45,guard:20
  });
  if(!trial.valid||!trial.changed)continue;
  const nextArea=measureRectArea(trial.snapshot.rects),
   nextLength=measureRouteLength(trial.snapshot.routes);
  // El objetivo es real: área ocupada y longitud total.
  if(!(nextArea<=area+1e-4&&nextLength<length-.01))continue;
  const nextAudit=captureEmbeddedTopology(trial.snapshot);
  const compared=compareEmbeddedTopology(initialSignature,nextAudit.signature);
  if(!nextAudit.valid||nextAudit.audit.drawn!==edges.length||
   !compared.valid)continue;
  current=trial.snapshot;audit=nextAudit;area=nextArea;length=nextLength;
  steps.push({phase:'corridor',kind:'axis-warp',axis,
   certificate:trial.proof.kind,bound:trial.proof.bound,
   saved:trial.proof.saved,links:audit.audit.drawn,
   crossings:audit.audit.crossings,topologyIssues:compared.issueCount});
 }
 let source='certified-global-compaction';
 // Solo se prefiere el plan angular incompleto si mejora simultáneamente
 // longitud y ocupación, nunca a costa de empeorar cualquiera.
 // Un plan completamente válido tiene prioridad normativa.
 if(plan?.certified&&plan?.snapshot&&(
    plan.valid||(
     plan.routeLength<length-.01&&
     measureRectArea(plan.snapshot.rects)<area-.01
    )
  )){
  const proposedAudit=captureEmbeddedTopology(plan.snapshot),
   compared=compareEmbeddedTopology(initialSignature,proposedAudit.signature);
  if(proposedAudit.valid&&compared.valid&&
     proposedAudit.audit.drawn===edges.length){
   current=plan.snapshot;audit=proposedAudit;
   area=measureRectArea(current.rects);
   length=measureRouteLength(current.routes);
   steps.splice(0,steps.length,...plan.moves);
   source='certified-sector-plan';
  }
 }
 // Una compresión monótona puede trasladar el origen absoluto.
 // Recentrar TODO el plano con otra isotopía, no mover J0 aislado.
 const origin=current.positions.get('p1');
 if(!origin)return {valid:false,reason:'No hay núcleo J0'};
 if(Math.hypot(origin.x,origin.y)>1e-8){
  const recentered=translateWholePlane(current,-origin.x,-origin.y);
  if(!recentered.valid)return {valid:false,reason:'No se pudo recentrar J0'};
  const checked=captureEmbeddedTopology(recentered.snapshot),
   checkedReport=compareEmbeddedTopology(initialSignature,checked.signature);
  if(!checked.valid||!checkedReport.valid||checked.audit.drawn!==edges.length)
   return {valid:false,reason:'El recentrado alteraría la topología'};
  current=recentered.snapshot;audit=checked;
  steps.push({phase:'recenter',kind:'global-translation',id:'p1',
   dx:-origin.x,dy:-origin.y,
   certificate:'global-translation',bound:0,members:nodes.length,
   links:checked.audit.drawn,crossings:checked.audit.crossings,
   topologyIssues:checkedReport.issueCount});
 }
 const metrics=analyzeCompactObjectives({
  nodes,edges,positions:current.positions,rects:current.rects,
  sectors:plan?.sectorReference||null
 });
 const report=compareEmbeddedTopology(initialSignature,audit.signature);
 return {valid:audit.valid&&report.valid,source,snapshot:current,
  audit,report,metrics,steps,routeLength:length,area,
  initialLength,initialArea,
  angularAttempt:plan?.metrics?{
   routeLength:plan.routeLength,
   sectorViolations:plan.metrics.zoneViolations,
   radialViolations:plan.metrics.radialViolations,
   complete:plan.valid,
   area:measureRectArea(plan.snapshot.rects)
  }:null};
}
