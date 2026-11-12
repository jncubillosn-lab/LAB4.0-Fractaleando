// Ensayo EXP-02-A: acercamiento independiente de hijos, SIN nueva norma.
// Deforma cuadros y todas las rutas mediante un campo local continuo e
// invertible. Después ortogonaliza y exige el validador completo de P1-ET-02.
const EPS=1e-8;
const same=(a,b)=>Math.abs(a.x-b.x)<EPS&&Math.abs(a.y-b.y)<EPS;

export function translateChildPatch(base,id,axis,delta,{innerPad=27,shoulder=40,elbow='end'}={}){
 if(!['x','y'].includes(axis)||!Number.isFinite(delta)||!delta||
  !(shoulder>Math.abs(delta)*2))return null;
 const r=base.rr.get(id),p=base.ps.get(id);
 if(!r||!p)return null;
 const bounds={
  x:[r.l-innerPad-shoulder,r.l-innerPad,r.r+innerPad,r.r+innerPad+shoulder],
  y:[r.t-innerPad-shoulder,r.t-innerPad,r.b+innerPad,r.b+innerPad+shoulder]
 };
 // Ningún otro cuadro participa del campo local: cada hijo se desplaza
 // de forma independiente; ninguna caja queda deformada.
 const [xl,, ,xr]=bounds.x,[yt,,,yb]=bounds.y;
 for(const [other,q] of base.rr){
  if(other===id)continue;
  if(q.r>xl&&q.l<xr&&q.b>yt&&q.t<yb)return null;
 }
 const bump=(z,[a,b,c,d])=>{
  if(z<=a||z>=d)return 0;
  if(z<b)return (z-a)/(b-a);
  if(z<=c)return 1;
  return (d-z)/(d-c);
 };
 const field=(point)=>{
  const value=bump(point.x,bounds.x)*bump(point.y,bounds.y)*delta;
  return axis==='x'?{x:point.x+value,y:point.y}:
   {x:point.x,y:point.y+value};
 };
 const newP=field(p);
 // Prueba local de consistencia: el centro debe moverse exactamente delta.
 if(Math.abs(newP[axis]-p[axis]-delta)>.00001)return null;
 const ps=new Map(base.ps),rr=new Map(base.rr);
 ps.set(id,newP);
 rr.set(id,{...r,x:newP.x,y:newP.y,
  l:newP.x-r.w/2,r:newP.x+r.w/2,t:newP.y-r.h/2,b:newP.y+r.h/2});
 // Un segmento puede atravesar varias zonas del campo: seccionarlo en
 // los quiebres del bump para mantener una rectificación determinista.
 const routePoints=(points)=>{
  if(!Array.isArray(points)||points.length<2)return null;
  const out=[field(points[0])];
  const push=v=>{if(!same(v,out[out.length-1]))out.push(v);};
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i];
   const horiz=Math.abs(a.y-b.y)<.01,vert=Math.abs(a.x-b.x)<.01;
   if(!horiz&&!vert)return null;
   const changing=horiz?'x':'y';
   const limits=bounds[changing];
   const v0=a[changing],v1=b[changing];
   const vCuts=limits.filter(v=>v>Math.min(v0,v1)+.0001&&v<Math.max(v0,v1)-.0001)
    .sort((x,y)=>v1>v0?x-y:y-x);
   const pts=[a,...vCuts.map(v=>horiz?{x:v,y:a.y}:{x:a.x,y:v}),b];
   for(let j=1;j<pts.length;j++){
    const from=field(pts[j-1]),to=field(pts[j]);
    push(from);
    if(Math.abs(from.x-to.x)>.005&&Math.abs(from.y-to.y)>.005){
     const bend=elbow==='start'?
      {x:to.x,y:from.y}:{x:from.x,y:to.y};
     push(bend);
    }
    push(to);
   }
  }
  // Eliminar puntos redundantes, sin cambiar el trazado.
  const simplified=[];
  for(const point of out){
   if(simplified.length&&same(point,simplified[simplified.length-1]))continue;
   simplified.push(point);
   while(simplified.length>=3){
    const a=simplified[simplified.length-3],b=simplified[simplified.length-2],
     c=simplified[simplified.length-1];
    if((Math.abs(a.x-b.x)<.01&&Math.abs(b.x-c.x)<.01)||
       (Math.abs(a.y-b.y)<.01&&Math.abs(b.y-c.y)<.01)){
     simplified.splice(simplified.length-2,1);
    }else break;
   }
  }
  return simplified;
 };
 const rs=new Map();
 for(const [key,rt] of base.rs){
  const points=routePoints(rt.points);
  if(!points)return null;
  const fromPort={...rt.fromPort,...field(rt.fromPort)};
  const toPort={...rt.toPort,...field(rt.toPort)};
  const fromStub=field({x:rt.fromPort.sx,y:rt.fromPort.sy});
  const toStub=field({x:rt.toPort.sx,y:rt.toPort.sy});
  fromPort.sx=fromStub.x;fromPort.sy=fromStub.y;
  toPort.sx=toStub.x;toPort.sy=toStub.y;
  rs.set(key,{...rt,points,fromPort,toPort});
 }
 return {ps,rr,rs,adaptive:{id,axis,delta,elbow}};
}

