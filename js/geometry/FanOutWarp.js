// EXP-02-B: abanico desde J0 por una isotopía global demostrable.
// No elimina ni reconstruye rutas: transforma TODOS sus puntos con el
// MISMO homeomorfismo (x,y)->(F_y(x),y).
// F_y=(1-w(y))*x+w(y)*F_cerca(x), donde F_cerca es estrictamente
// creciente; por tanto F_y es estrictamente creciente para cada y.
// Las rutas pueden tener diagonales en el corredor vacío de deformación.
export function createFanOutWarp({nodes,positions,rects,routes,margin=48}){
 const ps=new Map(positions),rr=new Map(rects),rs=new Map(routes);
 const core=ps.get('p1'),coreRect=rr.get('p1');
 if(!core||!coreRect)return {valid:false,reason:'Sin J0'};
 const roots=nodes.filter(n=>n.parent==='p1')
  .sort((a,b)=>ps.get(a.id).x-ps.get(b.id).x);
 if(roots.length<2)return {valid:false,reason:'Menos de dos zonas'};
 const originalIds=roots.map(n=>n.id);
 const nearFloor=Math.max(coreRect.r-core.x,core.x-coreRect.l)+20;
 const maxWidth=Math.max(...roots.map(n=>rr.get(n.id).w),coreRect.w);
 const gap=maxWidth+margin;
 const targets=new Map(roots.map((n,i)=>[
  n.id,core.x+(i-(roots.length-1)/2)*gap
 ]));
 // Si el núcleo no ocupa el centro x de las raíces (N par), conservar
 // su orden mediante un intervalo central suficientemente amplio.
 const rootCenters=[...roots.map(n=>({id:n.id,x:ps.get(n.id).x,to:targets.get(n.id)})),
  {id:'p1',x:core.x,to:core.x}];
 rootCenters.sort((a,b)=>a.x-b.x||a.to-b.to);
 for(let i=1;i<rootCenters.length;i++)
  if(rootCenters[i].x<rootCenters[i-1].x-.01||
    rootCenters[i].to<rootCenters[i-1].to-.01)
   return {valid:false,reason:'No existe orden compatible de J0/J1'};
 const plateauByX=[];
 for(const t of rootCenters){
  const r=rr.get(t.id);
  const p={id:t.id,l:r.l-18,r:r.r+18,shift:t.to-t.x};
  const prev=plateauByX.at(-1);
  if(prev&&p.l<=prev.r+1){
   if(Math.abs(prev.shift-p.shift)>.001)return {
    valid:false,reason:'Núcleo y J1 exigen movimientos incompatibles'};
   prev.r=Math.max(prev.r,p.r);
  }else plateauByX.push(p);
 }
 // Los intervalos protegidos completos deben caber sin cambiar
 // el ancho de una sola caja. El exceso se rechaza, no se comprime.
 for(let i=1;i<plateauByX.length;i++){
  const a=plateauByX[i-1],b=plateauByX[i];
  if(a.r+a.shift>=b.l+b.shift-.01)return {
   valid:false,reason:'Las cajas J1 no caben junto al centro'};
 }
 const near=x=>{
  if(x<=plateauByX[0].r&&x>=plateauByX[0].l)return x+plateauByX[0].shift;
  if(x<plateauByX[0].l)return x+plateauByX[0].shift;
  for(let i=1;i<plateauByX.length;i++){
   const a=plateauByX[i-1],b=plateauByX[i];
   if(x<=b.l){
    const t=Math.max(0,Math.min(1,(x-a.r)/(b.l-a.r)));
    const left=a.r+a.shift,right=b.l+b.shift;
    return left+(right-left)*t;
   }
   if(x<=b.r)return x+b.shift;
  }
  return x+plateauByX.at(-1).shift;
 };
 const allRects=[...rr.values()];
 const rootsSet=new Set(['p1',...originalIds]);
 const rootBottom=Math.max(...allRects.filter(r=>rootsSet.has(r.id)).map(r=>r.b));
 const nextTop=Math.min(...allRects.filter(r=>!rootsSet.has(r.id)).map(r=>r.t));
 // Toda la deformación variable sucede en un corredor SIN ninguna caja.
 // Incluir los stubs de 19 unidades y margen de seguridad.
 const start=rootBottom+31,end=nextTop-18;
 if(end-start<38)return {valid:false,reason:'No hay corredor libre para girar las ramas'};
 const weight=y=>y<=start?1:y>=end?0:(end-y)/(end-start);
 const map=p=>({x:p.x+weight(p.y)*(near(p.x)-p.x),y:p.y});
 const mappedPositions=new Map([...ps].map(([id,p])=>[id,map(p)]));
 const mappedRects=new Map([...rr].map(([id,r])=>{
  const p=mappedPositions.get(id);
  return [id,{...r,x:p.x,y:p.y,l:p.x-r.w/2,r:p.x+r.w/2,
   t:p.y-r.h/2,b:p.y+r.h/2}];
 }));
 // Comprobar que toda caja ha sufrido una traslación RÍGIDA,
 // no una deformación de ancho que cambiaría puertos o tipografía.
 for(const [id,r] of rr){
  const target=mappedRects.get(id);
  for(const [x,y] of [[r.l,r.t],[r.r,r.t],[r.l,r.b],[r.r,r.b]]){
   const p=map({x,y}),shiftX=target.x-r.x;
   if(Math.abs(p.x-(x+shiftX))>.025)return {
    valid:false,reason:'Una caja sería deformada: '+id};
  }
 }
 const transformedRoutes=new Map();
 for(const [key,rt] of rs){
  if(!rt?.points)return {valid:false,reason:'Ruta incompleta en 01: '+key};
  const pts=[],input=rt.points;
  const push=p=>{
   if(!pts.length||Math.hypot(p.x-pts.at(-1).x,p.y-pts.at(-1).y)>.005)pts.push(p);
  };
  push(map(input[0]));
  for(let i=1;i<input.length;i++){
   const a=input[i-1],b=input[i];
   if(Math.abs(a.x-b.x)<.01&&Math.abs(a.y-b.y)>1){
    const cuts=[start,end].filter(y=>y>Math.min(a.y,b.y)+.01&&
     y<Math.max(a.y,b.y)-.01).sort((x,y)=>b.y>a.y?x-y:y-x);
    for(const y of cuts)push(map({x:a.x,y}));
   }
   push(map(b));
  }
  const mapPort=port=>{
   const p=map(port),stub=map({x:port.sx,y:port.sy});
   return {...port,...p,sx:stub.x,sy:stub.y};
  };
  transformedRoutes.set(key,{...rt,points:pts,
   fromPort:mapPort(rt.fromPort),toPort:mapPort(rt.toPort)});
 }
 const rootRadii=roots.map(n=>({
  id:n.id,old:Math.hypot(ps.get(n.id).x-core.x,ps.get(n.id).y-core.y),
  next:Math.hypot(mappedPositions.get(n.id).x-mappedPositions.get('p1').x,
   mappedPositions.get(n.id).y-mappedPositions.get('p1').y)
 }));
 return {valid:true,kind:'fanout',ps:mappedPositions,rr:mappedRects,
  rs:transformedRoutes,rootRadii,stretch:{start,end,margin},
  mapParameters:{plateaus:plateauByX,start,end},
  proof:'Monotonía estricta de F_y y de y; cada cuadro es traslación rígida; rutas transformadas íntegramente'};
}
