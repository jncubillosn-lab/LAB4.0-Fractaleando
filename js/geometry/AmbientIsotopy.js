// P1-ET-02: Isotopía ambiental certificada.
// Mueve el plano entero por una aplicación continua H_t(p)=p+t*u(p).
// El campo u es afín en cada triángulo de una retícula local 3x3.
// La cota max ||Du||_2 < 1 garantiza inyectividad de TODOS los H_t,
// incluyendo los instantes intermedios. No hay reenrutamiento.
const EPS=1e-9;
const hypot=(a,b)=>Math.hypot(a,b);
const close=(a,b,e=1e-7)=>hypot(a.x-b.x,a.y-b.y)<=e;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const move=(a,b,t)=>({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});
const keyRoute=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
const isRect=r=>r&&[r.x,r.y,r.w,r.h,r.l,r.r,r.t,r.b].every(Number.isFinite)&&
 r.w>0&&r.h>0&&Math.abs(r.l-(r.x-r.w/2))<.01&&
 Math.abs(r.t-(r.y-r.h/2))<.01;
function rigidZone(box,bounds){
 // Cuadros, perímetros y stubs no pueden ser deformados: únicamente
 // una traslación rígida dentro de la meseta, o identidad afuera.
 const [xl,xi,xj,xr]=bounds.x,[yt,yi,yj,yb]=bounds.y;
 if(box.l>=xi-EPS&&box.r<=xj+EPS&&box.t>=yi-EPS&&box.b<=yj+EPS)return 'inside';
 if(box.r<=xl+EPS||box.l>=xr-EPS||box.b<=yt+EPS||box.t>=yb-EPS)return 'outside';
 return 'mixed';
}
function unique(values){
 return values.filter(Number.isFinite).sort((a,b)=>a-b)
  .filter((n,i,a)=>i===0||n-a[i-1]>1e-10);
}
function segmentParameter(a,b,c,d){
 const r=sub(b,a),s=sub(d,c),den=cross(r,s);
 if(Math.abs(den)<=EPS)return null;
 const ca=sub(c,a),t=cross(ca,s)/den,u=cross(ca,r)/den;
 return t>EPS&&t<1-EPS&&u>=-EPS&&u<=1+EPS?t:null;
}
function simplify(points){
 const res=[];
 for(const p of points){
  if(res.length&&close(res.at(-1),p,1e-8))continue;
  res.push(p);
  while(res.length>2){
   const a=res[res.length-3],b=res[res.length-2],c=res.at(-1);
   const v=sub(b,a),w=sub(c,b);
   if(Math.abs(cross(v,w))<=1e-7*Math.max(1,hypot(v.x,v.y)+hypot(w.x,w.y))&&
    v.x*w.x+v.y*w.y>=-EPS)res.splice(res.length-2,1);
   else break;
  }
 }
 return res;
}
export function createCertifiedPatch({rects,targetId,targetIds=null,dx=0,dy=0,pad=24,shoulder=54}){
 const rm=rects instanceof Map?rects:new Map(rects||[]);
 const ids=targetIds||[targetId],selected=new Set(ids);
 const group=ids.map(id=>rm.get(id));
 const target=group[0],amount=hypot(dx,dy);
 if(!ids.length||ids.length!==selected.size||group.some(r=>!isRect(r))||
    !Number.isFinite(amount)||amount<EPS||
  !Number.isFinite(pad)||pad<21||!Number.isFinite(shoulder)||shoulder<=0)
  return {valid:false,reason:'Parámetros o cuadro inicial inválidos'};
 const envelope={l:Math.min(...group.map(r=>r.l)),r:Math.max(...group.map(r=>r.r)),
  t:Math.min(...group.map(r=>r.t)),b:Math.max(...group.map(r=>r.b))};
 const xs=[envelope.l-pad-shoulder,envelope.l-pad,
  envelope.r+pad,envelope.r+pad+shoulder];
 const ys=[envelope.t-pad-shoulder,envelope.t-pad,
  envelope.b+pad,envelope.b+pad+shoulder];
 const bounds={x:xs,y:ys},fixed=[];
 for(const [id,rect] of rm){
  if(!isRect(rect))return {valid:false,reason:'Rectángulo inválido: '+id};
  const zone=rigidZone(rect,bounds);
  if(zone==='mixed'||(selected.has(id)&&zone!=='inside')||
   (!selected.has(id)&&zone!=='outside'))
   return {valid:false,reason:'La meseta afectaría otro cuadro: '+id};
  fixed.push({id,zone});
 }
 const weights=(i,j)=>(i===1||i===2)&&(j===1||j===2)?1:0;
 let maxLip=0;
 for(let i=0;i<3;i++)for(let j=0;j<3;j++){
  const w=xs[i+1]-xs[i],h=ys[j+1]-ys[j],
   p00=weights(i,j),p10=weights(i+1,j),
   p11=weights(i+1,j+1),p01=weights(i,j+1);
  const gradients=[
   {x:(p10-p00)/w,y:(p11-p10)/h},
   {x:(p11-p01)/w,y:(p01-p00)/h}
  ];
  for(const g of gradients)maxLip=Math.max(maxLip,amount*hypot(g.x,g.y));
 }
 // Es una cota de la norma del Jacobiano del desplazamiento.
 // <1 asegura la biyección global para cada t, sin pliegues.
 if(!(maxLip<1-1e-6))
  return {valid:false,reason:'No certificable: la cota Lipschitz es >=1',
   maxLip};
 const weight=p=>{
  if(p.x<=xs[0]||p.x>=xs[3]||p.y<=ys[0]||p.y>=ys[3])return 0;
  let i=0,j=0;
  while(i<2&&p.x>xs[i+1])i++;
  while(j<2&&p.y>ys[j+1])j++;
  const u=(p.x-xs[i])/(xs[i+1]-xs[i]),
   v=(p.y-ys[j])/(ys[j+1]-ys[j]),
   a=weights(i,j),b=weights(i+1,j),c=weights(i+1,j+1),d=weights(i,j+1);
  return u>=v?a+(b-a)*u+(c-b)*v:a+(c-d)*u+(d-a)*v;
 };
 const map=(p,t=1)=>{
  const z=weight(p)*t;
  return {x:p.x+dx*z,y:p.y+dy*z};
 };
 // Cortes EXACTOS contra todas las fronteras de triángulos.
 // Cada subsegmento de la imagen queda recto: la polilínea resultante
 // es la imagen matemática exacta, no una muestra aproximada.
 const mapPolyline=(points,t=1)=>{
  if(!Array.isArray(points)||points.length<2)return null;
  const result=[];
  for(let k=1;k<points.length;k++){
   const a=points[k-1],b=points[k];
   if(!a||!b||!Number.isFinite(a.x+b.x+a.y+b.y)||close(a,b))return null;
   const splits=[0,1];
   for(const x of xs)if(Math.abs(b.x-a.x)>EPS){
    const z=(x-a.x)/(b.x-a.x);
    if(z>EPS&&z<1-EPS)splits.push(z);
   }
   for(const y of ys)if(Math.abs(b.y-a.y)>EPS){
    const z=(y-a.y)/(b.y-a.y);
    if(z>EPS&&z<1-EPS)splits.push(z);
   }
   for(let i=0;i<3;i++)for(let j=0;j<3;j++){
    const z=segmentParameter(a,b,{x:xs[i],y:ys[j]},
     {x:xs[i+1],y:ys[j+1]});
    if(z!==null)splits.push(z);
   }
   for(const s of unique(splits))result.push(map(move(a,b,s),t));
  }
  const simplified=simplify(result);
  return simplified.length>=2&&simplified.length<=2500?simplified:null;
 };
 return {valid:true,kind:'ambient-isotopy-triangulated',
  targetId,targetIds:[...ids],dx,dy,pad,shoulder,bounds,maxLip,rigid:fixed,
  proof:{kind:'global-lipschitz',bound:maxLip,strictlyBelowOne:true,
   continuous:true,affineTriangles:18,exactPolylineSubdivision:true},
  map,mapPolyline};
}
export function applyCertifiedPatch(snapshot,request){
 const positions=snapshot.positions instanceof Map?snapshot.positions:new Map(snapshot.positions),
  rects=snapshot.rects instanceof Map?snapshot.rects:new Map(snapshot.rects),
  routes=snapshot.routes instanceof Map?snapshot.routes:new Map(snapshot.routes);
 const patch=createCertifiedPatch({rects,...request});
 if(!patch.valid)return {valid:false,reason:patch.reason,proof:patch};
 const edges=snapshot.edges||[];
 const edgeKeys=new Set(edges.map(keyRoute));
 if(!edges.length||edges.length!==routes.size||edgeKeys.size!==edges.length||
  [...edgeKeys].some(key=>!routes.has(key)))
  return {valid:false,reason:'No hay un plano completo y verificable de rutas'};
 const transformedPositions=new Map(),transformedRects=new Map();
 for(const [id,p] of positions)transformedPositions.set(id,patch.map(p));
 for(const [id,r] of rects){
  const p=transformedPositions.get(id),q=patch.map({x:r.x,y:r.y});
  if(!p||!close(p,q))return {valid:false,reason:'Centro inconsistente: '+id};
  transformedRects.set(id,{...r,x:p.x,y:p.y,
   l:p.x-r.w/2,r:p.x+r.w/2,t:p.y-r.h/2,b:p.y+r.h/2});
 }
 const nextRoutes=new Map();
 for(const e of edges){
  const key=keyRoute(e),rt=routes.get(key);
  if(!rt||!Array.isArray(rt.points)||rt.points.length<2||
   rt.edge?.from!==e.from||rt.edge?.to!==e.to||
   !rt.fromPort||!rt.toPort)
   return {valid:false,reason:'Ruta original incompleta: '+key};
  const points=patch.mapPolyline(rt.points);
  if(!points)return {valid:false,reason:'No se pudo transformar exactamente '+key};
  const port=p=>{
   const q=patch.map(p),stub=patch.map({x:p.sx,y:p.sy});
   return {...p,...q,sx:stub.x,sy:stub.y};
  };
  const fromPort=port(rt.fromPort),toPort=port(rt.toPort);
  if(!close(points[0],fromPort)||!close(points.at(-1),toPort))
   return {valid:false,reason:'Puerto desconectado tras deformación: '+key};
  nextRoutes.set(key,{...rt,points,fromPort,toPort});
 }
 const next={...snapshot,positions:transformedPositions,rects:transformedRects,
  routes:nextRoutes,proofs:[...(snapshot.proofs||[]),patch.proof],
  lastPatch:{targetId:request.targetId,targetIds:request.targetIds||[request.targetId],
   dx:request.dx,dy:request.dy,
   maxLip:patch.maxLip,segments:edges.length}};
 return {valid:true,snapshot:next,proof:patch.proof,patch};
}


