// P1-ET-02 · Geometría exclusiva de 02 Compacto.
// La zona se obtiene del parentesco, no de enlaces transversales ni de 01.
// No modifica el grafo, los puertos ni el registro topológico.
export class CompactLayout {
 static compute({nodes,edges,metrics,sourcePositions,levels}) {
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const roots=nodes.filter(n=>n.parent==='p1').sort((a,b)=>
   (a.branch??0)-(b.branch??0)||a.id.localeCompare(b.id));
  const sectors=roots.map(n=>n.id),owner=new Map([['p1',null]]);
  const children=new Map(nodes.map(n=>[n.id,[]]));
  for(const n of nodes)if(children.has(n.parent))children.get(n.parent).push(n);
  const queue=[...roots];
  for(const r of roots)owner.set(r.id,r.id);
  for(let i=0;i<queue.length;i++){
   const n=queue[i],branch=owner.get(n.id);
   for(const child of children.get(n.id)||[]){
    if(owner.has(child.id))continue;
    owner.set(child.id,branch);queue.push(child);
   }
  }
  const unassigned=nodes.filter(n=>n.id!=='p1'&&!owner.has(n.id)).map(n=>n.id);
  const positions=new Map(),rects=new Map();
  const rect=(id,p)=>{
   const m=metrics.get(id);
   return {id,x:p.x,y:p.y,w:m.w,h:m.h,l:p.x-m.w/2,r:p.x+m.w/2,t:p.y-m.h/2,b:p.y+m.h/2};
  };
  const put=(id,p)=>{positions.set(id,p);rects.set(id,rect(id,p));};
  if(!byId.has('p1')||!metrics.has('p1'))
   return {mode:'02',positions,rects,levels:Object.fromEntries(levels),stats:{arms:roots.length,overlaps:0,unassigned:nodes.length,zoneValid:false}};
  put('p1',{x:0,y:0});
  const dimensions=[...metrics.values()];
  const stepX=Math.max(160,...dimensions.map(m=>m.w+34));
  const stepY=Math.max(88,...dimensions.map(m=>m.h+32));
  const nSectors=sectors.length,TAU=2*Math.PI;
  const half=nSectors?Math.PI/nSectors:Math.PI;
  const centers=new Map(sectors.map((id,i)=>[id,-Math.PI/2+(i+.5)*TAU/nSectors]));
  const margin=half>=Math.PI?0:Math.min(.06,half*.12);
  const core=rects.get('p1');
  const intersects=(a,b,pad=14)=>a.l<b.r+pad&&a.r>b.l-pad&&a.t<b.b+pad&&a.b>b.t-pad;
  const angleDelta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const isInside=(r,center)=>{
   const corners=[[r.l,r.t],[r.r,r.t],[r.r,r.b],[r.l,r.b]];
   if(half>=Math.PI)return true;
   return corners.every(([x,y])=>Math.abs(angleDelta(Math.atan2(y,x),center))<=half-margin);
  };
  const zoneCandidates=new Map();
  for(const id of sectors){
   const center=centers.get(id),c=Math.cos(center),s=Math.sin(center);
   const candidates=[];
   // Retícula global con cuadros sin girar; su recorte angular produce
   // sectores, no columnas heredadas ni anillos de radio fijo.
   // La malla global evita desperdiciar espacio al rotar cajas rectangulares.
   for(let ix=-35;ix<=35;ix++){
    for(let iy=-35;iy<=35;iy++){
     const p={x:(ix+(Math.abs(iy)%2)*.5)*stepX,y:iy*stepY};
     const r=rect(id,p);
     if(!isInside(r,center)||intersects(r,core,28))continue;
     candidates.push(p);
    }
   }
   candidates.sort((a,b)=>Math.hypot(a.x,a.y)-Math.hypot(b.x,b.y)||a.x-b.x||a.y-b.y);
   const number=nodes.filter(n=>n.id!== 'p1' && (owner.get(n.id)===id)).length;
   zoneCandidates.set(id,candidates.slice(0,Math.max(700,number*11)));
  }
  const adjacency=new Map(nodes.map(n=>[n.id,[]]));
  for(const e of edges)if(adjacency.has(e.from)&&adjacency.has(e.to)){
   adjacency.get(e.from).push(e.to);adjacency.get(e.to).push(e.from);
  }
  const used=new Map(sectors.map(id=>[id,new Set()]));
  const zoneRects=new Map(sectors.map(id=>[id,[]]));
  let optimizationMoves=0;
  for(const node of queue){
   const branch=owner.get(node.id),center=centers.get(branch);
   const pool=zoneCandidates.get(branch);
   if(!pool||!metrics.has(node.id))continue;
   const parent=positions.get(node.parent);
   const neighbors=(adjacency.get(node.id)||[]).map(id=>positions.get(id)).filter(Boolean);
   let best=null,bestScore=Infinity,bestIndex=-1;
   const usage=used.get(branch);
   for(let i=0;i<pool.length;i++){
    if(usage.has(i))continue;
    const p=pool[i],r=rect(node.id,p);
    if(!isInside(r,center))continue;
    let collision=false;
    if(intersects(r,core)){collision=true;}
    if(!collision)for(const existing of zoneRects.get(branch))if(intersects(r,existing)){collision=true;break;}
    if(collision)continue;
    const distance=(q)=>Math.abs(p.x-q.x)+Math.abs(p.y-q.y);
    // Coste aproximado ortogonal. La métrica definitiva se toma de las rutas reales.
    const parentCost=parent?distance(parent):0;
    const linkedCost=neighbors.reduce((sum,q)=>sum+distance(q),0);
    const score=parentCost*.9+linkedCost*.75+Math.hypot(p.x,p.y)*.18;
    if(score<bestScore-1e-6){
     best=p;bestScore=score;bestIndex=i;
    }
   }
   if(best){put(node.id,best);zoneRects.get(branch).push(rects.get(node.id));usage.add(bestIndex);optimizationMoves++;}
  }
  // Los términos de jerarquía indeterminada no adquieren una rama inventada.
  // Permanecen visibles en una zona de espera externa y se declaran sin asignación.
  if(unassigned.length){
   const bound=Math.max(0,...[...rects.values()].map(r=>Math.abs(r.x)+r.w));
   let x=bound+stepX*2,y=0;
   for(const id of unassigned)if(metrics.has(id)){
    const p={x,y};put(id,p);y+=stepY;
   }
  }
  let overlaps=0;
  const boxes=[...rects.values()];
  for(let i=0;i<boxes.length;i++)for(let j=0;j<i;j++)
   if(intersects(boxes[i],boxes[j]))overlaps++;
  const extent=boxes.length?{
   minX:Math.min(...boxes.map(r=>r.l)),maxX:Math.max(...boxes.map(r=>r.r)),
   minY:Math.min(...boxes.map(r=>r.t)),maxY:Math.max(...boxes.map(r=>r.b))
  }:null;
  const area=extent?(extent.maxX-extent.minX)*(extent.maxY-extent.minY):0;
  const zoneValid=unassigned.length===0&&positions.size===nodes.length&&overlaps===0&&
   queue.every(node=>positions.has(node.id)&&isInside(rects.get(node.id),centers.get(owner.get(node.id))));
  const proxyLength=edges.reduce((sum,e)=>{
   const a=positions.get(e.from),b=positions.get(e.to);
   return sum+(a&&b?Math.abs(a.x-b.x)+Math.abs(a.y-b.y):0);
  },0);
  return {mode:'02',positions,rects,levels:Object.fromEntries(levels),
   stats:{mode:'02',nodes:positions.size,arms:nSectors,unassigned,zoneValid,overlaps,
    area,proxyLength,placements:optimizationMoves,
    metric:'zonas J1 + proximidad ortogonal; validar longitud de rutas reales',
    sectorCenters:Object.fromEntries(centers),radiusByLevel:null}};
 }
}