// Alternativa más útil que deformar trayectorias como goma: deslizar el
// último/primer codo de cada vínculo incidente con el hijo, conservando
// todos los demás tramos. El certificado externo rechaza cruces nuevos.
export function translateChildElastic(base,id,axis,delta){
 if(!['x','y'].includes(axis)||!Number.isFinite(delta)||!delta)return null;
 const old=base.ps.get(id),r=base.rr.get(id);
 if(!old||!r)return null;
 const p={...old,[axis]:old[axis]+delta};
 const rect={...r,x:p.x,y:p.y,l:p.x-r.w/2,r:p.x+r.w/2,
  t:p.y-r.h/2,b:p.y+r.h/2};
 const sweep={
  l:Math.min(r.l,rect.l),r:Math.max(r.r,rect.r),
  t:Math.min(r.t,rect.t),b:Math.max(r.b,rect.b)
 };
 for(const [other,q] of base.rr){
  if(other===id)continue;
  if(sweep.l<q.r+14&&sweep.r>q.l-14&&
    sweep.t<q.b+14&&sweep.b>q.t-14)return null;
 }
 const ps=new Map(base.ps),rr=new Map(base.rr),rs=new Map(base.rs);
 ps.set(id,p);rr.set(id,rect);
 const moveRoute=(rt,atStart)=>{
  if(!Array.isArray(rt.points)||rt.points.length<3)return null;
  const points=rt.points.map(p=>({...p}));
  const orig=rt.points,step=atStart?1:-1,endpoint=atStart?0:points.length-1;
  let j=endpoint;
  while(j>=0&&j<points.length){
   points[j][axis]+=delta;
   const k=j+step;
   if(k<0||k>=points.length)return null;
   // Si el segmento toca perpendicularmente el puerto, desplazar toda
   // su recta final hasta el primer codo; los demás vértices se mantienen.
   if(Math.abs(orig[j][axis]-orig[k][axis])<.005)j=k;
   else break;
  }
  if(points.slice(1).some((p,i)=>{
   const q=points[i];
   return Math.abs(p.x-q.x)>.005&&Math.abs(p.y-q.y)>.005;
  }))return null;
  const port={...(atStart?rt.fromPort:rt.toPort)};
  if(!port)return null;
  port[axis]+=delta;
  port[axis==='x'?'sx':'sy']+=delta;
  // Rechaza rutas con tramos nulos tras mover un codo.
  if(points.slice(1).some((p,i)=>Math.hypot(p.x-points[i].x,p.y-points[i].y)<.01))return null;
  return atStart?{...rt,points,fromPort:port}:{...rt,points,toPort:port};
 };
 for(const [key,rt] of base.rs){
  const start=rt.edge.from===id,end=rt.edge.to===id;
  if(!start&&!end)continue;
  if(start&&end)return null;
  const moved=moveRoute(rt,start);
  if(!moved)return null;
  rs.set(key,moved);
 }
 return {ps,rr,rs,adaptive:{id,axis,delta,type:'elastic'}};
}

