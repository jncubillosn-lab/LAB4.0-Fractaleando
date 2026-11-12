import {warpCoordinate} from './CoordinateIsotopy.js';

// EXP-02-E: distribuir lateralmente conceptos del mismo nivel, sin fijar
// radios ni filas. Cada hijo puede adoptar una coordenada distinta.
// Los cambios se aplican como homeomorfismo global, no como saltos de cajas.
export function disperseSectorColumns({nodes,positions,rects,routes}){
 const ps=new Map(positions),rr=new Map(rects),byId=new Map(nodes.map(n=>[n.id,n]));
 const depth=new Map([['p1',0]]),owner=new Map([['p1',null]]);
 const visit=id=>{
  if(depth.has(id))return;
  const node=byId.get(id);
  if(!node?.parent||!byId.has(node.parent))throw Error('Jerarquía incompleta '+id);
  visit(node.parent);
  depth.set(id,depth.get(node.parent)+1);
  owner.set(id,node.parent==='p1'?id:owner.get(node.parent));
 };
 try{nodes.forEach(n=>visit(n.id));}catch(e){return {valid:false,reason:e.message};}
 const origin=ps.get('p1'),roots=nodes.filter(n=>n.parent==='p1')
  .sort((a,b)=>ps.get(a.id).x-ps.get(b.id).x);
 const axis=new Map(roots.map((n,i)=>[n.id,i-(roots.length-1)/2]));
 const targets=new Map([...ps].map(([id,p])=>[id,p.x]));
 const levels=Math.max(...depth.values()),stats=[];
 for(let d=2;d<=levels;d++){
  const columnCount=d===2?3:d===3?6:d===4?6:3;
  const step=230,span=(columnCount-1)*step;
  const centerOffset=d===2?950:d===3?1580:d===4?2180:2800;
  for(const root of roots){
   const group=nodes.filter(n=>depth.get(n.id)===d&&owner.get(n.id)===root.id)
    .sort((a,b)=>ps.get(a.id).y-ps.get(b.id).y||
     ps.get(a.id).x-ps.get(b.id).x||a.id.localeCompare(b.id));
   const sign=Math.sign(axis.get(root.id));
   // Para ramas interiores no se inventa un segundo sector.
   const base=origin.x+sign*centerOffset;
   for(let i=0;i<group.length;i++){
    const col=i%columnCount;
    // Conservar la secuencia transversal de las cajas en la malla,
    // cuando coincide la misma coordenada de profundidad.
    const x=base+(col-(columnCount-1)/2)*step;
    targets.set(group[i].id,x);
   }
   stats.push({level:d,root:root.id,count:group.length,columns:columnCount});
  }
 }
 // Condición necesaria para que exista un mapa horizontal creciente:
 // dos rectángulos cuyos intervalos verticales se cortan no pueden
 // permutar su orden izquierda/derecha, ni solaparse tras el cambio.
 const source=[...rr.values()].sort((a,b)=>a.x-b.x||a.id.localeCompare(b.id));
 const conflicts=[];
 for(let i=0;i<source.length;i++){
  const b=source[i];
  let need=-Infinity;
  for(let j=0;j<i;j++){
   const a=source[j];
   if(Math.min(a.b,b.b)-Math.max(a.t,b.t)<=-37)continue;
   need=Math.max(need,targets.get(a.id)+(a.w+b.w)/2+45);
  }
  if(need>targets.get(b.id)){
   conflicts.push({id:b.id,from:targets.get(b.id),to:need});
   targets.set(b.id,need);
  }
 }
 // Mantener fijo J0 y los tres J1: estos cuatro cuadros gobiernan
 // el primer escalón y no se desplazan por efecto del algoritmo profundo.
 if(['p1',...roots.map(r=>r.id)].some(id=>
  Math.abs(targets.get(id)-ps.get(id).x)>.01))return {
  valid:false,reason:'La proyección forzaría a desplazar J0/J1',conflicts:conflicts.slice(0,12)};
 const candidate=warpCoordinate({positions:ps,rects:rr,routes,
  targets,axis:'x'});
 if(!candidate.valid)return {...candidate,conflicts:conflicts.slice(0,10)};
 return {...candidate,targets,groups:stats,adjustments:conflicts.length};
}
