// Validador geométrico independiente para las rutas oblicuas del abanico.
// No modifica el enrutador ortogonal ni las vistas 01, 03 y 04.
// Cuenta las intersecciones REALES del trazado y compara pares y sucesiones
// con el registro oficial de 01.
const EPS=1e-7;
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const inRange=(x,a,b,margin=0)=>x>=Math.min(a,b)-margin&&x<=Math.max(a,b)+margin;
function intersect(a,b,c,d){
 const u=sub(b,a),v=sub(d,c),w=sub(c,a),den=cross(u,v);
 const tolerance=1e-8;
 if(Math.abs(den)<tolerance){
  if(Math.abs(cross(u,w))>tolerance)return null;
  const len2=u.x*u.x+u.y*u.y;
  if(len2<EPS)return {bad:'segmento vacío'};
  const t0=(w.x*u.x+w.y*u.y)/len2;
  const x=sub(d,a),t1=(x.x*u.x+x.y*u.y)/len2;
  if(Math.min(1,Math.max(t0,t1))-Math.max(0,Math.min(t0,t1))>2e-5)
   return {bad:'segmentos solapados'};
  return null;
 }
 const t=cross(w,v)/den,s=cross(w,u)/den;
 if(t>1e-5&&t<1-1e-5&&s>1e-5&&s<1-1e-5)
  return {at:{x:a.x+t*u.x,y:a.y+t*u.y},t,s};
 if(t>=-1e-6&&t<=1+1e-6&&s>=-1e-6&&s<=1+1e-6)
  return {nearEnd:true,at:{x:a.x+t*u.x,y:a.y+t*u.y},t,s};
 return null;
}
function segmentRectHit(a,b,r,pad=8){
 const lo={x:r.l-pad,y:r.t-pad},hi={x:r.r+pad,y:r.b+pad};
 let min=0,max=1;
 for(const axis of ['x','y']){
  const d=b[axis]-a[axis];
  if(Math.abs(d)<EPS){
   if(a[axis]<=lo[axis]||a[axis]>=hi[axis])return false;
  }else{
   let v=(lo[axis]-a[axis])/d,w=(hi[axis]-a[axis])/d;
   if(v>w)[v,w]=[w,v];
   min=Math.max(min,v);max=Math.min(max,w);
   if(max<=min+1e-7)return false;
  }
 }
 return max>=0&&min<=1;
}
function pointRectPort(p,r){
 if(!p||!r)return false;
 if(!['top','bottom','left','right'].includes(p.side))return false;
 if(![p.x,p.y,p.sx,p.sy].every(Number.isFinite))return false;
 if(p.side==='top'||p.side==='bottom')
  return p.x>r.l+3&&p.x<r.r-3&&
   Math.abs(p.y-(p.side==='top'?r.t:r.b))<.13&&
   Math.abs(p.sx-p.x)<.13&&
   Math.abs(p.sy-p.y-(p.side==='top'?-19:19))<.13;
 return p.y>r.t+3&&p.y<r.b-3&&
  Math.abs(p.x-(p.side==='left'?r.l:r.r))<.13&&
  Math.abs(p.sy-p.y)<.13&&
  Math.abs(p.sx-p.x-(p.side==='left'?-19:19))<.13;
}
export function auditFanOut({rects,routes,ordered,reference,edgeKey,clearance=8}){
 const rr=new Map(rects),rs=new Map(routes);
 const issues=[],flag=(type,item)=>{if(issues.length<30)issues.push({type,...item});};
 const allRects=[...rr.values()],segments=[],ports=new Map();
 const edgeMap=new Map(ordered.map((e,i)=>[edgeKey(e),{edge:e,index:i}]));
 let drawn=0,obstacles=0,portsInvalid=0,overlaps=0;
 for(let i=0;i<allRects.length;i++)for(let j=0;j<i;j++){
  const a=allRects[i],b=allRects[j];
  if(a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t){overlaps++;flag('box-overlap',{a:a.id,b:b.id});}
 }
 for(const e of ordered){
  const key=edgeKey(e),rt=rs.get(key);
  if(!rt?.points?.length){flag('pending',{key});continue;}
  drawn++;
  if(!pointRectPort(rt.fromPort,rr.get(e.from))||
     !pointRectPort(rt.toPort,rr.get(e.to))||
     dist(rt.fromPort,rt.points[0])>.15||
     dist(rt.toPort,rt.points.at(-1))>.15){
   portsInvalid++;flag('ports',{key});
  }
  for(const [id,p] of [[e.from,rt.fromPort],[e.to,rt.toPort]]){
   const arr=ports.get(id)||[];
   if(arr.some(other=>dist(other,p)<8)){portsInvalid++;flag('duplicate-port',{id,key});}
   arr.push(p);ports.set(id,arr);
  }
  let accumulated=0;
  const points=rt.points;
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],len=dist(a,b);
   if(len<EPS){flag('empty-segment',{key,i});continue;}
   for(const r of allRects){
    if([e.from,e.to].includes(r.id))continue;
    if(segmentRectHit(a,b,r,clearance)){obstacles++;flag('obstacle',{key,node:r.id,i});}
   }
   segments.push({key,a,b,len,offset:accumulated});
   accumulated+=len;
  }
 }
 const crossingsByPair=new Map(),events=new Map(ordered.map(e=>[edgeKey(e),[]]));
 let crosses=0,overlapRoutes=0,nearContacts=0;
 const routeOrder=new Map(ordered.map((e,i)=>[edgeKey(e),i]));
 for(let i=0;i<segments.length;i++){
  const a=segments[i];
  for(let j=0;j<i;j++){
   const b=segments[j];
   if(a.key===b.key)continue;
   // Descarta rápidamente pares cuyas cajas envolventes no se tocan.
   if(Math.max(a.a.x,a.b.x)<Math.min(b.a.x,b.b.x)-.01||
    Math.max(b.a.x,b.b.x)<Math.min(a.a.x,a.b.x)-.01||
    Math.max(a.a.y,a.b.y)<Math.min(b.a.y,b.b.y)-.01||
    Math.max(b.a.y,b.b.y)<Math.min(a.a.y,a.b.y)-.01)continue;
   const hit=intersect(a.a,a.b,b.a,b.b);
   if(!hit)continue;
   if(hit.bad){overlapRoutes++;flag('overlap-routes',{a:a.key,b:b.key});continue;}
   if(hit.nearEnd){
    // Un corte artificial introducido por la deformación no es una
    // nueva conexión. Su cruce puede estar justo en un vértice.
    // Agruparlo por coordenada en vez de contabilizarlo múltiples veces.
    nearContacts++;
   }
   const at=hit.at,old=events.get(a.key),oldOther=events.get(b.key);
   if(old.some(v=>v.other===b.key&&dist(v.at,at)<.06))continue;
   const pair=[a.key,b.key].sort(),k=JSON.stringify(pair);
   const total=crossingsByPair.get(k)||{a:pair[0],b:pair[1],count:0,
    over:routeOrder.get(pair[0])>routeOrder.get(pair[1])?pair[0]:pair[1]};
   total.count++;crossingsByPair.set(k,total);crosses++;
   old.push({other:b.key,at,offset:a.offset+dist(a.a,at)});
   oldOther.push({other:a.key,at,offset:b.offset+dist(b.a,at)});
  }
 }
 const crossings=[...crossingsByPair.values()].sort((a,b)=>a.a.localeCompare(b.a)||a.b.localeCompare(b.b));
 const crossingOrders=Object.fromEntries([...events].map(([k,ev])=>[
  k,ev.sort((a,b)=>a.offset-b.offset||a.other.localeCompare(b.other)).map(x=>x.other)
 ]));
 const before=new Map(reference.crossings.map(x=>[JSON.stringify([x.a,x.b]),x]));
 const after=new Map(crossings.map(x=>[JSON.stringify([x.a,x.b]),x]));
 let topologicalDifferences=0;
 for(const k of new Set([...before.keys(),...after.keys()])){
  const a=before.get(k),b=after.get(k);
  if(!a||!b||a.count!==b.count||a.over!==b.over){
   topologicalDifferences++;flag('crossing-identity',{pair:k,old:a?.count||0,next:b?.count||0});
  }
 }
 for(const key of new Set([...Object.keys(reference.crossingOrders),...Object.keys(crossingOrders)])){
  const a=reference.crossingOrders[key]||[],b=crossingOrders[key]||[];
  if(a.length!==b.length||a.some((v,i)=>v!==b[i])){
   topologicalDifferences++;flag('crossing-sequence',{key,old:a.slice(0,5),next:b.slice(0,5)});
  }
 }
 return {valid:drawn===ordered.length&&obstacles===0&&overlaps===0&&
  portsInvalid===0&&overlapRoutes===0&&topologicalDifferences===0&&nearContacts===0,
  drawn,expected:ordered.length,boxes:overlaps,invalid:obstacles+portsInvalid+overlapRoutes+nearContacts,
  crossings:crosses,sourceCrossings:reference.crossings.reduce((s,x)=>s+x.count,0),
  topologicalDifferences,overlapRoutes,nearContacts,details:issues,
  crossingSignature:{crossings,crossingOrders}};
}
