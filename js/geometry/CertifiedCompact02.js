import {applyCertifiedPatch,translateWholePlane} from './AmbientIsotopy.js';
import {captureEmbeddedTopology,compareEmbeddedTopology} from './EmbeddedTopology.js';
import {TopologyRegister} from '../core/TopologyRegister.js';

// P1-ET-02 · Solo se parte de 01 íntegro. Cada desplazamiento solicitado
// se aplica a TODA la inmersión; nunca se llama al enrutador.
// Es una etapa de prueba del motor, no una solución radial terminada.
export function computeCertified02(input){
 const {nodes,edges,positions,rects,routes,reference,maxMoves=4}=input;
 const failure=(reason,details={})=>({
  certified:false,valid:false,topologyPreserved:false,
  reason,...details
 });
 if(!TopologyRegister.validShape(reference)||reference.pending.length)
  return failure('01 no tiene un registro topológico íntegro');
 const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
 const keys=edges.map(edgeKey),expected=reference.edges;
 if(keys.length!==expected.length||
  keys.some(k=>!expected.includes(k)))
  return failure('El grafo difiere del checkpoint protegido de 01');
 const original={
  nodes,edges,positions:new Map(positions),rects:new Map(rects),
  routes:new Map(routes)
 };
 const initial=captureEmbeddedTopology(original);
 if(!initial.valid||initial.audit.drawn!==edges.length)
  return failure('01 no supera la auditoría de inmersión general',
   {audit:initial.audit,issues:initial.problems});
 const originalPairs=new Map(reference.crossings.map(c=>[c.a+'|'+c.b,c.count]));
 const ownPairs=new Map(initial.signature.crossings.map(c=>[c.a+'|'+c.b,c.count]));
 if(originalPairs.size!==ownPairs.size||
  [...originalPairs].some(([k,v])=>ownPairs.get(k)!==v))
  return failure('El cálculo de cruces independiente discrepa del registro oficial de 01',
   {audit:initial.audit,expectedCrossings:reference.crossings.reduce((s,c)=>s+c.count,0)});
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const degree=new Map(nodes.map(n=>[n.id,0]));
 for(const e of edges){
  degree.set(e.from,(degree.get(e.from)||0)+1);
  degree.set(e.to,(degree.get(e.to)||0)+1);
 }
 const roots=nodes.filter(n=>n.parent==='p1').sort((a,b)=>
  (a.branch??0)-(b.branch??0)||a.id.localeCompare(b.id));
 const rootOf=id=>{
  let at=byId.get(id),seen=new Set();
  while(at?.parent&&at.parent!=='p1'&&!seen.has(at.id)){
   seen.add(at.id);at=byId.get(at.parent);
  }
  return at?.parent==='p1'?at.id:null;
 };
 const targets=[
  ...roots.map(n=>({...n,targetIds:nodes.filter(ch=>
   rootOf(ch.id)===n.id).map(ch=>ch.id)})),
  ...nodes.filter(n=>n.parent&&n.parent!=='p1')
   .sort((a,b)=>(degree.get(a.id)||0)-(degree.get(b.id)||0)||
     a.id.localeCompare(b.id))
   .map(n=>({...n,targetIds:[n.id]}))
 ];
 const len=rs=>{
  let total=0;
  for(const r of rs.values())for(let i=1;i<r.points.length;i++)
   total+=Math.hypot(r.points[i].x-r.points[i-1].x,
    r.points[i].y-r.points[i-1].y);
  return total;
 };
 const baselineLength=len(original.routes);
 const center=original.positions.get('p1');
 if(!center)return failure('J0 no tiene posición de origen');
 const centered=translateWholePlane(original,-center.x,-center.y);
 if(!centered.valid)return failure('No es posible recentrar J0: '+centered.reason);
 let current=centered.snapshot,cert=captureEmbeddedTopology(current);
 const centeredReport=compareEmbeddedTopology(initial.signature,cert.signature);
 if(!cert.valid||!centeredReport.valid)
  return failure('La traslación global no se pudo certificar',
   {issues:[...cert.problems,...centeredReport.issues].slice(0,10)});
 const steps=[{id:'p1',kind:'global-translation',dx:-center.x,dy:-center.y,
  maxLip:0,edgeCount:cert.audit.drawn,crossings:cert.audit.crossings,
  topologyIssues:centeredReport.issueCount,members:nodes.length}];
 const rejections=[];
 for(const node of targets){
  if(steps.filter(step=>step.kind==='local').length>=maxMoves)break;
  const p=current.positions.get(node.id),q=current.positions.get(node.parent);
  if(!p||!q)continue;
  const dx=q.x-p.x,dy=q.y-p.y;
  const axes=Math.abs(dx)>Math.abs(dy)?
   [{dx:Math.sign(dx)*8,dy:0},{dx:0,dy:Math.sign(dy)*8}]:
   [{dx:0,dy:Math.sign(dy)*8},{dx:Math.sign(dx)*8,dy:0}];
  let accepted=false;
  for(const displacement of axes){
   if(!displacement.dx&&!displacement.dy)continue;
   const trial=applyCertifiedPatch(current,{
    targetId:node.id,targetIds:node.targetIds,
    ...displacement,pad:24,shoulder:54
   });
   if(!trial.valid){
    rejections.push({id:node.id,reason:trial.reason});continue;
   }
   const audit=captureEmbeddedTopology(trial.snapshot);
   const report=compareEmbeddedTopology(initial.signature,audit.signature);
   if(!audit.valid||!report.valid||audit.audit.drawn!==edges.length){
    rejections.push({id:node.id,reason:'La auditoría independiente rechazó el movimiento',
     details:[...audit.problems,...report.issues].slice(0,4)});
    continue;
   }
   current=trial.snapshot;cert=audit;
   steps.push({id:node.id,kind:'local',dx:displacement.dx,dy:displacement.dy,
    members:node.targetIds.length,maxLip:trial.proof.bound,
    edgeCount:audit.audit.drawn,crossings:audit.audit.crossings,
    topologyIssues:report.issueCount});
   accepted=true;break;
  }
 }
 const topology=compareEmbeddedTopology(initial.signature,cert.signature);
 const currentLength=len(current.routes);
 const r0=current.positions.get('p1');
 const depths=new Map([['p1',0]]);
 const depth=id=>{
  if(depths.has(id))return depths.get(id);
  const n=byId.get(id);
  if(!n||!n.parent||!byId.has(n.parent))return null;
  const d=depth(n.parent);
  if(d===null)return null;
  depths.set(id,d+1);return d+1;
 };
 const bands=new Map();
 for(const n of nodes){
  const d=depth(n.id),p=current.positions.get(n.id);
  if(d===null||!p||!r0)continue;
  if(!bands.has(d))bands.set(d,[]);
  bands.get(d).push(Math.hypot(p.x-r0.x,p.y-r0.y));
 }
 const radialBands=[...bands].sort(([a],[b])=>a-b).map(([level,values])=>({
  level,count:values.length,min:Math.min(...values),max:Math.max(...values)}));
 const radialValid=radialBands.every((b,i)=>i===0||b.min>radialBands[i-1].max);
 const completed=topology.valid&&cert.valid&&steps.some(step=>step.kind==='local');
 return {
  certified:completed,topologyPreserved:topology.valid,
  // La prioridad topológica sola no equivale a validar toda 02.
  valid:false,radialValid,sectorValid:false,lengthValid:currentLength<baselineLength,
  reason:completed?
   'Isotopía ambiental certificada. El diseño radial completo de 02 sigue pendiente.':
   'No se encontró un movimiento ambiental certificable',
  steps,rejections:rejections.slice(0,12),
  positions:[...current.positions],rects:[...current.rects],
  routes:[...current.routes],levels:Object.fromEntries(depths),
  audit:cert.audit,report:topology,
  crossingEvents:cert.events,
  stats:{mode:'02',nodes:nodes.length,arms:roots.length,
   sourceCrossings:initial.audit.crossings,crossings:cert.audit.crossings,
   sourceRouteLength:baselineLength,routeLength:currentLength,
   radialValid,radialBands,sectorValid:false,
   certifiedMoves:steps.filter(step=>step.kind==='local').length,
   certifiedSteps:steps.length,topologyIssues:topology.issueCount,
   graphComplete:cert.audit.drawn===edges.length,
   preservedTopology:topology.valid}
 };
}
