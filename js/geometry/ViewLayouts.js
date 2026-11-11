import {CompactLayout} from './CompactLayout.js';
// Vistas derivadas y deterministas del mismo grafo conceptual P1.
// Nunca modifica los nodos, los vínculos ni el punto de control de 01.
// 02: compactación conservadora; 03: radio idéntico por jerarquía;
// 04: N brazos espirales (N=#J1), T=0 y bandas radiales estrictas.
export class ViewLayouts {
 static MODES=['01','02','03','04'];
 constructor(){this.last=null;}
 static graphLevels(nodes,edges){
  const ids=new Set(nodes.map(n=>n.id)),adj=new Map(nodes.map(n=>[n.id,[]]));
  for(const e of edges)if(ids.has(e.from)&&ids.has(e.to)&&e.from!==e.to){
   adj.get(e.from).push(e.to);adj.get(e.to).push(e.from);
  }
  const levels=new Map(),queue=['p1'];if(ids.has('p1'))levels.set('p1',0);
  for(let k=0;k<queue.length;k++){
   const at=queue[k],level=levels.get(at);
   for(const id of adj.get(at)||[])if(!levels.has(id)){
    levels.set(id,level+1);queue.push(id);
   }
  }
  const connectedMax=Math.max(0,...levels.values());
  // Los términos desconectados no tienen jerarquía de distancia al origen:
  // se alojan en una banda periférica diferenciada, sin crear caminos.
  for(const n of nodes)if(!levels.has(n.id))levels.set(n.id,connectedMax+1);
  return {levels,disconnected:new Set(nodes.filter(n=>!queue.includes(n.id)).map(n=>n.id)),adj};
 }
 static branches(nodes,adj){
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const roots=nodes.filter(n=>n.parent==='p1').sort((a,b)=>a.branch-b.branch||a.id.localeCompare(b.id));
  const owner=new Map([['p1',null]]);
  for(const root of roots)owner.set(root.id,root.id);
  for(const n of nodes){
   if(owner.has(n.id))continue;
   const visited=new Set();let at=n,root=null;
   while(at&&!visited.has(at.id)){
    visited.add(at.id);
    if(owner.has(at.id)){root=owner.get(at.id);break;}
    if(at.parent==='p1'){root=at.id;break;}
    at=byId.get(at.parent);
   }
   if(root)owner.set(n.id,root);
  }
  // Un vínculo transversal no sustituye al parentesco; solo asigna
  // sector visual a términos huérfanos sin ramificación propia.
  const queue=roots.map(r=>r.id);
  for(let i=0;i<queue.length;i++){
   const id=queue[i];
   for(const other of adj.get(id)||[])if(!owner.has(other)){
    owner.set(other,owner.get(id));queue.push(other);
   }
  }
  const homeless=nodes.filter(n=>!owner.has(n.id)&&n.id!=='p1').sort((a,b)=>a.id.localeCompare(b.id));
  for(const n of homeless)owner.set(n.id,'orphan');
  return {owner,roots,homeless};
 }
 static overlap(a,b,gap=16){
  return a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap;
 }
 static rect(id,p,m){
  return {id,x:p.x,y:p.y,w:m.w,h:m.h,l:p.x-m.w/2,r:p.x+m.w/2,t:p.y-m.h/2,b:p.y+m.h/2};
 }
 static countOverlaps(rects,gap=12){
  const all=[...rects.values()];let count=0;
  for(let i=0;i<all.length;i++)for(let j=0;j<i;j++){
   const a=all[i],b=all[j];
   if(a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap)count++;
  }
  return count;
 }
 compute({mode,nodes,edges,metrics,sourcePositions}){
  if(!['02','03','04'].includes(mode))throw Error('Vista no reconocida');
  if(!nodes.length)return {mode,positions:new Map(),rects:new Map(),levels:{},stats:{}};
  const {levels,disconnected,adj}=ViewLayouts.graphLevels(nodes,edges);
  const {owner,roots}=ViewLayouts.branches(nodes,adj);
  const byId=new Map(nodes.map(n=>[n.id,n]));
  const positions=new Map(),rects=new Map();
  const metricsMap=metrics instanceof Map?metrics:new Map(metrics);
  const source=sourcePositions instanceof Map?sourcePositions:new Map(sourcePositions);
  const set=(id,p)=>{const m=metricsMap.get(id);if(!m)return;positions.set(id,p);rects.set(id,ViewLayouts.rect(id,p,m));};
  const makeStats=(extra={})=>({
   mode,nodes:positions.size,overlaps:ViewLayouts.countOverlaps(rects,14),
   disconnected:[...disconnected],arms:roots.length,
   ...extra
  });
  if(mode==='02'){
   const compact=CompactLayout.compute({nodes,edges,metrics:metricsMap,source});
   return {mode,positions:compact.positions,rects:compact.rects,
    levels:Object.fromEntries(levels),
    stats:{...compact.stats,mode,nodes:compact.positions.size,
     overlaps:ViewLayouts.countOverlaps(compact.rects,14),
     disconnected:[...disconnected],arms:roots.length,radiusByLevel:null}};
  }
  // Orden estable dentro de ramas. La cercanía de los conceptos se expresa
  // mediante prioridad de parentesco y vecinos, sin cambiar los vínculos.
  const maxLevel=Math.max(...levels.values());
  const rootIds=roots.map(n=>n.id);
  const grouped=new Map();
  for(const n of nodes)if(n.id!=='p1'){
   const l=levels.get(n.id),branch=owner.get(n.id)||'orphan';
   if(!grouped.has(l))grouped.set(l,new Map());
   if(!grouped.get(l).has(branch))grouped.get(l).set(branch,[]);
   grouped.get(l).get(branch).push(n);
  }
  const sectors=[...rootIds];
  if([...grouped.values()].some(g=>g.has('orphan')))sectors.push('orphan');
  if(!sectors.length)sectors.push('orphan');
  const needs=new Map(sectors.map(id=>[id,1]));
  for(const ring of grouped.values())for(const [id,array] of ring){
   // La amplitud fija de sector se determina por la densidad máxima.
   needs.set(id,Math.max(needs.get(id)||1,array.length));
  }
  const sum=[...needs.values()].reduce((a,b)=>a+Math.sqrt(b),0);
  const spans=new Map(),centers=new Map();let cursor=-Math.PI/2;
  for(const id of sectors){
   const span=(2*Math.PI)*Math.sqrt(needs.get(id))/sum;
   spans.set(id,span);centers.set(id,cursor+span/2);cursor+=span;
  }
  // Mismo orden dentro de un brazo al avanzar las jerarquías.
  // Aumenta proximidad entre relacionados evitando dispersión aleatoria.
  const preorder=new Map();let seq=0;
  const visited=new Set();
  const traverse=id=>{
   if(visited.has(id))return;visited.add(id);preorder.set(id,seq++);
   const children=nodes.filter(n=>n.parent===id).sort((a,b)=>
    (source.get(a.id)?.y??0)-(source.get(b.id)?.y??0)||a.id.localeCompare(b.id));
   for(const c of children)traverse(c.id);
  };
  traverse('p1');for(const n of nodes)traverse(n.id);
  for(const group of grouped.values())for(const list of group.values())
   list.sort((a,b)=>(preorder.get(a.id)??0)-(preorder.get(b.id)??0));
  // Barrido baricéntrico dentro de cada brazo: los vecinos de otras
  // jerarquías influyen en la posición angular, pero nunca se mezclan brazos.
  // El objetivo es reducir el entrecruzamiento ANTES del enrutamiento PCB.
  function estimatedAngle(id){
   const level=levels.get(id),branch=owner.get(id)||'orphan';
   const list=grouped.get(level)?.get(branch);
   const center=centers.get(branch)||0,span=spans.get(branch)||0;
   if(!list?.length)return center;
   const index=list.findIndex(n=>n.id===id);
   return center+((index+.5)/list.length-.5)*span;
  }
  const originalRank=new Map([...preorder]);
  function sweep(level,direction){
   const ring=grouped.get(level);
   if(!ring)return;
   for(const list of ring.values()){
    if(list.length<2)continue;
    const scores=new Map();
    for(let k=0;k<list.length;k++){
     const node=list[k];
     let numerator=estimatedAngle(node.id)*.7,denominator=.7;
     for(const other of adj.get(node.id)||[]){
      if(levels.get(other)!==level+direction)continue;
      const sameBranch=owner.get(other)===owner.get(node.id);
      const weight=sameBranch?3:0.8;
      numerator+=estimatedAngle(other)*weight;denominator+=weight;
     }
     scores.set(node.id,numerator/denominator);
    }
    list.sort((a,b)=>scores.get(a.id)-scores.get(b.id)||
     originalRank.get(a.id)-originalRank.get(b.id));
   }
  }
  for(let pass=0;pass<4;pass++){
   for(let level=2;level<=maxLevel;level++)sweep(level,-1);
   for(let level=maxLevel-1;level>=1;level--)sweep(level,1);
  }
  // Carril angular de cada jerarquía: espaciamiento suficiente para cuadros.
  const radii=new Map([[0,0]]);
  const maxHalf=new Map([[0,Math.hypot(metricsMap.get('p1')?.w||108,metricsMap.get('p1')?.h||67)/2]]);
  for(let l=1;l<=maxLevel;l++){
   const group=grouped.get(l)||new Map();
   let required=0;let diag=0;
   for(const [id,items] of group){
    const span=spans.get(id)||2*Math.PI;
    const pad=Math.min(0.25,span*.12);
    const dims=items.map(n=>metricsMap.get(n.id));
    const widths=dims.reduce((sum,m)=>sum+Math.hypot(m.w,m.h)*.8+32,0);
    required=Math.max(required,widths/Math.max(.16,span-2*pad));
    for(const m of dims)diag=Math.max(diag,Math.hypot(m.w,m.h)/2);
   }
   maxHalf.set(l,diag);
   const prev=radii.get(l-1);
   const minGap=(maxHalf.get(l-1)||65)+diag+135;
   radii.set(l,Math.max(required,prev+minGap,220+l*90));
  }
  const TAU=2*Math.PI;
  const spiral=mode==='04';
  const W=spiral?0.23:0; // progreso angular por jerarquía (radianes)
  const D=spiral?0.16:0; // variación radial intrajerárquica, relativa al ancho de banda
  const T=0;
  // Una separación angular relativa de conceptos entre ramas no se mezcla:
  // cada brazo es un sector, cuyo eje rota con la jerarquía en espiral.
  const place=(multiplier=1)=>{
   positions.clear();rects.clear();
   set('p1',{x:0,y:0});
   for(let l=1;l<=maxLevel;l++){
    const ring=grouped.get(l)||new Map(),r=radii.get(l)*multiplier;
    const before=l>1?radii.get(l-1)*multiplier:0;
    const after=l<maxLevel?radii.get(l+1)*multiplier:r+(r-before);
    const radialBudget=Math.max(0,Math.min(r-before,after-r)-2*(maxHalf.get(l)||0)-65);
    for(const id of sectors){
     const items=ring.get(id)||[];
     const span=spans.get(id),center=centers.get(id);
     const pad=Math.min(.20,span*.10);
     for(let j=0;j<items.length;j++){
      const u=(j+.5)/items.length-.5;
      const angle=center+u*(span-2*pad)+W*(l-1);
      const radius=spiral?r+u*D*radialBudget:r;
      set(items[j].id,{x:Math.cos(angle)*radius,y:Math.sin(angle)*radius});
     }
    }
   }
  };
  // Agrandar radios, nunca reordenar a posteriori ni intercambiar puertos.
  // Respeta exactamente r(Jn) para 03 y bandas disjuntas para 04.
  let multiplier=1;
  for(let tries=0;tries<10;tries++){
   place(multiplier);
   if(ViewLayouts.countOverlaps(rects,14)===0)break;
   multiplier*=1.18;
  }
  const radialExtremes={};
  for(const [id,p] of positions){
   const l=levels.get(id)||0;
   const d=Math.hypot(p.x,p.y);
   if(!radialExtremes[l])radialExtremes[l]={min:d,max:d};
   else{radialExtremes[l].min=Math.min(radialExtremes[l].min,d);radialExtremes[l].max=Math.max(radialExtremes[l].max,d);}
  }
  const layers=Object.keys(radialExtremes).map(Number).sort((a,b)=>a-b);
  const radialOrder=layers.every((l,i)=>i===0||radialExtremes[layers[i-1]].max<radialExtremes[l].min-1e-3);
  return {mode,positions,rects,levels:Object.fromEntries(levels),
   stats:makeStats({radialOrder,radialExtremes,
    W,D,T,radiusByLevel:Object.fromEntries([...radii].map(([k,r])=>[k,r*multiplier]))})};
 }
}