export function translateWholePlane(snapshot,dx,dy){
 // La traslación global también es una isotopía ambiental, H_t=p+t*d,
 // con Lipschitz del desplazamiento exactamente cero.
 if(![dx,dy].every(Number.isFinite))return {valid:false,reason:'Traslación inválida'};
 const map=p=>({x:p.x+dx,y:p.y+dy});
 const positions=new Map(snapshot.positions instanceof Map?
  snapshot.positions:snapshot.positions||[]);
 const rects=new Map(snapshot.rects instanceof Map?
  snapshot.rects:snapshot.rects||[]);
 const routes=new Map(snapshot.routes instanceof Map?
  snapshot.routes:snapshot.routes||[]);
 for(const [id,p] of positions)positions.set(id,map(p));
 for(const [id,r] of rects){
  const p=positions.get(id);
  if(!p)return {valid:false,reason:'Cuadro sin centro: '+id};
  rects.set(id,{...r,x:p.x,y:p.y,l:p.x-r.w/2,r:p.x+r.w/2,
   t:p.y-r.h/2,b:p.y+r.h/2});
 }
 for(const [key,rt] of routes){
  if(!rt?.points||!rt.fromPort||!rt.toPort)
   return {valid:false,reason:'Ruta inexistente: '+key};
  const port=p=>({...p,...map(p),sx:p.sx+dx,sy:p.sy+dy});
  routes.set(key,{...rt,points:rt.points.map(map),
   fromPort:port(rt.fromPort),toPort:port(rt.toPort)});
 }
 const proof={kind:'global-translation',bound:0,continuous:true,
  strictlyBelowOne:true,exactPolylineSubdivision:true};
 return {valid:true,proof,snapshot:{...snapshot,positions,rects,routes,
  proofs:[...(snapshot.proofs||[]),proof]}};
}
