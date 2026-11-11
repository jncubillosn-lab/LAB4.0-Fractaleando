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
  // Fase 1: los subárboles J2 son unidades rígidas. La disposición
  // interna del plano validado se conserva, solo se reducen distancias
  // homogéneamente donde haya separación real entre cuadros.
  for(const [branchId,moduleMap] of branches){
   const blocks=[];
   for(const [moduleId,members] of moduleMap){
    if(moduleId===branchId&&branchId!=='orphan')continue;
    const bb=CompactLayout.bounds(members,original,mm);
    const center={x:(bb.l+bb.r)/2,y:(bb.t+bb.b)/2};
    let scale=.84;
    const make=f=>new Map(members.map(id=>[id,{
     x:(original.get(id).x-center.x)*f,
     y:(original.get(id).y-center.y)*f
    }]));
    while(scale<1&&CompactLayout.overlaps(make(scale),mm,25)>0)scale=Math.min(1,scale+.04);
    const local=make(scale),bounds=CompactLayout.bounds(members,local,mm);
    blocks.push({id:moduleId,members,local,bounds,w:bounds.w,h:bounds.h,
     sourceY:original.get(moduleId)?.y??center.y,scale});
    innerFactorSum+=scale;modules++;
   }
   // Los J2 se distribuyen alrededor de su J1 en dos zonas, no en
   // trece filas. El orden por Y del plano se conserva dentro de cada
   // lado para preservar la lectura de sus hijos.
   blocks.sort((a,b)=>a.sourceY-b.sourceY||a.id.localeCompare(b.id));
   const split=Math.ceil(blocks.length/2);
   const left=blocks.slice(0,split),right=blocks.slice(split);
   const space=90,corridor=340;
   const leftW=Math.max(0,...left.map(b=>b.w));
   const rightW=Math.max(0,...right.map(b=>b.w));
   const totalW=leftW+corridor+rightW;
   const heights=groups=>groups.reduce((sum,b,i)=>sum+b.h+(i?space:0),0);
   const leftH=heights(left),rightH=heights(right);
   const totalH=Math.max(leftH,rightH,mm.get(branchId)?.h||0);
   const localPositions=new Map();
   function column(items,x){
    let cursor=(totalH-heights(items))/2;
    for(const block of items){
     const ox=x-block.bounds.l;
     const oy=cursor-block.bounds.t;
     for(const [id,p] of block.local)localPositions.set(id,{x:p.x+ox,y:p.y+oy});
     cursor+=block.h+space;
    }
   }
   column(left,0);column(right,leftW+corridor);
   if(branchId!=='orphan')localPositions.set(branchId,{x:leftW+corridor/2,y:totalH/2});
   const bounds=CompactLayout.bounds([...localPositions.keys()],localPositions,mm);
   branchBlocks.push({id:branchId,
    local:new Map([...localPositions].map(([id,p])=>[id,{x:p.x-bounds.l,y:p.y-bounds.t}])),
    width:bounds.w,height:bounds.h});
  }
  // Fase 2: triangulación de los bloques J1 con P1 cerca de su punto
  // de encuentro. Cada bloque se desplaza sin invertir la topología
  // interna de sus subárboles; no se fijan las columnas de 01.
  const result=new Map(),count=branchBlocks.length;
  const gap=360,offsets=[];
  if(count===3){
   const [a,b,c]=branchBlocks,topH=Math.max(a.height,b.height);
   offsets.push({x:0,y:0},{x:a.width+gap,y:0},{
    x:(a.width+b.width+gap-c.width)/2,y:topH+gap});
   result.set('p1',{x:a.width+gap/2,y:topH+gap/2});
  }else if(count===2){
   const [a]=branchBlocks;
   offsets.push({x:0,y:0},{x:a.width+gap,y:0});
   result.set('p1',{x:a.width+gap/2,y:Math.max(...branchBlocks.map(b=>b.height))/2});
  }else{
   const cols=Math.max(1,Math.ceil(Math.sqrt(count)));
   const cellW=Math.max(0,...branchBlocks.map(b=>b.width))+gap;
   const cellH=Math.max(0,...branchBlocks.map(b=>b.height))+gap;
   for(let i=0;i<count;i++)offsets.push({x:(i%cols)*cellW,y:Math.floor(i/cols)*cellH});
   result.set('p1',{x:cellW/2,y:cellH/2});
  }
  for(let i=0;i<branchBlocks.length;i++)
   for(const [id,p] of branchBlocks[i].local)result.set(id,{
    x:p.x+offsets[i].x,y:p.y+offsets[i].y});
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
   macroBlocks:branchBlocks.length,subtreeBlocks:modules,
   microMoves,meanSubtreeScale:modules?innerFactorSum/modules:1,
   metric:'empaquetado jerárquico de subárboles J2 con refinamiento local',
   bounds:afterBounds};
  return {positions:result,
   rects:new Map([...result].map(([id,p])=>[id,CompactLayout.rect(id,p,mm.get(id))])),
   stats};
 }
}
