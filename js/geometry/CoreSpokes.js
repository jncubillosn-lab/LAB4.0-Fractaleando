// EXP-02-B: primer correctivo geométrico real de J0 -> J1.
// Antes de aplicar orientación a ramas completas, acercar los tres J1
// sin usar separación artificial entre sectores. Ninguna ruta del
// resto del grafo cambia silenciosamente; cada candidata requiere DRC
// y TopologyRegister.compareEmbedding contra la firma ORIGINAL de 01.
export function proposeNearCoreSpokes({
 nodes,edges,positions,rects,routes,edgeKey,router,
 margins=[48,80,120]
}){
 const ps=new Map(positions),rr=new Map(rects),rs=new Map(routes);
 const core=ps.get('p1'),rootRect=rr.get('p1');
 if(!core||!rootRect)return {reason:'Falta J0',candidates:[]};
 const roots=nodes.filter(n=>n.parent==='p1')
  .sort((a,b)=>ps.get(a.id).x-ps.get(b.id).x);
 const num=roots.length;
 if(num===0)return {reason:'Sin términos J1',candidates:[]};
 const originalOrdered=edges.map((e,i)=>({...e,__index:i}));
 const candidates=[];
 const allEdges=new Map(edges.map(e=>[edgeKey(e),e]));
 for(const margin of margins){
  const targetPositions=new Map(ps),targetRects=new Map(rr);
  const size=Math.max(...roots.map(n=>rr.get(n.id).w));
  const spacing=size+margin;
  for(let i=0;i<num;i++){
   const root=roots[i],id=root.id,original=ps.get(id),r=rr.get(id);
   // Para tres ramas: una izquierda, una en línea con el núcleo,
   // y otra a la derecha. No se congela esta fórmula en la norma.
   const x=core.x+(i-(num-1)/2)*spacing;
   const y=original.y;
   targetPositions.set(id,{x,y});
   targetRects.set(id,{...r,x,y,l:x-r.w/2,r:x+r.w/2,
    t:y-r.h/2,b:y+r.h/2});
  }
  const moved=new Set(roots.filter(n=>ps.get(n.id).x!==targetPositions.get(n.id).x).map(n=>n.id));
  const changed=edges.filter(e=>moved.has(e.from)||moved.has(e.to));
  const unchanged=edges.filter(e=>!moved.has(e.from)&&!moved.has(e.to));
  const staged=new Map(unchanged.map(e=>[edgeKey(e),rs.get(edgeKey(e))]));
  const occupied=[];
  for(const e of unchanged){
   const r=staged.get(edgeKey(e));
   if(Array.isArray(r?.points))occupied.push(...router.allSegments(r.points));
  }
  const rectArray=[...targetRects.values()];
  const sorted=changed.sort((a,b)=>
   (a.from==='p1'||a.to==='p1'?-1:0)-
   (b.from==='p1'||b.to==='p1'?-1:0)||
   a.from.localeCompare(b.from)||a.to.localeCompare(b.to));
  let missing=0;
  for(const e of sorted){
   const key=edgeKey(e),old=rs.get(key);
   if(!old?.points){missing++;continue;}
   const remap=(id,port)=>{
    if(!moved.has(id))return {...port,id};
    const before=ps.get(id),after=targetPositions.get(id);
    const dx=after.x-before.x,dy=after.y-before.y;
    return {...port,id,x:port.x+dx,y:port.y+dy,sx:port.sx+dx,sy:port.sy+dy};
   };
   const from=remap(e.from,old.fromPort),to=remap(e.to,old.toPort);
   const blocked=rectArray.filter(r=>r.id!==e.from&&r.id!==e.to);
   // El algoritmo existente realiza búsqueda Manhattan y comprueba DRC;
   // no sustituye los puertos por otros ni altera los vínculos.
   const routed=router.routeEdge(from,to,blocked,occupied);
   if(!routed?.points){missing++;continue;}
   const next={...old,points:routed.points,fromPort:from,toPort:to};
   staged.set(key,next);
   occupied.push(...router.allSegments(next.points));
  }
  candidates.push({kind:'near-core',margin,
   ps:targetPositions,rr:targetRects,rs:staged,
   pending:missing,moved:[...moved],
   j1:[...roots].map(n=>({
    id:n.id,
    radius:Math.hypot(targetPositions.get(n.id).x-core.x,targetPositions.get(n.id).y-core.y)
   }))});
 }
 return {candidates,reason:null};
}
