import {referenceSectors,analyzeCompactObjectives} from './CompactObjectives.js';

// Los ángulos de los sectores son variables de diseño, no constantes
// geométricas. Se optimizan SIN modificar el plano ni sus vínculos.
// La topología conserva el orden circular de los J1 de la referencia 01.
const TAU=2*Math.PI,eps=1e-8;
const norm=a=>(a%TAU+TAU)%TAU;
function sectorContains(sector,p){
 if(sector.width>=TAU-1e-8)return true;
 const angle=norm(Math.atan2(p.y,p.x));
 return norm(angle-sector.start)<=sector.width+eps;
}
export function optimizeSectorBoundaries({nodes,positions,rects,edges=[],
 j0Id='p1',passes=2}){
 const ps=positions instanceof Map?positions:new Map(positions),
  rm=rects instanceof Map?rects:new Map(rects),
  base=referenceSectors({nodes,positions:ps,j0Id});
 if(!base.valid||base.roots.length<2)return base;
 const origin=ps.get(j0Id);
 const roots=base.roots.map(id=>({
  id,angle:norm(Math.atan2(ps.get(id).y-origin.y,ps.get(id).x-origin.x))
 })).sort((a,b)=>a.angle-b.angle);
 const N=roots.length;
 const span=(a,b)=>norm(b-a);
 const gaps=roots.map((a,i)=>span(a.angle,roots[(i+1)%N].angle));
 const largest=gaps.indexOf(Math.max(...gaps));
 let boundaries=roots.map(a=>base.sectors[a.id].end);
 const build=(bs)=>{
  const sectors={};
  for(let i=0;i<N;i++){
   const start=bs[(i-1+N)%N],end=bs[i];
   sectors[roots[i].id]={start,end,center:roots[i].angle,
    width:span(start,end)};
  }
  return {...base,sectors,optimized:true};
 };
 const validRoots=sectorRefs=>{
  for(const r of roots){
   const box=rm.get(r.id),p=ps.get(r.id),sector=sectorRefs.sectors[r.id];
   if(!box||!p)return false;
   for(const [x,y] of [
    [p.x-box.w/2,p.y-box.h/2],[p.x+box.w/2,p.y-box.h/2],
    [p.x+box.w/2,p.y+box.h/2],[p.x-box.w/2,p.y+box.h/2]
   ])if(!sectorContains(sector,{x:x-origin.x,y:y-origin.y}))return false;
  }
  return true;
 };
 const score=b=>{
  const sectors=build(b);
  if(!validRoots(sectors))return Infinity;
  const metrics=analyzeCompactObjectives({
   nodes,positions:ps,rects:rm,edges,sectors,j0Id});
  if(!metrics.valid)return Infinity;
  // Penalización mínima de sectores extremadamente angostos, que no
  // ahorra geometría útil. No se impone una anchura angular fija.
  const narrow=Object.values(sectors.sectors)
   .reduce((v,s)=>v+Math.max(0,.3-s.width)**2,0);
  return metrics.zonePenalty+5*narrow;
 };
 let best=score(boundaries),attempted=0;
 for(let pass=0;pass<passes;pass++){
  let improved=false;
  for(let i=0;i<N;i++){
   if(i===largest)continue; // El espacio exterior no requiere nuevos cortes.
   const a=roots[i].angle,gap=gaps[i];
   let local={value:best,boundary:boundaries[i]};
   for(const f of [.18,.27,.36,.45,.54,.63,.72,.81]){
    const candidate=boundaries.slice();
    candidate[i]=norm(a+gap*f);attempted++;
    const value=score(candidate);
    if(value<local.value-1e-7)local={value,boundary:candidate[i]};
   }
   if(local.value<best-1e-7){
    boundaries[i]=local.boundary;best=local.value;improved=true;
   }
  }
  if(!improved)break;
 }
 const result=build(boundaries),
  metrics=analyzeCompactObjectives({nodes,positions:ps,rects:rm,edges,
   sectors:result,j0Id});
 return {...result,optimization:{attempted,initialPenalty:score(
  roots.map(a=>base.sectors[a.id].end)),
  finalPenalty:metrics.zonePenalty,improved:best<Infinity,
  freeAngularBoundaries:N-1,radialIdentityUnchanged:true}};
}
