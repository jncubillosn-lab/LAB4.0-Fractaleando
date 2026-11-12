import {simplifyTransferredPolyline} from './PolylineSimplify.js';
// EXP-02-D · Homeomorfismo separable por cortes transversales.
// Para un eje móvil u y eje conservado v: (u,v) -> (F_v(u),v).
// Cada F_v es estrictamente creciente, y es combinación convexa de cartas
// monótonas. Los cuadros y sus extensiones de puerto se trasladan rígidamente.
// No genera un solo enlace nuevo ni borra los cruces antiguos.
export function warpCoordinate({positions,rects,routes=[],targets,axis='x',pad=19.25,skipRoutes=false}){
 const ps=new Map(positions),rr=new Map(rects),rs=new Map(routes||[]),
  desired=new Map(targets);
 const fixed=axis==='x'?'y':'x',low=axis==='x'?'l':'t',
  high=axis==='x'?'r':'b',fixLo=axis==='x'?'t':'l',
  fixHi=axis==='x'?'b':'r';
 const eps=.00001,all=[...rr.values()];
 const borders=all.flatMap(r=>[r[fixLo]-pad,r[fixHi]+pad])
  .concat(Math.min(...all.map(r=>r[fixLo]))-200,
   Math.max(...all.map(r=>r[fixHi]))+200);
 const knots=[...new Set(borders.map(n=>Math.round(n*1e7)/1e7))]
  .sort((a,b)=>a-b);
 const charts=[];
 for(const v of knots){
  const active=all.filter(r=>v>=r[fixLo]-pad-eps&&v<=r[fixHi]+pad+eps)
   .map(r=>({id:r.id,start:r[low]-pad,end:r[high]+pad,
    delta:(desired.get(r.id)??r[axis])-r[axis]}))
   .sort((a,b)=>a.start-b.start||a.end-b.end);
  const anchors=[];
  for(let j=0;j<active.length;j++){
   const item=active[j],prev=active[j-1];
   if(prev){
    if(item.start<prev.end-eps)return {
     valid:false,reason:'Dos cajas solapan la franja protegida '+prev.id+'/'+item.id};
    if(item.start+item.delta<=prev.end+prev.delta+eps)return {
     valid:false,reason:'El mapa invertiría '+prev.id+'/'+item.id};
   }
   anchors.push({old:item.start,next:item.start+item.delta,delta:item.delta});
   anchors.push({old:item.end,next:item.end+item.delta,delta:item.delta});
  }
  charts.push({v,anchors});
 }
 const evaluate=(chart,u)=>{
  const p=chart.anchors;
  if(!p.length)return u;
  if(u<=p[0].old)return u+p[0].delta;
  if(u>=p.at(-1).old)return u+p.at(-1).delta;
  let lo=0,hi=p.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(p[m].old<=u)lo=m;else hi=m;}
  const a=p[lo],b=p[hi],t=(u-a.old)/(b.old-a.old);
  return a.next+(b.next-a.next)*t;
 };
 const locate=v=>{
  if(v<=knots[0])return [0,0,0];
  if(v>=knots.at(-1))return [knots.length-1,knots.length-1,0];
  let lo=0,hi=knots.length-1;
  while(hi-lo>1){const m=(lo+hi)>>1;if(knots[m]<=v)lo=m;else hi=m;}
  return [lo,hi,(v-knots[lo])/(knots[hi]-knots[lo])];
 };
 const map=p=>{
  const [i,j,t]=locate(p[fixed]),u=evaluate(charts[i],p[axis])*(1-t)+
   evaluate(charts[j],p[axis])*t;
  return {...p,[axis]:u};
 };
 const positions2=new Map([...ps].map(([id,p])=>[id,map(p)]));
 const rects2=new Map([...rr].map(([id,r])=>{
  const p=positions2.get(id);
  return [id,{...r,[axis]:p[axis],
   [low]:p[axis]-(axis==='x'?r.w:r.h)/2,
   [high]:p[axis]+(axis==='x'?r.w:r.h)/2}];
 }));
 for(const [id,r] of rr){
  const shift=positions2.get(id)[axis]-r[axis];
  for(const x of [r.l,r.x,r.r])for(const y of [r.t,r.y,r.b]){
   const p=map({x,y});
   if(Math.abs(p[axis]-((axis==='x'?x:y)+shift))>.03)
    return {valid:false,reason:'Caja no rígida: '+id};
  }
 }
 const routes2=new Map();
 if(!skipRoutes)for(const [key,rt] of rs){
  if(!rt?.points?.length)return {valid:false,reason:'Ruta sin puntos '+key};
  const pts=[],push=p=>{
   const last=pts.at(-1);
   if(!last||Math.hypot(p.x-last.x,p.y-last.y)>.02)pts.push({x:p.x,y:p.y});
  };
  push(map(rt.points[0]));
  for(let i=1;i<rt.points.length;i++){
   const a=rt.points[i-1],b=rt.points[i],du=b[axis]-a[axis],
    dv=b[fixed]-a[fixed];
   const tt=[0,1];
   if(Math.abs(dv)>.01)for(const val of knots){
    const t=(val-a[fixed])/dv;
    if(t>1e-6&&t<1-1e-6)tt.push(t);
   }
   if(Math.abs(du)>.01){
    const [ia,ja]=locate(a[fixed]),[ib,jb]=locate(b[fixed]);
    const cutValues=new Set();
    for(let j=Math.min(ia,ib);j<=Math.max(ja,jb);j++)
     for(const z of charts[j].anchors)cutValues.add(z.old);
    for(const val of cutValues){
     const t=(val-a[axis])/du;
     if(t>1e-6&&t<1-1e-6)tt.push(t);
    }
   }
   tt.sort((u,v)=>u-v);
   const segments=tt.filter((t,j)=>!j||t-tt[j-1]>1e-6);
   for(let j=1;j<segments.length;j++){
    const lo=segments[j-1],hi=segments[j];
    const diagonal=Math.abs(du)>.01&&Math.abs(dv)>.01;
    const count=diagonal?Math.max(2,Math.ceil(Math.hypot(du,dv)*(hi-lo)/32)):1;
    for(let k=1;k<=count;k++){
     const t=lo+(hi-lo)*k/count;
     push(map({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t}));
    }
   }
  }
  const mapPort=p=>{
   const point=map({x:p.x,y:p.y}),stub=map({x:p.sx,y:p.sy});
   return {...p,...point,sx:stub.x,sy:stub.y};
  };
  routes2.set(key,{...rt,points:simplifyTransferredPolyline(pts,.25),
   fromPort:mapPort(rt.fromPort),toPort:mapPort(rt.toPort)});
 }
 return {valid:true,ps:positions2,rr:rects2,rs:routes2,mapPoint:map,
  charts:charts.length,axis,
  proof:'Cada F_v es estrictamente creciente; los cuadros y puertos tienen desplazamiento rígido'};
}
