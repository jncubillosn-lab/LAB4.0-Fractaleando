// P1-ET-02 v1.1 — Norma radial por jerarquía.
// Radio = distancia euclidiana CENTRO a CENTRO respecto de J0.
// Requisito estricto: max(r(Jk)) < min(r(Jk+1)) para todos los niveles.
// No supone radios iguales dentro de Jk ni fija incrementos de nivel.
export function analyzeRadialHierarchy({nodes,positions,j0Id='p1',tolerance=1e-7}){
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const ps=positions instanceof Map?positions:new Map(positions||[]);
 const depth=new Map([[j0Id,0]]),visiting=new Set();
 const errors=[];
 if(!byId.has(j0Id))errors.push('Falta el núcleo J0: '+j0Id);
 if(!ps.has(j0Id))errors.push('J0 no tiene posición');
 const getDepth=id=>{
  if(depth.has(id))return depth.get(id);
  const n=byId.get(id);
  if(!n){errors.push('Concepto desconocido: '+id);return null;}
  if(visiting.has(id)){errors.push('Ciclo jerárquico: '+id);return null;}
  if(!n.parent||!byId.has(n.parent)){
   errors.push('Padre ausente o no vinculado con J0: '+id);
   return null;
  }
  visiting.add(id);
  const d=getDepth(n.parent);
  visiting.delete(id);
  if(d===null)return null;
  depth.set(id,d+1);return d+1;
 };
 const bands=new Map(),origin=ps.get(j0Id);
 for(const n of nodes){
  const d=getDepth(n.id),p=ps.get(n.id);
  if(d===null||!p||!origin){
   if(!p)errors.push('Sin posición: '+n.id);
   continue;
  }
  const radius=Math.hypot(p.x-origin.x,p.y-origin.y);
  if(!Number.isFinite(radius)){
   errors.push('Radio no finito: '+n.id);continue;
  }
  if(!bands.has(d))bands.set(d,[]);
  bands.get(d).push({id:n.id,radius});
 }
 const sorted=[...bands].sort(([a],[b])=>a-b);
 const summary=sorted.map(([level,items])=>{
  const radii=items.map(n=>n.radius);
  const min=Math.min(...radii),max=Math.max(...radii);
  return {level,count:items.length,min,max,span:max-min};
 });
 const violations=[];
 for(let i=1;i<summary.length;i++){
  const previous=summary[i-1],current=summary[i];
  const clearance=current.min-previous.max;
  if(current.level!==previous.level+1||clearance<=tolerance){
   violations.push({innerLevel:previous.level,outerLevel:current.level,
    maxInner:previous.max,minOuter:current.min,clearance,
    innerFarthest:bands.get(previous.level)
     .filter(n=>Math.abs(n.radius-previous.max)<=tolerance).map(n=>n.id),
    outerNearest:bands.get(current.level)
     .filter(n=>Math.abs(n.radius-current.min)<=tolerance).map(n=>n.id)});
  }
 }
 if(depth.size!==nodes.length){
  errors.push('La jerarquía no es íntegramente descendiente de J0');
 }
 return {valid:errors.length===0&&violations.length===0,
  j0Id,summary,violations,errors};
}