// La selección es experimental: NO asume radio, fila ni separación entre
// Jn y Jn+1. Cada desplazamiento pasa 01, luego zona J1 y finalmente coste.
export function optimizeAdaptiveChildren({
 baseline,nodes,edges,zone,measure,certify,maxChecks=20,maxMoves=10
}){
 let best=baseline,checks=0,moves=0,proposals=0;
 const adj=new Map(nodes.map(n=>[n.id,0]));
 for(const e of edges){adj.set(e.from,(adj.get(e.from)||0)+1);adj.set(e.to,(adj.get(e.to)||0)+1);}
 const candidates=nodes.filter(n=>n.id!=='p1'&&n.parent&&n.parent!=='p1')
  .map(n=>({n,from:best.ps.get(n.id),parent:best.ps.get(n.parent)}))
  .filter(x=>x.from&&x.parent)
  .sort((a,b)=>(adj.get(a.n.id)||0)-(adj.get(b.n.id)||0)||
   (Math.abs(b.from.x-b.parent.x)+Math.abs(b.from.y-b.parent.y))-
   (Math.abs(a.from.x-a.parent.x)+Math.abs(a.from.y-a.parent.y)));
 const tried=new Set();
 for(let round=0;round<3&&checks<maxChecks&&moves<maxMoves;round++){
  for(const entry of candidates){
   if(checks>=maxChecks||moves>=maxMoves)break;
   const id=entry.n.id,parent=best.ps.get(entry.n.parent),child=best.ps.get(id);
   if(!parent||!child)continue;
   const deltaX=parent.x-child.x,deltaY=parent.y-child.y;
   // En cada intento solo se cambia UNA coordenada de UN hijo.
   const axes=Math.abs(deltaX)>Math.abs(deltaY)?
    [['x',deltaX],['y',deltaY]]:[['y',deltaY],['x',deltaX]];
   let accepted=false;
   for(const [axis,distance] of axes){
    if(Math.abs(distance)<6||accepted)continue;
    for(const magnitude of [18,12,8,4]){
     if(accepted||checks>=maxChecks)break;
     if(Math.abs(distance)<magnitude*1.5)continue;
     const delta=Math.sign(distance)*magnitude;
     // Se prueba primero el deslizamiento de codos: puede acortar la ruta
     // realmente recorrida, sin alterar trayectorias ajenas. El campo local
     // continuo es una alternativa, nunca un atajo para aprobar sin DRC.
     const strategies=[
      ['elastic',d=>translateChildElastic(best,id,axis,d)],
      ['patch-end',d=>translateChildPatch(best,id,axis,d,{elbow:'end'})],
      ['patch-start',d=>translateChildPatch(best,id,axis,d,{elbow:'start'})]
     ];
     for(const [strategy,build] of strategies){
      if(accepted||checks>=maxChecks)break;
      const key=id+':'+axis+':'+delta+':'+strategy+':'+round;
      if(tried.has(key))continue;tried.add(key);
      const proposal=build(delta);
      if(!proposal)continue;
      proposals++;
      const newLength=measure(proposal.rs);
      if(!Number.isFinite(newLength)||newLength>=best.length-.01)continue;
      const z=zone(proposal);
      if(!z.valid)continue;
      // Comprobar también tres puntos intermedios. El recorrido del cuadro
      // fue barrido contra todos los otros cuadros por translateChildElastic;
      // en cada instante muestreado se conservan DRC y registro de 01.
      let traversable=true;
      for(const fraction of [.25,.5,.75]){
       if(checks>=maxChecks){traversable=false;break;}
       const intermediate=build(delta*fraction);
       if(!intermediate||!zone(intermediate).valid){traversable=false;break;}
       checks++;
       if(!certify(intermediate)?.geometry?.ok){traversable=false;break;}
      }
      if(!traversable||checks>=maxChecks)continue;
      checks++;
      const trial=certify(proposal);
      if(trial?.geometry?.ok&&trial.zone.valid&&trial.length<best.length-.01){
       best={...trial,adaptiveHistory:[...(best.adaptiveHistory||[]),
        {...proposal.adaptive,improvement:best.length-trial.length}]};
       moves++;accepted=true;break;
      }
     }
    }
   }
  }
 }
 return {...best,adaptiveStats:{proposals,checks,moves,
  lastMoves:best.adaptiveHistory||[],variableSpacing:moves>0}};
}
