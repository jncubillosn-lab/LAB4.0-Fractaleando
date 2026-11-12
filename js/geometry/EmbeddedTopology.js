// Auditoría geométrica y de inmersión para rutas rectas u oblicuas.
// No utiliza el enrutador PCB: compara pares, orden y orientación de cruces
// y el orden circular de los puertos. No modifica ningún dato.
const EPS=1e-7;
const key=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
const cross=(a,b)=>a.x*b.y-a.y*b.x;
const minus=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
const hyp=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const between=(x,a,b)=>x>=Math.min(a,b)-EPS&&x<=Math.max(a,b)+EPS;
const isFinitePoint=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
const oneOf=(x,...v)=>v.includes(x);
function contact(a,b,c,d){
 const r=minus(b,a),s=minus(d,c),den=cross(r,s),
  diff=minus(c,a);
 if(Math.abs(den)<EPS){
  if(Math.abs(cross(diff,r))>EPS*Math.max(1,hyp(a,b)))return null;
  // Dos segmentos colineales. Solo se considera solapamiento si
  // comparten un intervalo positivo, no un único extremo.
  const ax=Math.abs(r.x)>Math.abs(r.y)?'x':'y',
   low=Math.max(Math.min(a[ax],b[ax]),Math.min(c[ax],d[ax])),
   high=Math.min(Math.max(a[ax],b[ax]),Math.max(c[ax],d[ax]));
  return high-low>EPS?{overlap:true}:null;
 }
 const t=cross(diff,s)/den,u=cross(diff,r)/den;
 if(t<-EPS||t>1+EPS||u<-EPS||u>1+EPS)return null;
 return {overlap:false,t:Math.max(0,Math.min(1,t)),
  u:Math.max(0,Math.min(1,u)),
  p:{x:a.x+r.x*t,y:a.y+r.y*t},turn:Math.sign(den)};
}
function segmentRectInterior(a,b,r){
 // La línea entra en el rectángulo ABIERTO (no solo toca su borde).
 const eps=.00001;
 let min=0,max=1;
 for(const [origin,delta,lo,hi] of [
  [a.x,b.x-a.x,r.l+eps,r.r-eps],
  [a.y,b.y-a.y,r.t+eps,r.b-eps]
 ]){
  if(Math.abs(delta)<EPS){if(origin<=lo||origin>=hi)return false;continue;}
  const t1=(lo-origin)/delta,t2=(hi-origin)/delta;
  min=Math.max(min,Math.min(t1,t2));max=Math.min(max,Math.max(t1,t2));
  if(min>=max)return false;
 }
 return max>0&&min<1;
}
function perimeterIndex(p,r){
 const side=p.side;
 if(!oneOf(side,'top','right','bottom','left'))return NaN;
 const delta=side==='top'?Math.abs(p.y-r.t):
  side==='right'?Math.abs(p.x-r.r):
  side==='bottom'?Math.abs(p.y-r.b):Math.abs(p.x-r.l);
 if(delta>.12)return NaN;
 if(side==='top'&&(!between(p.x,r.l+2,r.r-2)))return NaN;
 if(side==='bottom'&&(!between(p.x,r.l+2,r.r-2)))return NaN;
 if(side==='left'&&(!between(p.y,r.t+2,r.b-2)))return NaN;
 if(side==='right'&&(!between(p.y,r.t+2,r.b-2)))return NaN;
 const x=(p.x-r.l)/r.w,y=(p.y-r.t)/r.h;
 return side==='top'?x:side==='right'?1+y:
  side==='bottom'?2+(1-x):3+(1-y);
}
function routeSegments(rt){
 const segments=[];let offset=0;
 for(let i=1;i<rt.points.length;i++){
  const a=rt.points[i-1],b=rt.points[i],len=hyp(a,b);
  if(!(len>EPS))return null;
  segments.push({a,b,offset,len,key:key(rt.edge)});
  offset+=len;
 }
 return {segments,total:offset};
}
const arrEq=(a,b)=>a.length===b.length&&a.every((x,i)=>x===b[i]);
export function captureEmbeddedTopology({positions,rects,routes,edges}){
 const ps=positions instanceof Map?positions:new Map(positions||[]),
  rs=routes instanceof Map?routes:new Map(routes||[]),
  rm=rects instanceof Map?rects:new Map(rects||[]);
 const problems=[],keys=edges?.map(key)||[],ports=new Map(),
  segments=[],routeInfo=new Map(),allRects=[...rm.values()],
  ordered=new Map(keys.map((k,i)=>[k,i]));
 if(!edges?.length||keys.length!==new Set(keys).size||rs.size!==keys.length)
  problems.push('Grafo de vínculos incompleto o duplicado');
 if(ps.size!==rm.size)problems.push('Geometría de nodos incompleta');
 for(const [id,p] of ps){
  const box=rm.get(id);
  if(!box||!isFinitePoint(p)||hyp(p,box)>.01)
   problems.push('Centro o cuadro incoherente: '+id);
 }
 let boxes=0,invalid=0,portsRepeated=0,segmentsOverlapped=0;
 for(let i=0;i<allRects.length;i++)for(let j=0;j<i;j++){
  const a=allRects[i],b=allRects[j];
  if(a.l<b.r-EPS&&a.r>b.l+EPS&&a.t<b.b-EPS&&a.b>b.t+EPS)boxes++;
 }
 if(boxes)problems.push('Cuadros solapados: '+boxes);
 for(const e of edges||[]){
  const k=key(e),rt=rs.get(k),src=rm.get(e.from),dst=rm.get(e.to);
  if(!rt||rt.edge?.from!==e.from||rt.edge?.to!==e.to||
   !Array.isArray(rt.points)||rt.points.length<2||!src||!dst||
   !rt.fromPort||!rt.toPort||rt.points.some(p=>!isFinitePoint(p))){
   invalid++;problems.push('Ruta ausente o malformada: '+k);continue;
  }
  const from=perimeterIndex(rt.fromPort,src),
   to=perimeterIndex(rt.toPort,dst);
  if(!Number.isFinite(from)||!Number.isFinite(to)||
   hyp(rt.points[0],rt.fromPort)>.12||
   hyp(rt.points.at(-1),rt.toPort)>.12){
   invalid++;problems.push('Puerto incorrecto: '+k);continue;
  }
  for(const [id,p,index] of [[e.from,rt.fromPort,from],[e.to,rt.toPort,to]]){
   if(!ports.has(id))ports.set(id,[]);
   ports.get(id).push({edge:k,id:p.id||null,side:p.side,index,x:p.x,y:p.y});
  }
  const shape=routeSegments(rt);
  if(!shape){invalid++;problems.push('Segmentos nulos: '+k);continue;}
  routeInfo.set(k,shape);
  for(const seg of shape.segments){
   for(const r of allRects)if(segmentRectInterior(seg.a,seg.b,r)){
    invalid++;problems.push('Un trayecto penetra el cuadro '+r.id+': '+k);
    break;
   }
   segments.push(seg);
  }
 }
 const portOrders={};
 for(const [id,list] of ports){
  list.sort((a,b)=>a.index-b.index||a.edge.localeCompare(b.edge));
  portOrders[id]=list.map(p=>p.edge);
  const seen=new Set();
  for(const p of list){
   const tag=Math.round(p.x*100)/100+':'+Math.round(p.y*100)/100;
   if(seen.has(tag)){portsRepeated++;problems.push('Puerto duplicado: '+id);}
   seen.add(tag);
  }
 }
 const crossingEvents=new Map(keys.map(k=>[k,[]])),
  pairs=new Map(),events=[];
 const index=new Map();
 for(const [k,info] of routeInfo)index.set(k,info.segments);
 // Revisión independiente: no depende de que las líneas sean ortogonales.
 for(let i=0;i<segments.length;i++)for(let j=0;j<i;j++){
  const a=segments[i],b=segments[j];
  if(a.key===b.key)continue;
  if(Math.max(a.a.x,a.b.x)<Math.min(b.a.x,b.b.x)-EPS||
     Math.max(b.a.x,b.b.x)<Math.min(a.a.x,a.b.x)-EPS||
     Math.max(a.a.y,a.b.y)<Math.min(b.a.y,b.b.y)-EPS||
     Math.max(b.a.y,b.b.y)<Math.min(a.a.y,a.b.y)-EPS)continue;
  const z=contact(a.a,a.b,b.a,b.b);
  if(!z)continue;
  if(z.overlap){segmentsOverlapped++;continue;}
  const atA=a.offset+a.len*z.t,atB=b.offset+b.len*z.u;
  if(atA<EPS||atB<EPS||atA>routeInfo.get(a.key).total-EPS||
     atB>routeInfo.get(b.key).total-EPS)continue;
  const akey=a.key<b.key?a.key:b.key,bkey=a.key<b.key?b.key:a.key;
  const tag=akey+'\u0000'+bkey;
  if(!pairs.has(tag))pairs.set(tag,[]);
  const matches=pairs.get(tag);
  if(matches.some(e=>hyp(e.p,z.p)<.002))continue;
  const over=ordered.get(akey)>ordered.get(bkey)?akey:bkey;
  const turn=a.key===akey?z.turn:-z.turn;
  const event={a:akey,b:bkey,p:z.p,over,turn,
   alongA:a.key===akey?atA:atB,
   alongB:b.key===bkey?atB:atA};
  matches.push(event);events.push(event);
  crossingEvents.get(akey)?.push({other:bkey,at:event.alongA,turn});
  crossingEvents.get(bkey)?.push({other:akey,at:event.alongB,turn});
 }
 const crossingOrders={};
 for(const [k,values] of crossingEvents){
  values.sort((a,b)=>a.at-b.at||a.other.localeCompare(b.other));
  crossingOrders[k]=values.map(v=>v.other+'|'+v.turn);
 }
 const crossings=[...pairs.values()].map(list=>({
  a:list[0].a,b:list[0].b,count:list.length,
  over:list[0].over,turns:list.map(e=>e.turn).sort()
 })).sort((a,b)=>a.a.localeCompare(b.a)||a.b.localeCompare(b.b));
 if(segmentsOverlapped)problems.push('Solapamiento de segmentos: '+segmentsOverlapped);
 return {valid:problems.length===0,problems:problems.slice(0,25),
  audit:{drawn:routeInfo.size,boxes,invalid,portsRepeated,segmentsOverlapped,
   crossings:events.length},
  signature:{nodes:[...ps.keys()].sort(),edges:[...keys].sort(),
   portOrders,crossings,crossingOrders},
  events};
}
function cyclicEqual(a,b){
 if(a.length!==b.length)return false;
 if(!a.length)return true;
 return Array.from({length:a.length},(_,i)=>i)
  .some(i=>a.every((v,j)=>v===b[(j+i)%b.length]));
}
export function compareEmbeddedTopology(a,b){
 const issues=[];
 if(!arrEq(a.nodes,b.nodes))issues.push('Identidad de nodos');
 if(!arrEq(a.edges,b.edges))issues.push('Identidad de vínculos');
 for(const id of new Set([...Object.keys(a.portOrders),...Object.keys(b.portOrders)]))
  if(!cyclicEqual(a.portOrders[id]||[],b.portOrders[id]||[]))
   issues.push('Orden circular de puertos: '+id);
 const pair=k=>k.a+'|'+k.b+'|'+k.count+'|'+k.over+'|'+k.turns.join(',');
 if(!arrEq(a.crossings.map(pair),b.crossings.map(pair)))
  issues.push('Pares, multiplicidad, sentido u orden de superposición de cruces');
 for(const e of a.edges)if(!arrEq(a.crossingOrders[e]||[],b.crossingOrders[e]||[]))
  issues.push('Secuencia de cruces: '+e);
 return {valid:issues.length===0,issueCount:issues.length,
  issues:issues.slice(0,32)};
}
