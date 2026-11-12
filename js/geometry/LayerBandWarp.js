// EXP-02-C · Rearreglo de jerarquías mediante un homeomorfismo vertical.
// Se aplica DESPUÉS del abanico que acercó los J1. Para cada x fijo,
// y -> G_x(y) es continua y estrictamente creciente: no cruza rutas.
// Se comprueba que cada cuadro mantiene su alto y ancho (traslación rígida).
// La elección de niveles no impone un radio igual entre hermanos.
export function createLayerWarp({nodes,positions,rects,routes,clearance=44}){
 const ps=new Map(positions),rr=new Map(rects),rs=new Map(routes);
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const depth=new Map([['p1',0]]),pending=new Set();
 const getDepth=id=>{
  if(depth.has(id))return depth.get(id);
  if(pending.has(id))throw Error('Ciclo de jerarquía: '+id);
  const n=byId.get(id);
  if(!n?.parent||!byId.has(n.parent))throw Error('Sin padre: '+id);
  pending.add(id);
  const d=getDepth(n.parent)+1;
  pending.delete(id);depth.set(id,d);
  return d;
 };
 try{for(const n of nodes)getDepth(n.id);}catch(e){
  return {valid:false,reason:e.message};
 }
 const root=ps.get('p1'),maxDepth=Math.max(...depth.values());
 const targetY=new Map([['p1',root.y]]);
 for(const n of nodes.filter(n=>depth.get(n.id)===1))
  targetY.set(n.id,ps.get(n.id).y);
 let lastRadius=Math.max(...nodes.filter(n=>depth.get(n.id)===1)
  .map(n=>Math.hypot(ps.get(n.id).x-root.x,ps.get(n.id).y-root.y)));
 const summaries=[];
 for(let d=2;d<=maxDepth;d++){
  const level=nodes.filter(n=>depth.get(n.id)===d)
   .sort((a,b)=>ps.get(a.id).y-ps.get(b.id).y||a.id.localeCompare(b.id));
  // La compactación vertical mínima de cada nivel es una ordenación de
  // intervalos sobre el mismo x: hijos en columnas diferentes pueden
  // estar a distintas alturas sin imponer una fila horizontal.
  const relative=new Map();
  for(const n of level){
   let low=0;
   const r=rr.get(n.id);
   for(const prior of level){
    if(!relative.has(prior.id))continue;
    const q=rr.get(prior.id);
    if(Math.min(r.r,q.r)-Math.max(r.l,q.l)<-40)continue;
    low=Math.max(low,relative.get(prior.id)+(r.h+q.h)/2+clearance);
   }
   relative.set(n.id,low);
  }
  const startY=root.y+lastRadius+clearance+10;
  let bandMax=0;
  for(const n of level){
   const y=startY+relative.get(n.id);
   targetY.set(n.id,y);
   bandMax=Math.max(bandMax,Math.hypot(ps.get(n.id).x-root.x,y-root.y));
  }
  summaries.push({level:d,first:startY,last:startY+Math.max(...relative.values()),radiusMax:bandMax,count:level.length});
  lastRadius=bandMax;
 }
 // Se obtienen funciones G_x, monótonas para cada coordenada x. Se
 // incluyen TODOS los puntos donde comienza/termina un rectángulo.
 const EPS=.0001,padX=19.5,padY=19.25;
 const limits=[...rr.values()].flatMap(r=>[r.l-padX,r.r+padX])
  .concat(Math.min(...[...rr.values()].map(r=>r.l))-300,
   Math.max(...[...rr.values()].map(r=>r.r))+300);
 const xs=[...new Set(limits.map(n=>Math.round(n*100)/100))].sort((a,b)=>a-b);
 const charts=[];
 for(const x of xs){
  const active=[...rr.values()].filter(r=>x>=r.l-padX-EPS&&x<=r.r+padX+EPS)
   .map(r=>({
    id:r.id,lo:r.t-padY,hi:r.b+padY,
    shift:targetY.get(r.id)-r.y
   })).sort((a,b)=>a.lo-b.lo||a.hi-b.hi);
  const anchors=[];
  for(const item of active){
   const prev=anchors.at(-1);
   if(prev&&item.lo<=prev.old+EPS){
    if(Math.abs(prev.shift-item.shift)>.01)return {
     valid:false,reason:'Cartas incompatibles '+prev.id+' / '+item.id};
    prev.old=Math.max(prev.old,item.hi);
    prev.new=prev.old+prev.shift;
   }else{
    if(prev&&prev.new>=item.lo+item.shift-.005)return {
     valid:false,reason:'Orden vertical invertido entre '+prev.id+' y '+item.id};
    anchors.push({id:item.id,old:item.lo,new:item.lo+item.shift,shift:item.shift});
    anchors.push({id:item.id,old:item.hi,new:item.hi+item.shift,shift:item.shift});
   }
  }
  // Comprobar monotonicidad de cada carta en todos sus anclajes.
  for(let i=1;i<anchors.length;i++)if(anchors[i].new<=anchors[i-1].new+EPS)
   return {valid:false,reason:'La carta vertical no es inyectiva en x='+x};
  charts.push({x,anchors});
 }
 const chartEval=(chart,y)=>{
  const arr=chart.anchors;
  if(!arr.length)return y;
  if(y<=arr[0].old)return y+arr[0].shift;
  if(y>=arr.at(-1).old)return y+arr.at(-1).shift;
  let lo=0,hi=arr.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(arr[mid].old<=y)lo=mid;else hi=mid;}
  const a=arr[lo],b=arr[hi],t=(y-a.old)/(b.old-a.old);
  return a.new+t*(b.new-a.new);
 };
 const findChart=x=>{
  if(x<=xs[0])return [0,0,0];
  if(x>=xs.at(-1))return [xs.length-1,xs.length-1,0];
  let lo=0,hi=xs.length-1;
  while(hi-lo>1){const mid=(lo+hi)>>1;if(xs[mid]<=x)lo=mid;else hi=mid;}
  return [lo,hi,(x-xs[lo])/(xs[hi]-xs[lo])];
 };
 const map=p=>{
  const [i,j,t]=findChart(p.x);
  return {x:p.x,y:chartEval(charts[i],p.y)*(1-t)+chartEval(charts[j],p.y)*t};
 };
 const mappedPositions=new Map([...ps].map(([id,p])=>[id,map(p)]));
 const mappedRects=new Map([...rr].map(([id,r])=>{
  const p=mappedPositions.get(id);
  return [id,{...r,x:p.x,y:p.y,t:p.y-r.h/2,b:p.y+r.h/2}];
 }));
 for(const [id,r] of rr){
  const target=mappedRects.get(id),delta=target.y-r.y;
  for(const x of [r.l,r.x,r.r])for(const y of [r.t,r.b]){
   const p=map({x,y});
   if(Math.abs(p.y-(y+delta))>.05)return {
    valid:false,reason:'La carta deforma el cuadro '+id};
  }
 }
 // Para reconstruir exactamente la imagen de un segmento recto:
 // dividir en cada x anclada y en cada y anclada que pueda cruzarse.
 // En cada celda G_x es bilineal; una diagonal se muestrea para
 // controlar el error, las rectas horizontales/verticales son lineales.
 const mappedRoutes=new Map();
 for(const [key,rt] of rs){
  const old=rt.points,pts=[],push=p=>{
   if(!pts.length||Math.hypot(p.x-pts.at(-1).x,p.y-pts.at(-1).y)>.02)pts.push(p);
  };
  push(map(old[0]));
  for(let i=1;i<old.length;i++){
   const a=old[i-1],b=old[i],dx=b.x-a.x,dy=b.y-a.y;
   const splits=[0,1];
   if(Math.abs(dx)>.01){
    for(const x of xs){
     const t=(x-a.x)/dx;
     if(t>1e-6&&t<1-1e-6)splits.push(t);
    }
   }
   if(Math.abs(dy)>.01){
    const yCuts=new Set();
    // Anclajes de las cartas que rodean el segmento.
    const [ia,ja]=findChart(a.x),[ib,jb]=findChart(b.x);
    const from=Math.min(ia,ib),to=Math.max(ja,jb);
    for(let z=from;z<=to;z++)for(const p of charts[z].anchors)yCuts.add(p.old);
    for(const y of yCuts){
     const t=(y-a.y)/dy;
     if(t>1e-6&&t<1-1e-6)splits.push(t);
    }
   }
   splits.sort((x,y)=>x-y);
   const unique=splits.filter((v,j)=>j===0||v-splits[j-1]>1e-6);
   for(let s=1;s<unique.length;s++){
    const start=unique[s-1],end=unique[s];
    const isDiagonal=Math.abs(dx)>.01&&Math.abs(dy)>.01;
    const count=isDiagonal?Math.max(2,Math.ceil((end-start)*Math.hypot(dx,dy)/24)):1;
    for(let step=1;step<=count;step++){
     const v=start+(end-start)*step/count;
     push(map({x:a.x+dx*v,y:a.y+dy*v}));
    }
   }
  }
  const mapPort=p=>{
   const a=map(p),stub=map({x:p.sx,y:p.sy});
   return {...p,...a,sx:stub.x,sy:stub.y};
  };
  mappedRoutes.set(key,{...rt,points:pts,fromPort:mapPort(rt.fromPort),toPort:mapPort(rt.toPort)});
 }
 return {valid:true,kind:'layered-homeomorphism',
  ps:mappedPositions,rr:mappedRects,rs:mappedRoutes,
  bands:summaries,charts:charts.length,
  proof:'Para cada x, G_x es estrictamente creciente; interpolación convexa entre cartas positivas'};
}
