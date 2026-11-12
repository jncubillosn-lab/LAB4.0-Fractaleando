// Diagnóstico de metas geométricas de P1-ET-02.
// NO transforma rutas, NO inventa pertenencias; solo mide un checkpoint
// topológicamente certificado. Los sectores quedan fijados por el orden
// angular de los J1 originales, permitiendo anchuras distintas.
const TAU=2*Math.PI,EPS=1e-8;
const norm=a=>(a%TAU+TAU)%TAU;
const dist=(a,b)=>Math.abs(Math.atan2(Math.sin(a-b),Math.cos(a-b)));
function hierarchy(nodes,j0Id){
 const byId=new Map(nodes.map(n=>[n.id,n]));
 if(byId.size!==nodes.length||!byId.has(j0Id))
  return {valid:false,reason:'No hay J0 único o existen ID duplicados'};
 const depths=new Map([[j0Id,0]]),owners=new Map([[j0Id,null]]),visiting=new Set();
 function follow(id){
  if(depths.has(id))return true;
  const n=byId.get(id);
  if(!n||!n.parent||!byId.has(n.parent)||visiting.has(id))return false;
  visiting.add(id);
  if(!follow(n.parent)){visiting.delete(id);return false;}
  visiting.delete(id);
  depths.set(id,depths.get(n.parent)+1);
  owners.set(id,n.parent===j0Id?id:owners.get(n.parent));
  return true;
 }
 if(nodes.some(n=>!follow(n.id)))
  return {valid:false,reason:'Hay conceptos huérfanos o ciclos de parentesco'};
 const roots=nodes.filter(n=>n.parent===j0Id).sort((a,b)=>
  (a.branch??0)-(b.branch??0)||a.id.localeCompare(b.id));
 if(!roots.length)return {valid:false,reason:'J0 no tiene J1'};
 return {valid:true,roots,owners,depths};
}
export function referenceSectors({nodes,positions,j0Id='p1'}){
 const ps=positions instanceof Map?positions:new Map(positions||[]),
  tree=hierarchy(nodes,j0Id),origin=ps.get(j0Id);
 if(!tree.valid||!origin)return {valid:false,reason:tree.reason||'Origen ausente'};
 const anchors=tree.roots.map((n,i)=>{
  const p=ps.get(n.id);
  if(!p)return null;
  return {id:n.id,angle:norm(Math.atan2(p.y-origin.y,p.x-origin.x)),
   index:i};
 });
 if(anchors.some(a=>!a))return {valid:false,reason:'Posiciones J1 incompletas'};
 anchors.sort((a,b)=>a.angle-b.angle);
 const sectors={};
 const count=anchors.length;
 if(count===1){
  sectors[anchors[0].id]={start:0,end:TAU,center:anchors[0].angle,
   width:TAU};
 }else{
  const angles=anchors.map(a=>a.angle);
  let largestGap=0;
  for(let i=0;i<count;i++){
   const gap=norm(angles[(i+1)%count]-angles[i]);
   largestGap=Math.max(largestGap,gap);
  }
  // Si varios J1 apuntan exactamente igual, el sistema no inventa
  // pertenencias: utiliza el orden estable para repartir sectores iniciales.
  if(largestGap>=TAU-1e-6){
   const ordered=[...tree.roots],increment=TAU/count;
   ordered.forEach((root,i)=>{
    const center=norm(-Math.PI/2+increment*i);
    sectors[root.id]={start:norm(center-increment/2),
     end:norm(center+increment/2),center,width:increment};
   });
  }else for(let i=0;i<count;i++){
   const previous=anchors[(i-1+count)%count],a=anchors[i],
    next=anchors[(i+1)%count];
   const start=norm(previous.angle+norm(a.angle-previous.angle)/2);
   const end=norm(a.angle+norm(next.angle-a.angle)/2);
   sectors[a.id]={start,end,center:a.angle,width:norm(end-start)};
  }
 }
 return {valid:true,sectors,roots:tree.roots.map(n=>n.id),
  owners:tree.owners,depths:tree.depths,j0Id};
}
export function analyzeCompactObjectives({nodes,positions,rects,edges=[],
 sectors=null,j0Id='p1'}){
 const ps=positions instanceof Map?positions:new Map(positions||[]),
  rm=rects instanceof Map?rects:new Map(rects||[]);
 const tree=hierarchy(nodes,j0Id),origin=ps.get(j0Id);
 if(!tree.valid||!origin)return {valid:false,reason:tree.reason||'Falta J0'};
 const sectorRef=sectors||referenceSectors({nodes,positions:ps,j0Id});
 if(!sectorRef.valid)return {valid:false,reason:sectorRef.reason};
 let zonePenalty=0,zoneViolations=0;
 const zoneByArm={};
 const radiusBands=new Map(),radiusById=new Map(),errors=[];
 for(const n of nodes){
  const p=ps.get(n.id),r=rm.get(n.id),level=tree.depths.get(n.id);
  if(!p||!r||!Number.isFinite(p.x+p.y+r.w+r.h)){errors.push(n.id);continue;}
  const radius=Math.hypot(p.x-origin.x,p.y-origin.y);
  radiusById.set(n.id,radius);
  if(!radiusBands.has(level))radiusBands.set(level,[]);
  radiusBands.get(level).push({id:n.id,radius});
  if(n.id===j0Id)continue;
  const owner=tree.owners.get(n.id),sector=sectorRef.sectors[owner];
  if(!sector){errors.push(n.id);continue;}
  const corners=[
   {x:p.x-r.w/2,y:p.y-r.h/2},
   {x:p.x+r.w/2,y:p.y-r.h/2},
   {x:p.x+r.w/2,y:p.y+r.h/2},
   {x:p.x-r.w/2,y:p.y+r.h/2}
  ];
  let error=0;
  if(sector.width<TAU-1e-8)for(const c of corners){
   const angle=norm(Math.atan2(c.y-origin.y,c.x-origin.x)),
    relative=norm(angle-sector.start);
   if(relative>sector.width+1e-9){
    error=Math.max(error,Math.min(dist(angle,sector.start),
     dist(angle,sector.end)));
   }
  }
  if(error>1e-9)zoneViolations++;
  const errorDeg=error*180/Math.PI;
  zonePenalty+=errorDeg;
  const detail=zoneByArm[owner]||{count:0,violations:0,penaltyDeg:0};
  detail.count++;detail.violations+=Number(error>1e-9);
  detail.penaltyDeg+=errorDeg;
  zoneByArm[owner]=detail;
 }
 const radialBands=[...radiusBands].sort(([a],[b])=>a-b)
  .map(([level,records])=>({
   level,count:records.length,min:Math.min(...records.map(x=>x.radius)),
   max:Math.max(...records.map(x=>x.radius)),
   minId:records.reduce((a,b)=>a.radius<b.radius?a:b).id,
   maxId:records.reduce((a,b)=>a.radius>b.radius?a:b).id
  }));
 let radialPenalty=0,radialViolations=0;
 for(let i=1;i<radialBands.length;i++){
  const a=radialBands[i-1],b=radialBands[i],
   deficit=Math.max(0,a.max+0.01-b.min);
  radialPenalty+=deficit;
  if(deficit>0)radialViolations++;
 }
 const j1=radialBands.find(r=>r.level===1);
 let parentDistance=0,parentEdges=0;
 for(const n of nodes)if(n.parent&&ps.has(n.parent)&&ps.has(n.id)){
  parentDistance+=Math.hypot(ps.get(n.id).x-ps.get(n.parent).x,
   ps.get(n.id).y-ps.get(n.parent).y);parentEdges++;
 }
 const centerManhattan=edges.reduce((sum,e)=>{
  const a=ps.get(e.from),b=ps.get(e.to);
  return !a||!b?Infinity:sum+Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 },0);
 return {valid:errors.length===0&&radialBands.length>0,
  errors,arms:tree.roots.length,zoneValid:zoneViolations===0,
  zonePenalty,zoneViolations,zoneByArm,radialValid:radialViolations===0,
  radialPenalty,radialViolations,radialBands,
  j1MaxRadius:j1?.max||0,parentDistance,parentEdges,
  centerManhattan,regions:sectorRef.sectors,
  levels:Object.fromEntries(tree.depths),owners:Object.fromEntries(tree.owners)};
}
