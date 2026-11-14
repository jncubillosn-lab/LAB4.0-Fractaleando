import {RadialLayout} from './RadialLayout.js';
import {SpiralLayout} from './SpiralLayout.js';
// Vistas derivadas y deterministas del mismo grafo conceptual P1.
// Nunca modifica los nodos, los vínculos ni el punto de control de 01.
// 02: radial acotado; 03 retirado;
// 04: giro continuo de 02, con radios locales y T=0.
export class ViewLayouts {
 static MODES=['01','02','04'];
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
 compute({mode,baseLayout,...input}){
  if(mode!=='02'&&mode!=='04')throw Error('Vista no reconocida');
  const base=baseLayout||new RadialLayout().compute(input);
  if(mode==='02')return base;
  if(base.stats.graphSignature!==RadialLayout.signature(input.nodes,input.edges))throw Error('La base 02 pertenece a otro grafo.');
  return new SpiralLayout().compute({base,...input});
 }
}
