import {translateWholePlane} from './AmbientIsotopy.js';
import {captureEmbeddedTopology,compareEmbeddedTopology} from './EmbeddedTopology.js';
import {TopologyRegister} from '../core/TopologyRegister.js';
import {planCertifiedCompact02} from './CertifiedMovePlanner.js';

// 02 SOLO puede transformar la inmersión íntegra de 01.
// Nunca calcula conexiones nuevas. El planificador únicamente solicita
// homeomorfismos probados y audita independientemente cada checkpoint.
export function computeCertified02(input){
 const {nodes,edges,positions,rects,routes,reference}=input;
 const fail=(reason,details={})=>({
  certified:false,valid:false,topologyPreserved:false,reason,...details
 });
 if(!TopologyRegister.validShape(reference)||reference.pending.length)
  return fail('01 carece de una firma topológica íntegra');
 const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
 const keys=edges.map(edgeKey);
 if(keys.length!==reference.edges.length||
  keys.some(k=>!reference.edges.includes(k)))
  return fail('Los vínculos no coinciden exactamente con el registro de 01');
 const original={nodes,edges,positions:new Map(positions),
  rects:new Map(rects),routes:new Map(routes)};
 const initial=captureEmbeddedTopology(original);
 if(!initial.valid||initial.audit.drawn!==edges.length)
  return fail('El plano inicial no supera la auditoría independiente',
   {audit:initial.audit,issues:initial.problems});
 const originalPairs=new Map(reference.crossings.map(c=>[c.a+'|'+c.b,c.count])),
  independentPairs=new Map(initial.signature.crossings.map(c=>[c.a+'|'+c.b,c.count]));
 if(originalPairs.size!==independentPairs.size||
  [...originalPairs].some(([k,v])=>independentPairs.get(k)!==v))
  return fail('La firma independiente contradice los cruces oficiales de 01',
   {audit:initial.audit,issues:['Pares o multiplicidades diferentes']});
 const origin=original.positions.get('p1');
 if(!origin)return fail('J0 carece de posición');
 const centered=translateWholePlane(original,-origin.x,-origin.y);
 if(!centered.valid)return fail('No pudo recentrarse J0: '+centered.reason);
 const centeredAudit=captureEmbeddedTopology(centered.snapshot),
  centeredReport=compareEmbeddedTopology(initial.signature,centeredAudit.signature);
 if(!centeredAudit.valid||!centeredReport.valid)
  return fail('El recentrado no conserva el registro original de 01',
   {issues:[...centeredAudit.problems,...centeredReport.issues]});
 const plan=planCertifiedCompact02({
  snapshot:centered.snapshot,
  initialSignature:initial.signature,
  maxHubMoves:input.maxHubMoves??4,
  maxSectorMoves:input.maxSectorMoves??10,
  maxRadialMoves:input.maxRadialMoves??3,
  maxProposals:input.maxProposals??24000,
  allowAxisCompression:true
 });
 if(!plan.certified||!plan.topologyPreserved||!plan.snapshot)
  return fail(plan.reason||'El planificador no certificó la topología',
   {issues:plan.failures});
 const final=plan.topology,verified=compareEmbeddedTopology(
  initial.signature,final.signature);
 if(!verified.valid||!final.valid||final.audit.drawn!==edges.length)
  return fail('La última auditoría de topología falló',
   {issues:[...verified.issues,...final.problems]});
 const snap=plan.snapshot,m=plan.metrics;
 const initLength=plan.initialLength;
 const steps=[
  {kind:'global-translation',id:'p1',dx:-origin.x,dy:-origin.y,
   certificate:'global-translation',bound:0,
   members:nodes.length,crossings:initial.audit.crossings},
  ...plan.moves.map(move=>({...move,
   kind:move.phase==='corridor'?'axis-warp':'local'}))
 ];
 const valid=plan.valid&&plan.sectorValid&&plan.radialValid&&
  plan.lengthValid&&verified.valid;
 const firstBand=m.radialBands.find(x=>x.level===1),
  nextBand=m.radialBands.find(x=>x.level===2);
 return {
  certified:true,topologyPreserved:true,valid,
  sectorValid:plan.sectorValid,radialValid:plan.radialValid,
  lengthValid:plan.lengthValid,
  reason:valid?'Las cuatro normas de 02 están verificadas':
   'Topología conservada. Organización geométrica aún en revisión.',
  steps,rejections:plan.failures,positions:[...snap.positions],
  rects:[...snap.rects],routes:[...snap.routes],
  levels:m.levels,audit:final.audit,report:verified,
  crossingEvents:final.events,
  stats:{mode:'02',nodes:nodes.length,arms:m.arms,
   sourceCrossings:initial.audit.crossings,crossings:final.audit.crossings,
   sourceRouteLength:initLength,routeLength:plan.routeLength,
   reductionPercent:(initLength-plan.routeLength)/initLength*100,
   radialValid:m.radialValid,radialBands:m.radialBands,
   radialPenalty:m.radialPenalty,radialViolations:m.radialViolations,
   sectorValid:m.zoneValid,zonePenalty:m.zonePenalty,
   zoneViolations:m.zoneViolations,zoneByArm:m.zoneByArm,
   j1MaxRadius:m.j1MaxRadius,j2MinRadius:nextBand?.min??null,
   firstRingValid:Boolean(firstBand&&nextBand&&firstBand.max<nextBand.min),
   topologyIssues:verified.issueCount,graphComplete:true,
   preservedTopology:true,certifiedMoves:plan.moves.length,
   certifiedSteps:steps.length,proposals:plan.stats.proposed,
   plannerMs:plan.stats.elapsedMs,planTimeline:plan.timeline,
   area:null}
 };
}
