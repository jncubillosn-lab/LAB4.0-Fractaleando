import {analyzeRadialHierarchy} from './RadialHierarchy.js';

// Transformación candidata por crecimiento angular: no contiene rutas
// reconstruidas ni se promueve a 02 sin certificación topológica de 01.
// Un sector por J1, bandas Jn variables, sin imponer radio idéntico.
export function computeAngularGrowth({nodes,edges=[],rects,positions,j0Id='p1',
 clearance=14,sectorPadding=.045,radialStep=76,angularStep=.065}){
 const sourceRects=rects instanceof Map?rects:new Map(rects);
 const sourcePositions=positions instanceof Map?positions:new Map(positions);
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const roots=nodes.filter(n=>n.parent===j0Id).sort((a,b)=>
  (a.branch??0)-(b.branch??0)||a.id.localeCompare(b.id));
 const failures=[],levels=new Map([[j0Id,0]]),owners=new Map([[j0Id,null]]),visiting=new Set();
 const walk=id=>{
  if(levels.has(id))return levels.get(id);
  const n=byId.get(id);
  if(!n||!n.parent||!byId.has(n.parent)||visiting.has(id))return null;
  visiting.add(id);
  const up=walk(n.parent);
  visiting.delete(id);
  if(up===null)return null;
  levels.set(id,up+1);
  owners.set(id,n.parent===j0Id?id:owners.get(n.parent));
  return up+1;
 };
 for(const n of nodes)if(walk(n.id)===null)failures.push('Jerarquía incompleta: '+n.id);
 if(failures.length)return {valid:false,reason:failures.join('; ')};
 const origin=sourcePositions.get(j0Id),core=sourceRects.get(j0Id);
 if(!origin||!core)return {valid:false,reason:'Falta J0 o su geometría'};
 const count=roots.length;
 if(!count)return {valid:false,reason:'J0 no tiene ramas J1'};
 const tau=Math.PI*2,span=tau/count;
 const sectorCenters=new Map(roots.map((r,i)=>
  [r.id,-5*Math.PI/6+i*span]));
 // Cada caja entera debe quedar en el sector: margen según su tamaño y radio.
 const output=new Map([[j0Id,{x:0,y:0}]]),
  placed=new Map([[j0Id,{...core,x:0,y:0,l:-core.w/2,r:core.w/2,
   t:-core.h/2,b:core.h/2}]]);
 const rectAt=(id,x,y)=>{
  const r=sourceRects.get(id);
  return {...r,x,y,l:x-r.w/2,r:x+r.w/2,t:y-r.h/2,b:y+r.h/2};
 };
 const overlap=(a,b,pad=clearance)=>
  a.l<b.r+pad&&a.r>b.l-pad&&a.t<b.b+pad&&a.b>b.t-pad;
 const withinSector=(rect,center)=>{
  const points=[[rect.l,rect.t],[rect.l,rect.b],[rect.r,rect.t],[rect.r,rect.b]];
  for(const [x,y] of points){
   const angle=Math.atan2(y,x);
   const delta=Math.atan2(Math.sin(angle-center),Math.cos(angle-center));
   if(Math.abs(delta)>=span/2-sectorPadding)return false;
  }
  return true;
 };
 const measure=(n,p,parent,theta)=>{
  const q=output.get(n.parent);
  const center=sectorCenters.get(owners.get(n.id));
  const delta=Math.atan2(Math.sin(theta-center),Math.cos(theta-center));
  const degree=levels.get(n.id);
  const src=sourcePositions.get(n.id),root=sourcePositions.get(owners.get(n.id));
  // Orden angular aproximado de la distribución vertical de 01.
  const sourceV=(src?.y??0)-(root?.y??0);
  const ordering=parent.y<0?-1:1;
  return Math.hypot(p.x-q.x,p.y-q.y)+
   Math.abs(delta)*Math.max(0,degree-1)*6+
   Math.max(0,sourceV)*.000002*ordering;
 };
 const maxDepth=Math.max(...levels.values());
 const depthStats=[];
 let prevMax=0;
 for(let depth=1;depth<=maxDepth;depth++){
  const layer=nodes.filter(n=>levels.get(n.id)===depth);
  const layerStart=depth===1?
   Math.max(Math.max(core.w,core.h)/2+190,
    Math.max(...roots.map(n=>Math.max(sourceRects.get(n.id)?.w||0,
     sourceRects.get(n.id)?.h||0)))/(2*Math.sin(Math.PI/count))+clearance+20)
    :prevMax+Math.max(90,clearance+85);
  // Las restricciones entre jerarquías deben ser estrictas, pero no
  // obligan a poner todos los miembros de un nivel en el mismo radio.
  let layerMax=0;
  for(const root of roots){
   const group=layer.filter(n=>owners.get(n.id)===root.id);
   if(!group.length)continue;
   group.sort((a,b)=>{
    const ay=sourcePositions.get(a.id)?.y??0,by=sourcePositions.get(b.id)?.y??0;
    return ay-by||a.id.localeCompare(b.id);
   });
   for(const n of group){
    const parent=output.get(n.parent),parentRect=placed.get(n.parent);
    const r=sourceRects.get(n.id);
    if(!r||!parent||!parentRect){
     failures.push('Posición o padre faltante: '+n.id);continue;
    }
    const center=sectorCenters.get(root.id);
    const parentTheta=Math.atan2(parent.y,parent.x);
    const preferred=depth===1?center:parentTheta;
    let best=null;
    const ringMax=layerStart+Math.max(12,Math.ceil(group.length/5))*radialStep;
    // En profundidad 1 se colocan los J1 a la misma distancia mínima
    // de J0 (no impone igualdad a niveles posteriores).
    const radialOptions=depth===1?[layerStart]:Array.from(
     {length:Math.ceil((ringMax-layerStart)/radialStep)+1},
     (_,i)=>layerStart+i*radialStep);
    for(const radius of radialOptions){
     const offsets=depth===1?[0]:Array.from(
      {length:Math.floor((span-2*sectorPadding)/angularStep)+1},
      (_,i)=>-span/2+sectorPadding+i*angularStep);
     const angles=offsets.map(offset=>center+offset)
      .sort((a,b)=>Math.abs(Math.atan2(Math.sin(a-preferred),Math.cos(a-preferred)))-
       Math.abs(Math.atan2(Math.sin(b-preferred),Math.cos(b-preferred))));
     for(const angle of angles){
      const p={x:radius*Math.cos(angle),y:radius*Math.sin(angle)};
      const rect=rectAt(n.id,p.x,p.y);
      if(!withinSector(rect,center))continue;
      let blocked=false;
      for(const other of placed.values())if(overlap(rect,other)){blocked=true;break;}
      if(blocked)continue;
      const cost=measure(n,p,parent,angle)+radius*.19;
      if(!best||cost<best.cost)best={p,rect,radius,cost};
     }
     // Examinar algunos radios adyacentes para equilibrar cercanía
     // padre-hijo y anchura radial sin buscar de forma ilimitada.
     if(best&&radius>best.radius+2*radialStep)break;
    }
    if(!best){failures.push('No cabe en la banda '+depth+': '+n.id);continue;}
    output.set(n.id,best.p);placed.set(n.id,best.rect);
    layerMax=Math.max(layerMax,best.radius);
   }
  }
  if(failures.length)break;
  depthStats.push({depth,count:layer.length,start:layerStart,max:layerMax});
  prevMax=layerMax;
 }
 const radial=analyzeRadialHierarchy({nodes,positions:output,j0Id});
 const zones=[...owners].filter(([id])=>id!==j0Id)
  .every(([id,owner])=>withinSector(placed.get(id),sectorCenters.get(owner)));
 const all=[...placed.values()];
 let overlaps=0;for(let i=0;i<all.length;i++)for(let j=0;j<i;j++)
  if(overlap(all[i],all[j],0))overlaps++;
 let proxyLength=0;
 for(const n of nodes)if(n.parent&&output.has(n.id)&&output.has(n.parent)){
  const a=output.get(n.id),b=output.get(n.parent);
  proxyLength+=Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 }
 const centerManhattan=edges.reduce((sum,e)=>{
  const a=output.get(e.from),b=output.get(e.to);
  return !a||!b?Infinity:sum+Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 },0);
 const sourceCenterManhattan=edges.reduce((sum,e)=>{
  const a=sourcePositions.get(e.from),b=sourcePositions.get(e.to);
  return !a||!b?Infinity:sum+Math.abs(a.x-b.x)+Math.abs(a.y-b.y);
 },0);
 return {valid:!failures.length&&radial.valid&&zones&&overlaps===0,
  positions:[...output],rects:[...placed],levels:Object.fromEntries(levels),
  stats:{nodes:output.size,arms:count,radialValid:radial.valid,
   radialBands:radial.summary,radialViolations:radial.violations,
   sectorsValid:zones,sectorCenters:Object.fromEntries(sectorCenters),
   overlaps,depthStats,proxyLength,centerManhattan,
   sourceCenterManhattan,unplaced:failures,
   closestJ1:depthStats[0]?.start??null}};
}
