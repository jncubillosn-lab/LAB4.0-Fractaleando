// Compresión de corredores por isotopía ambiental, no reenrutamiento.
// F(x) es continua, estrictamente creciente y de pendiente 1 sobre cada
// proyección de caja + stub. Todo H_t=(1-t)Id+tF es biyectivo.
// Cada polilínea se subdivide EXACTAMENTE donde cambia la pendiente.
const close=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-8;
function merge(intervals){
 const out=[];
 for(const [a,b] of intervals.sort((x,y)=>x[0]-y[0])){
  if(out.length&&a<=out.at(-1)[1])out.at(-1)[1]=Math.max(out.at(-1)[1],b);
  else out.push([a,b]);
 }
 return out;
}
export function createAxisCorridorWarp({rects,axis='x',factor=.36,minGap=45,guard=20}){
 const rm=rects instanceof Map?rects:new Map(rects||[]);
 if(!['x','y'].includes(axis)||!(factor>0&&factor<=1)||
  !Number.isFinite(minGap)||minGap<20||!Number.isFinite(guard)||guard<19||
  !rm.size)return {valid:false,reason:'Argumentos de compresión inválidos'};
 const l=axis==='x'?'l':'t',r=axis==='x'?'r':'b';
 const intervals=[];
 for(const box of rm.values()){
  if(!Number.isFinite(box[l])||!Number.isFinite(box[r])||box[l]>=box[r])
   return {valid:false,reason:'Cuadro no verificable'};
  intervals.push([box[l]-guard,box[r]+guard]);
 }
 const blocks=merge(intervals),gaps=[],breaks=[],savings=[];
 let removed=0,maxLip=0;
 for(let i=1;i<blocks.length;i++){
  const a=blocks[i-1][1],b=blocks[i][0],length=b-a;
  const next=Math.min(length,Math.max(minGap,length*factor));
  const shrink=length-next;
  if(shrink<=1e-8)continue;
  gaps.push({from:a,to:b,after:next,save:shrink,offsetBefore:removed});
  breaks.push(a,b);
  savings.push(shrink);removed+=shrink;
  maxLip=Math.max(maxLip,shrink/length);
 }
 if(!gaps.length)return {valid:true,axis,map:p=>({...p}),
  mapPolyline:ps=>ps.map(p=>({...p})),
  proof:{kind:'axis-monotone-warp',axis,bound:0,saved:0,gaps:0},
  saved:0,changed:false};
 const applyAxis=x=>{
  let previous=0;
  for(const g of gaps){
   if(x<=g.from)return x-g.offsetBefore;
   if(x<g.to)return g.from-g.offsetBefore+
    (x-g.from)*(g.after/(g.to-g.from));
   previous=g.offsetBefore+g.save;
  }
  return x-previous;
 };
 const map=p=>axis==='x'?{x:applyAxis(p.x),y:p.y}:
  {x:p.x,y:applyAxis(p.y)};
 const mapPolyline=points=>{
  const result=[],key=axis==='x'?'x':'y';
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],values=[0,1],
    diff=b[key]-a[key];
   if(Math.abs(diff)>1e-10)for(const cut of breaks){
    const t=(cut-a[key])/diff;
    if(t>1e-9&&t<1-1e-9)values.push(t);
   }
   values.sort((a,b)=>a-b);
   for(const t of values){
    const p=map({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
    if(!result.length||!close(p,result.at(-1)))result.push(p);
   }
  }
  // Colineal adjacent segments are merged (no geometry change).
  for(let i=result.length-2;i>0;i--){
   const a=result[i-1],b=result[i],c=result[i+1],
    v={x:b.x-a.x,y:b.y-a.y},w={x:c.x-b.x,y:c.y-b.y};
   if(Math.abs(v.x*w.y-v.y*w.x)<1e-7&&v.x*w.x+v.y*w.y>=0)
    result.splice(i,1);
  }
  return result;
 };
 return {valid:true,axis,gaps,blocks,breaks,map,mapPolyline,
  saved:removed,changed:true,
  proof:{kind:'axis-monotone-warp',axis,bound:maxLip,
   strictlyBelowOne:maxLip<1,continuous:true,exactPolylineSubdivision:true,
   gaps:gaps.length,saved:removed}};
}
export function applyAxisCorridorWarp(snapshot,config={}){
 const rects=snapshot.rects instanceof Map?snapshot.rects:new Map(snapshot.rects),
  positions=snapshot.positions instanceof Map?snapshot.positions:new Map(snapshot.positions),
  routes=snapshot.routes instanceof Map?snapshot.routes:new Map(snapshot.routes);
 const warp=createAxisCorridorWarp({rects,...config});
 if(!warp.valid)return {valid:false,reason:warp.reason};
 const ps=new Map(),rm=new Map(),rs=new Map();
 for(const [id,p] of positions)ps.set(id,warp.map(p));
 for(const [id,r] of rects){
  const p=ps.get(id);
  if(!p)return {valid:false,reason:'Centro faltante: '+id};
  // Demostrar que F(x) o F(y) es una TRASLACIÓN en el cuadro entero.
  const corners=[{x:r.l,y:r.t},{x:r.r,y:r.b}].map(warp.map);
  if(Math.abs(corners[1].x-corners[0].x-r.w)>.0001||
   Math.abs(corners[1].y-corners[0].y-r.h)>.0001)
   return {valid:false,reason:'La transformación no conserva un cuadro: '+id};
  rm.set(id,{...r,x:p.x,y:p.y,l:p.x-r.w/2,r:p.x+r.w/2,
   t:p.y-r.h/2,b:p.y+r.h/2});
 }
 for(const [key,route] of routes){
  if(!route?.points?.length||!route.fromPort||!route.toPort)
   return {valid:false,reason:'Ruta incompleta: '+key};
  const port=p=>{
   const point=warp.map(p),stub=warp.map({x:p.sx,y:p.sy});
   return {...p,...point,sx:stub.x,sy:stub.y};
  };
  rs.set(key,{...route,points:warp.mapPolyline(route.points),
   fromPort:port(route.fromPort),toPort:port(route.toPort)});
 }
 return {valid:true,changed:warp.changed,proof:warp.proof,
  snapshot:{...snapshot,positions:ps,rects:rm,routes:rs,
   proofs:[...(snapshot.proofs||[]),warp.proof]}};
}
