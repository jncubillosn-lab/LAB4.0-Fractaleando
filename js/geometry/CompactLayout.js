// 02 · Compactación de bloques: sin restricciones de coordenadas X/Y globales.
// Conserva identidad de cada término, pertenencia jerárquica y orden local
// de descendientes. La geometría se valida posteriormente por el motor PCB.
export class CompactLayout {
 static rect(id,p,m){
  return {id,x:p.x,y:p.y,w:m.w,h:m.h,l:p.x-m.w/2,r:p.x+m.w/2,t:p.y-m.h/2,b:p.y+m.h/2};
 }
 static bounds(ids,positions,metrics){
  const b={l:Infinity,r:-Infinity,t:Infinity,b:-Infinity};
  for(const id of ids){
   const p=positions.get(id),m=metrics.get(id);
   if(!p||!m)continue;
   b.l=Math.min(b.l,p.x-m.w/2);b.r=Math.max(b.r,p.x+m.w/2);
   b.t=Math.min(b.t,p.y-m.h/2);b.b=Math.max(b.b,p.y+m.h/2);
  }
  if(!Number.isFinite(b.l))return {l:0,r:0,t:0,b:0,w:0,h:0,area:0};
  return {...b,w:b.r-b.l,h:b.b-b.t,area:(b.r-b.l)*(b.b-b.t)};
 }
 static overlaps(positions,metrics,padding=15){
  const ids=[...positions.keys()],boxes=ids.map(id=>CompactLayout.rect(id,positions.get(id),metrics.get(id)));
  let count=0;
  for(let i=0;i<boxes.length;i++)for(let j=0;j<i;j++){
   const a=boxes[i],b=boxes[j];
   if(a.l<b.r+padding&&a.r>b.l-padding&&a.t<b.b+padding&&a.b>b.t-padding)count++;
  }
  return count;
 }
 static length(edges,positions){
  return edges.reduce((sum,e)=>{
   const a=positions.get(e.from),b=positions.get(e.to);
   return sum+(a&&b?Math.hypot(a.x-b.x,a.y-b.y):0);
  },0);
 }
 static miniTree(rootId,allowed,byId,mm,source){
  const children=new Map();
  for(const id of allowed){
   const n=byId.get(id);
   if(n?.parent&&allowed.has(n.parent)){
    if(!children.has(n.parent))children.set(n.parent,[]);
    children.get(n.parent).push(id);
   }
  }
  for(const group of children.values())group.sort((a,b)=>
   (source.get(a)?.y??0)-(source.get(b)?.y??0)||a.localeCompare(b));
  const seen=new Set();
  function place(id){
   if(seen.has(id))return null;
   seen.add(id);
   const measure=mm.get(id);if(!measure)return null;
   const pieces=(children.get(id)||[]).map(place).filter(Boolean);
   if(!pieces.length){
    return {w:measure.w,h:measure.h,
     positions:new Map([[id,{x:measure.w/2,y:measure.h/2}]])};
   }
   const pad=72,spaceY=105;
   const area=pieces.reduce((sum,p)=>sum+(p.w+pad)*(p.h+pad),0);
   const target=Math.max(measure.w+pad,Math.sqrt(area)*1.22,
    Math.max(...pieces.map(p=>p.w)));
   let x=0,y=0,rowH=0,maxW=0;
   const positions=new Map(),childrenOffsets=[];
   for(const child of pieces){
    if(x>0&&x+child.w>target){x=0;y+=rowH+pad;rowH=0;}
    childrenOffsets.push({child,x,y});
    x+=child.w+pad;maxW=Math.max(maxW,x-pad);
    rowH=Math.max(rowH,child.h);
   }
   const width=Math.max(maxW,measure.w),height=measure.h+spaceY+y+rowH;
   const dx=(width-maxW)/2;
   positions.set(id,{x:width/2,y:measure.h/2});
   for(const {child,x,y} of childrenOffsets)
    for(const [key,p] of child.positions)
     positions.set(key,{x:dx+x+p.x,y:measure.h+spaceY+y+p.y});
   return {w:width,h:height,positions};
  }
  const first=place(rootId);
  // Nodos sin jerarquía de parentesco recuperable conservan lugar propio.
  const local=new Map(first?.positions||[]);
  let cursor=first?.w||0;
  for(const id of allowed)if(!local.has(id)){
   const m=mm.get(id);if(!m)continue;
   local.set(id,{x:cursor+m.w/2,y:m.h/2});cursor+=m.w+72;
  }
  return local;
 }
 static groups(nodes,source){
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const roots=nodes.filter(n=>n.parent==='p1')
   .sort((a,b)=>(source.get(a.id)?.x??0)-(source.get(b.id)?.x??0)||a.id.localeCompare(b.id));
  const branchByNode=new Map(),moduleByNode=new Map();
  for(const n of nodes){
   if(n.id==='p1')continue;
   const chain=[],visited=new Set();let curr=n;
   while(curr&&curr.id!=='p1'&&!visited.has(curr.id)){
    visited.add(curr.id);chain.unshift(curr.id);curr=byId.get(curr.parent);
   }
   const connected=curr?.id==='p1'&&chain.length;
   const branch=connected?chain[0]:'orphan';
   const module=connected?(chain[1]||chain[0]):'orphan';
   branchByNode.set(n.id,branch);moduleByNode.set(n.id,module);
  }
  const branches=new Map();
  for(const n of nodes)if(n.id!=='p1'){
   const branch=branchByNode.get(n.id),module=moduleByNode.get(n.id);
   if(!branches.has(branch))branches.set(branch,new Map());
   if(!branches.get(branch).has(module))branches.get(branch).set(module,[]);
   branches.get(branch).get(module).push(n.id);
  }
  return {branches,roots,branchByNode,moduleByNode};
 }
 static compute({nodes,edges,metrics,source}){
  const original=source instanceof Map?source:new Map(source);
  const mm=metrics instanceof Map?metrics:new Map(metrics);
  const positions=new Map();
  const ids=nodes.map(n=>n.id);
  const reference=CompactLayout.bounds(ids,original,mm);
  const root=original.get('p1')||{x:0,y:0};
  if(mm.has('p1'))positions.set('p1',{x:0,y:0});
  const {branches,roots,moduleByNode}=CompactLayout.groups(nodes,original);
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const branchBlocks=[];
  let modules=0;
  let innerFactorSum=0;
  const padding=68; // espacio para rutas y puertos exclusivos
  // Fase 1: conservar cada subárbol J2 como unidad geométrica y compactar
  // su tamaño interno mediante escalado homogéneo SIN reorganizar sus nodos.
  for(const [branchId,moduleMap] of branches){
   const blocks=[];
   for(const [moduleId,members] of moduleMap){
    if(moduleId===branchId&&branchId!=='orphan')continue; // J1 se coloca como puerto del bloque mayor.
    const local=CompactLayout.miniTree(moduleId,new Set(members),byId,mm,original);
    const bounds=CompactLayout.bounds(members,local,mm);
    const scale=1;const center={y:original.get(moduleId)?.y??0};
    blocks.push({id:moduleId,members,local,bounds,w:bounds.w,h:bounds.h,
     sourceY:center.y,scale});
    innerFactorSum+=scale;modules++;
   }
   // A falta de descendientes J2, J1 forma un bloque independiente.
   blocks.sort((a,b)=>a.sourceY-b.sourceY||a.id.localeCompare(b.id));
   const total=blocks.reduce((s,b)=>s+(b.w+padding)*(b.h+padding),0);
   const maxWidth=blocks.reduce((m,b)=>Math.max(m,b.w),0);
   const target=Math.max(maxWidth,Math.sqrt(total)*1.12);
   const localPositions=new Map();
   let x=0,y=0,rowH=0,largestX=0;
   for(const block of blocks){
    if(x>0&&x+block.w>target){x=0;y+=rowH+padding;rowH=0;}
    const offset={x:x-block.bounds.l,y:y-block.bounds.t};
    for(const [id,p] of block.local)localPositions.set(id,{x:p.x+offset.x,y:p.y+offset.y});
    x+=block.w+padding;largestX=Math.max(largestX,x-padding);
    rowH=Math.max(rowH,block.h);
   }
   const gridH=y+rowH,gridW=Math.max(largestX,mm.get(branchId)?.w||0);
   branchBlocks.push({id:branchId,localPositions,gridW,gridH});
  }
  // Fase 2: empaquetado de regiones J1 alrededor del núcleo. Para tres
  // brazos se forma un triángulo de bloques, no tres columnas verticales.
  // El nodo J1 se ubica en el borde orientado hacia P1.
  const branchBounds=[],branchCount=branchBlocks.length;
  for(let i=0;i<branchCount;i++){
   const block=branchBlocks[i],metric=mm.get(block.id)||{w:180,h:75};
   let anchor;
   if(branchCount===3){
    anchor=i===0?{x:block.gridW+metric.w/2+90,y:block.gridH+35}:
     i===1?{x:-metric.w/2-90,y:block.gridH+35}:
     {x:block.gridW/2,y:-metric.h/2-95};
   }else if(branchCount===2){
    anchor=i===0?{x:block.gridW+metric.w/2+100,y:block.gridH/2}:
     {x:-metric.w/2-100,y:block.gridH/2};
   }else{
    anchor={x:block.gridW/2,y:-metric.h/2-115};
   }
   if(block.id!=='orphan')block.localPositions.set(block.id,anchor);
   const bounds=CompactLayout.bounds([...block.localPositions.keys()],block.localPositions,mm);
   branchBounds.push({id:block.id,
    local:new Map([...block.localPositions].map(([id,p])=>[id,{x:p.x-bounds.l,y:p.y-bounds.t}])),
    width:bounds.w,height:bounds.h});
  }
  const result=new Map(),offsets=[];
  const gap=345;
  if(branchCount===3){
   const [a,b,c]=branchBounds;
   const topHeight=Math.max(a.height,b.height);
   offsets.push({x:0,y:0},{x:a.width+gap,y:0},{
    x:(a.width+b.width+gap-c.width)/2,
    y:topHeight+gap
   });
   result.set('p1',{x:a.width+gap/2,y:topHeight+gap/2});
  }else if(branchCount===2){
   const [a]=branchBounds;
   offsets.push({x:0,y:0},{x:a.width+gap,y:0});
   result.set('p1',{x:a.width+gap/2,
    y:Math.max(...branchBounds.map(b=>b.height))/2});
  }else{
   const cols=Math.max(1,Math.ceil(Math.sqrt(branchCount)));
   const cellW=Math.max(0,...branchBounds.map(b=>b.width))+gap;
   const cellH=Math.max(0,...branchBounds.map(b=>b.height))+gap;
   for(let i=0;i<branchCount;i++)offsets.push({x:(i%cols)*cellW,y:Math.floor(i/cols)*cellH});
   result.set('p1',{x:(cols-.5)*cellW/2,y:cellH/2});
  }
  for(let i=0;i<branchBounds.length;i++){
   const block=branchBounds[i],offset=offsets[i];
   for(const [id,p] of block.local)result.set(id,{x:p.x+offset.x,y:p.y+offset.y});
  }
  // La posición central es un punto de vista; no se inventan vínculos.
  // Desplazar el conjunto al origen mantiene intactas todas las relaciones.
  const core=result.get('p1')||{x:0,y:0};
  for(const [id,p] of result)result.set(id,{x:p.x-core.x,y:p.y-core.y});
  // Fase 3: refinamiento micro de nodos individuales. Solo modificar dentro
  // de su bloque J2, sin alterar el orden de sus hermanos alrededor del padre.
  // El redibujo PCB y la firma topológica serán validaciones posteriores.
  const neighbours=new Map(ids.map(id=>[id,[]]));
  for(const e of edges){neighbours.get(e.from)?.push(e.to);neighbours.get(e.to)?.push(e.from);}
  let microMoves=0;
  for(let pass=0;pass<2;pass++){
   for(const id of ids){
    if(id==='p1'||roots.some(r=>r.id===id))continue;
    const p=result.get(id),family=moduleByNode.get(id);
    if(!p)continue;
    const adjacent=(neighbours.get(id)||[]).filter(k=>result.has(k));
    if(!adjacent.length)continue;
    let fx=0,fy=0;
    for(const k of adjacent){
     const q=result.get(k);
     const w=moduleByNode.get(k)===family?2:0.65;
     const d=Math.hypot(q.x-p.x,q.y-p.y)||1;
     fx+=w*(q.x-p.x)/d;fy+=w*(q.y-p.y)/d;
    }
    const norm=Math.hypot(fx,fy);if(norm<.05)continue;
    const target={x:p.x+10*fx/norm,y:p.y+10*fy/norm};
    const before=adjacent.reduce((sum,k)=>{const q=result.get(k);return sum+Math.hypot(p.x-q.x,p.y-q.y)},0);
    const after=adjacent.reduce((sum,k)=>{const q=result.get(k);return sum+Math.hypot(target.x-q.x,target.y-q.y)},0);
    if(after>=before)continue;
    const box=CompactLayout.rect(id,target,mm.get(id));let blocked=false;
    for(const [other,q] of result){
     if(other===id)continue;
     const rr=CompactLayout.rect(other,q,mm.get(other));
     if(box.l<rr.r+30&&box.r>rr.l-30&&box.t<rr.b+30&&box.b>rr.t-30){blocked=true;break;}
    }
    if(blocked)continue;
    result.set(id,target);microMoves++;
   }
  }
  const afterBounds=CompactLayout.bounds(ids,result,mm);
  const stats={sourceArea:reference.area,area:afterBounds.area,
   areaRatio:reference.area?afterBounds.area/reference.area:1,
   sourceWidth:reference.w,sourceHeight:reference.h,
   width:afterBounds.w,height:afterBounds.h,
   sourceLinkLength:CompactLayout.length(edges,original),
   linkLength:CompactLayout.length(edges,result),
   macroBlocks:branchBounds.length,subtreeBlocks:modules,
   microMoves,meanSubtreeScale:modules?innerFactorSum/modules:1,
   metric:'empaquetado jerárquico de subárboles J2 con refinamiento local',
   bounds:afterBounds};
  return {positions:result,
   rects:new Map([...result].map(([id,p])=>[id,CompactLayout.rect(id,p,mm.get(id))])),
   stats};
 }
}
