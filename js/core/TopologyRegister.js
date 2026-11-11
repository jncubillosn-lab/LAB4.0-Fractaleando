// Registro topológico independiente de la geometría métrica de P1.
// Conserva órdenes y cruces, no coordenadas ni distancias absolutas.
// No modifica rutas ni cuadros: describe, compara y valida puntos de control.
export class TopologyRegister {
 constructor({edgeKey}) {
  this.edgeKey=edgeKey;
  this.reset();
 }
 reset(){
  this.reference=null;
  this.latest=null;
  this.report={valid:true,issues:[],counts:{},compared:false};
 }
 // Se admiten únicamente registros generados con esta versión.
 static validShape(value){
  if(!value||value.schema!=='p1.topology.v1'||!value.ports||!value.nodeOrders||
     !Array.isArray(value.edges)||!value.crossingOrders||!Array.isArray(value.crossings)||
     !Array.isArray(value.neighbors)||!Array.isArray(value.pending)||
     !Array.isArray(value.nodeOrders.x)||!Array.isArray(value.nodeOrders.y))return false;
  const edgeSet=new Set(value.edges);
  if(value.edges.some(k=>typeof k!=='string')||edgeSet.size!==value.edges.length)return false;
  if(value.pending.some(k=>!edgeSet.has(k))||new Set(value.pending).size!==value.pending.length)return false;
  for(const list of Object.values(value.ports)){
   if(!Array.isArray(list))return false;
   const ids=new Set(),edges=new Set();
   for(const p of list){
    if(!p||typeof p.edge!=='string'||!edgeSet.has(p.edge)||typeof p.id!=='string'||
       !['top','right','bottom','left'].includes(p.side)||ids.has(p.id)||edges.has(p.edge))return false;
    ids.add(p.id);edges.add(p.edge);
   }
  }
  for(const axis of ['x','y']){
   const seen=new Set();
   for(const group of value.nodeOrders[axis]){
    if(!Array.isArray(group)||!group.length)return false;
    for(const id of group){if(typeof id!=='string'||seen.has(id))return false;seen.add(id);}
   }
  }
  if(Object.entries(value.crossingOrders).some(([k,order])=>!edgeSet.has(k)||!Array.isArray(order)||order.some(o=>!edgeSet.has(o))))return false;
  if(value.crossings.some(c=>!c||typeof c.a!=='string'||typeof c.b!=='string'||
     !edgeSet.has(c.a)||!edgeSet.has(c.b)||c.a>=c.b||!Number.isSafeInteger(c.count)||c.count<1||
     ![c.a,c.b].includes(c.over)))return false;
  if(value.neighbors.some(c=>!c||typeof c.a!=='string'||typeof c.b!=='string'||!edgeSet.has(c.a)||
     !edgeSet.has(c.b)||c.a>=c.b||!['h','v'].includes(c.axis)||![1,-1].includes(c.side)))return false;
  return true;
 }
 restore(value){
  if(!TopologyRegister.validShape(value))return false;
  this.reference=structuredClone(value);
  this.latest=null;
  this.report={valid:true,issues:[],counts:{},compared:false};
  return true;
 }
 capture({positions,rects,routes,edges}){
  const keys=[],routed=new Map(),ports={};
  for(const e of edges){
   const key=this.edgeKey(e);
   if(keys.includes(key))continue;
   keys.push(key);
   const rt=routes.get(key);
   if(!rt?.points||rt.points.length<2)continue;
   routed.set(key,rt);
   for(const [nodeId,port] of [[e.from,rt.fromPort],[e.to,rt.toPort]]){
    if(!port||!rects.has(nodeId))continue;
    (ports[nodeId]??=[]).push({edge:key,side:port.side,
     coordinate:port.side==='top'||port.side==='bottom'?port.x:port.y});
   }
  }
  // Recorrido horario del perímetro: arriba, derecha, abajo, izquierda.
  const sideRank={top:0,right:1,bottom:2,left:3};
  for(const [nodeId,list] of Object.entries(ports)){
   const old=new Map((this.reference?.ports?.[nodeId]||[]).map(x=>[x.edge,x.id]));
   const used=new Set([...old.values()]);
   let next=0;
   for(const id of used){
    const match=id.match(/:p(\d+)$/);
    if(match)next=Math.max(next,Number(match[1]));
   }
   list.sort((a,b)=>sideRank[a.side]-sideRank[b.side]||
    (a.side==='bottom'||a.side==='left'?b.coordinate-a.coordinate:a.coordinate-b.coordinate)||
    a.edge.localeCompare(b.edge));
   for(const item of list){
    item.id=old.get(item.edge);
    if(!item.id){
     do {next++;item.id=nodeId+':p'+next;}while(used.has(item.id));
     used.add(item.id);
    }
    delete item.coordinate;
   }
  }
  const rankAxis=axis=>{
   const nodes=[...positions.entries()].filter(([,p])=>p&&Number.isFinite(p[axis]))
    .map(([id,p])=>({id,v:p[axis]})).sort((a,b)=>a.v-b.v||a.id.localeCompare(b.id));
   const groups=[];
   for(const entry of nodes){
    const last=groups.at(-1);
    if(last&&Math.abs(entry.v-last.value)<=.05)last.ids.push(entry.id);
    else groups.push({value:entry.v,ids:[entry.id]});
   }
   return groups.map(g=>g.ids);
  };
  const crossingOrders=Object.fromEntries(keys.map(k=>[k,[]]));
  const crossingPairs=new Map();
  const segments=[];
  const length=(a,b)=>Math.abs(b.x-a.x)+Math.abs(b.y-a.y);
  for(const [key,route] of routed){
   let total=0;
   for(let i=1;i<route.points.length;i++){
    const a=route.points[i-1],b=route.points[i];
    const len=length(a,b);
    if(len<.05)continue;
    segments.push({key,a,b,h:Math.abs(a.y-b.y)<.01,offset:total,len});
    total+=len;
   }
  }
  const crossEvents=new Map(keys.map(k=>[k,[]]));
  const between=(v,a,b)=>v>Math.min(a,b)+.05&&v<Math.max(a,b)-.05;
  const near=(v,a,b)=>v>=Math.min(a,b)-.05&&v<=Math.max(a,b)+.05;
  const sortedPair=(a,b)=>a<b?[a,b]:[b,a];
  // Cada cruce se reconoce por las dos rutas y por su posición relativa
  // a lo largo de cada una; no se guarda la coordenada del cruce.
  for(let i=0;i<segments.length;i++){
   const u=segments[i];
   for(let j=0;j<i;j++){
    const v=segments[j];
    if(u.key===v.key||u.h===v.h)continue;
    const x=u.h?v.a.x:u.a.x,y=u.h?u.a.y:v.a.y;
    if(!near(x,u.a.x,u.b.x)||!near(x,v.a.x,v.b.x)||
       !near(y,u.a.y,u.b.y)||!near(y,v.a.y,v.b.y))continue;
    // Los extremos no se interpretan como cruces entre rutas.
    if(!between(x,u.a.x,u.b.x)&&u.h || !between(y,u.a.y,u.b.y)&&!u.h ||
       !between(x,v.a.x,v.b.x)&&v.h || !between(y,v.a.y,v.b.y)&&!v.h)continue;
    const [a,b]=sortedPair(u.key,v.key);
    const pairKey=JSON.stringify([a,b]);
    const old=crossingPairs.get(pairKey)||{a,b,count:0,over:null};
    old.count++;
    // Como el SVG dibuja en el orden de edges, la última ruta
    // se representa sobre la primera cuando hay un salto.
    const orderA=keys.indexOf(a),orderB=keys.indexOf(b);
    old.over=orderA>orderB?a:b;
    crossingPairs.set(pairKey,old);
    const atU=u.offset+length(u.a,{x,y});
    const atV=v.offset+length(v.a,{x,y});
    crossEvents.get(u.key).push({other:v.key,at:atU});
    crossEvents.get(v.key).push({other:u.key,at:atV});
   }
  }
  for(const [key,events] of crossEvents){
   events.sort((a,b)=>a.at-b.at||a.other.localeCompare(b.other));
   crossingOrders[key]=events.map(e=>e.other);
  }
  // Vecindad de carriles ortogonales: primero el segmento vecino más próximo
  // por cada lado de un tramo con proyección compartida. El signo es estable
  // ante traslación y escalado positivo; las distancias no se serializan.
  const sizes=[...rects.values()];
  const scaleX=sizes.length?sizes.reduce((a,r)=>a+r.w,0)/sizes.length:150;
  const scaleY=sizes.length?sizes.reduce((a,r)=>a+r.h,0)/sizes.length:60;
  const corridor=new Map();
  for(let i=0;i<segments.length;i++){
   const u=segments[i];
   const best={positive:null,negative:null};
   const pu=u.h?u.a.y:u.a.x;
   for(let j=0;j<segments.length;j++){
    if(i===j)continue;
    const v=segments[j];
    if(v.key===u.key||v.h!==u.h)continue;
    const pv=u.h?v.a.y:v.a.x;
    const dist=pv-pu,delta=Math.abs(dist);
    const maxGap=u.h?2*scaleY:1.2*scaleX;
    if(delta<.05||delta>maxGap)continue;
    const ulo=Math.min(u.h?u.a.x:u.a.y,u.h?u.b.x:u.b.y);
    const uhi=Math.max(u.h?u.a.x:u.a.y,u.h?u.b.x:u.b.y);
    const vlo=Math.min(u.h?v.a.x:v.a.y,u.h?v.b.x:v.b.y);
    const vhi=Math.max(u.h?v.a.x:v.a.y,u.h?v.b.x:v.b.y);
    const overlap=Math.min(uhi,vhi)-Math.max(ulo,vlo);
    if(overlap<Math.max(8,Math.min(u.len,v.len)*.12))continue;
    const side=dist>0?'positive':'negative';
    const found=best[side];
    if(!found||delta<found.delta)best[side]={v,delta};
   }
   for(const match of Object.values(best)){
    if(!match)continue;
    const v=match.v,[a,b]=sortedPair(u.key,v.key);
    const aCoord=a===u.key?pu:(u.h?v.a.y:v.a.x);
    const bCoord=b===u.key?pu:(u.h?v.a.y:v.a.x);
    const side=Math.sign(aCoord-bCoord);
    const tag={a,b,axis:u.h?'h':'v',side};
    corridor.set(JSON.stringify(tag),tag);
   }
  }
  const neighbors=[...corridor.values()].sort((a,b)=>a.a.localeCompare(b.a)||
   a.b.localeCompare(b.b)||a.axis.localeCompare(b.axis)||a.side-b.side);
  return {schema:'p1.topology.v1',edges:keys,ports,
   nodeOrders:{x:rankAxis('x'),y:rankAxis('y')},
   crossings:[...crossingPairs.values()].sort((a,b)=>a.a.localeCompare(b.a)||a.b.localeCompare(b.b)),
   crossingOrders,neighbors,pending:keys.filter(k=>!routed.has(k))};
 }
 // Equivalencia de inmersión para 02 (P1-ET-02).
 // No se comparan coordenadas X/Y ni nombres de caras: no son invariantes
 // bajo una redistribución sectorial. Sí se comprueban la rotación cíclica
 // de puertos, los cruces ordenados y las vecindades identificables.
 compareCompact(reference,candidate){
  const counts={graph:0,port:0,portOrder:0,crossing:0,crossingOrder:0,neighbor:0,unresolved:0};
  const issues=[];
  const add=(kind,details={})=>{counts[kind]++;if(issues.length<24)issues.push({kind,...details});};
  if(!TopologyRegister.validShape(reference)||!TopologyRegister.validShape(candidate)){
   add('graph',{reason:'registro topológico inexistente o no verificable'});
   return {valid:false,issueCount:1,issues,counts,compared:true};
  }
  const sameSet=(a,b)=>a.length===b.length&&new Set(a).size===a.length&&
   a.every(v=>b.includes(v));
  if(!sameSet(reference.edges,candidate.edges))add('graph',{reason:'identidad de vínculos'});
  const nodeSet=t=>[...new Set(t.nodeOrders.x.flat())];
  if(!sameSet(nodeSet(reference),nodeSet(candidate)))add('graph',{reason:'identidad de términos'});
  for(const key of reference.edges)if(candidate.pending.includes(key)||
   reference.pending.includes(key))add('unresolved',{edge:key,reason:'ruta pendiente en 01 o 02'});
  const rotationEqual=(a,b)=>{
   if(a.length!==b.length)return false;
   if(!a.length)return true;
   return (b.concat(b)).join('|').includes(a.join('|'))&&
    Array.from({length:b.length},(_,i)=>i).some(i=>a.every((v,j)=>v===b[(j+i)%b.length]));
  };
  for(const id of new Set([...Object.keys(reference.ports),...Object.keys(candidate.ports)])){
   const a=reference.ports[id]||[],b=candidate.ports[id]||[];
   const indexed=new Map(b.map(x=>[x.edge,x]));
   if(!sameSet(a.map(x=>x.edge),b.map(x=>x.edge)))add('port',{node:id,reason:'puertos ausentes o adicionales'});
   for(const old of a){
    const next=indexed.get(old.edge);
    if(!next||next.id!==old.id)add('port',{node:id,edge:old.edge,reason:'identidad de puerto modificada'});
   }
   // El mismo orden horario es válido desde cualquier puerto inicial.
   // Una reflexión del orden NO equivale a una rotación cíclica.
   if(!rotationEqual(a.map(x=>x.edge),b.map(x=>x.edge)))
    add('portOrder',{node:id,reason:'orden circular alterado'});
  }
  const byPair=list=>new Map(list.map(c=>[JSON.stringify([c.a,c.b]),c]));
  const oldPairs=byPair(reference.crossings),newPairs=byPair(candidate.crossings);
  for(const pair of new Set([...oldPairs.keys(),...newPairs.keys()])){
   const a=oldPairs.get(pair),b=newPairs.get(pair);
   if(!a||!b||a.count!==b.count||a.over!==b.over)
    add('crossing',{pair,was:a?.count||0,now:b?.count||0});
  }
  for(const edge of reference.edges){
   const a=reference.crossingOrders[edge]||[];
   const b=candidate.crossingOrders[edge]||[];
   if(a.join('\\u0000')!==b.join('\\u0000'))
    add('crossingOrder',{edge,was:a,now:b});
  }
  // Los ejes h/v son convenciones métricas y cambian al girar un sector.
  // Se exige conservar cada par de corredores vecinos; si uno desaparece,
  // no se infiere automáticamente que la nueva proximidad sea equivalente.
  const group=list=>{
   const grouped=new Map();
   for(const n of list){
    const k=JSON.stringify([n.a,n.b]);
    if(!grouped.has(k))grouped.set(k,[]);
    grouped.get(k).push(n);
   }
   return grouped;
  };
  const refNeighbors=group(reference.neighbors),nowNeighbors=group(candidate.neighbors);
  for(const [pair,old] of refNeighbors){
   const next=nowNeighbors.get(pair)||[];
   if(!next.length)add('neighbor',{pair,reason:'vecindad de corredor no identificable'});
   else for(const oldRel of old)if(next.some(r=>r.axis===oldRel.axis&&r.side===-oldRel.side)&&
       !next.some(r=>r.axis===oldRel.axis&&r.side===oldRel.side))
    add('neighbor',{pair,reason:'disposición de corredor invertida en el mismo eje'});
  }
  const issueCount=Object.values(counts).reduce((a,b)=>a+b,0);
  return {valid:issueCount===0,issueCount,issues,counts,compared:true};
 }
 compare(reference,candidate){
  const issues=[],counts={nodeOrder:0,portSide:0,portOrder:0,crossing:0,crossingOrder:0,neighbor:0,unresolved:0};
  const add=(kind,detail)=>{
   counts[kind]++;
   if(issues.length<24)issues.push({kind,...detail});
  };
  const common=new Set(reference.edges.filter(k=>candidate.edges.includes(k)));
  const retainedNodes=new Set(Object.keys(reference.ports).filter(id=>Object.hasOwn(candidate.ports,id)));
  for(const key of common){
   if(!reference.pending.includes(key)&&candidate.pending.includes(key))add('unresolved',{edge:key});
  }
  for(const id of retainedNodes){
   const prior=(reference.ports[id]||[]).filter(e=>common.has(e.edge));
   const now=(candidate.ports[id]||[]).filter(e=>common.has(e.edge));
   const curr=new Map(now.map(e=>[e.edge,e]));
   for(const p of prior){
    const next=curr.get(p.edge);
    if(!next){add('unresolved',{edge:p.edge,node:id,reason:'missing-port'});continue;}
    if(next.side!==p.side)add('portSide',{edge:p.edge,node:id,was:p.side,now:next.side});
    if(next.id!==p.id)add('portOrder',{edge:p.edge,node:id,was:p.id,now:next.id,reason:'port-id-changed'});
   }
   const oldOrder=prior.map(p=>p.edge).filter(k=>curr.has(k));
   const newOrder=now.map(p=>p.edge).filter(k=>oldOrder.includes(k));
   if(oldOrder.join('\u0000')!==newOrder.join('\u0000'))add('portOrder',{node:id,was:oldOrder,now:newOrder});
  }
  // El orden entre bandas de conceptos tiene significado. Conceptos inicialmente
  // alineados entre sí quedan libres de separarse, pero no pueden invertir
  // una relación izquierda/derecha o arriba/abajo previamente definida.
  for(const axis of ['x','y']){
   const old=reference.nodeOrders[axis],now=candidate.nodeOrders[axis];
   const ranks=new Map(now.flatMap((g,i)=>g.map(id=>[id,i])));
   for(let a=0;a<old.length;a++){
    for(let b=a+1;b<old.length;b++){
     for(const left of old[a])for(const right of old[b]){
      if(!ranks.has(left)||!ranks.has(right))continue;
      if(ranks.get(left)>=ranks.get(right))add('nodeOrder',{axis,first:left,second:right});
     }
    }
   }
  }
  const pairKey=o=>JSON.stringify([o.a,o.b]);
  const oldPairs=new Map(reference.crossings.filter(c=>common.has(c.a)&&common.has(c.b)).map(c=>[pairKey(c),c]));
  const newPairs=new Map(candidate.crossings.filter(c=>common.has(c.a)&&common.has(c.b)).map(c=>[pairKey(c),c]));
  for(const [key,item] of oldPairs){
   const next=newPairs.get(key);
   if(!next||next.count!==item.count||next.over!==item.over)
    add('crossing',{a:item.a,b:item.b,was:item.count,now:next?.count||0,overWas:item.over,overNow:next?.over||null});
  }
  for(const [key,item] of newPairs)if(!oldPairs.has(key))add('crossing',{a:item.a,b:item.b,was:0,now:item.count});
  // No se permiten permutaciones en la secuencia de cruces con rutas antiguas;
  // las rutas añadidas pueden intercalarse sin cambiar los anteriores.
  for(const key of common){
   const prior=(reference.crossingOrders[key]||[]).filter(k=>common.has(k));
   const now=(candidate.crossingOrders[key]||[]).filter(k=>common.has(k));
   if(prior.join('\u0000')!==now.join('\u0000'))add('crossingOrder',{edge:key,was:prior,now});
  }
  // No desaparecen silenciosamente relaciones de carril registradas. La
  // ausencia se informa como pérdida de vecindad, no se convierte en certeza.
  const tagged=r=>JSON.stringify([r.a,r.b,r.axis,r.side]);
  const existing=new Set(candidate.neighbors.filter(r=>common.has(r.a)&&common.has(r.b)).map(tagged));
  const prior=new Set(reference.neighbors.filter(r=>common.has(r.a)&&common.has(r.b)).map(tagged));
  for(const r of reference.neighbors){
   if(!common.has(r.a)||!common.has(r.b))continue;
   if(!existing.has(tagged(r)))add('neighbor',{a:r.a,b:r.b,axis:r.axis,side:r.side,reason:'lost-or-inverted'});
  }
  for(const r of candidate.neighbors){
   if(!common.has(r.a)||!common.has(r.b))continue;
   if(!prior.has(tagged(r))&&prior.has(JSON.stringify([r.a,r.b,r.axis,-r.side])))
    add('neighbor',{a:r.a,b:r.b,axis:r.axis,side:r.side,reason:'inverted'});
  }
  const total=Object.values(counts).reduce((a,b)=>a+b,0);
  return {valid:total===0,issueCount:total,issues,counts,compared:true};
 }
 // La referencia solo se promueve si el candidato es compatible. En caso
 // contrario se mantiene intacta, aun cuando el usuario edite el grafo.
 observe(snapshot){
  this.latest=snapshot;
  if(!this.reference){this.reference=snapshot;this.report={valid:true,issueCount:0,issues:[],counts:{},compared:false};return this.report;}
  const report=this.compare(this.reference,snapshot);
  this.report=report;
  if(report.valid)this.reference=snapshot;
  return report;
 }
 status(){
  return { ...this.report,hasReference:Boolean(this.reference),
   referenceEdges:this.reference?.edges.length||0,
   crossings:this.reference?.crossings.reduce((n,c)=>n+c.count,0)||0,
   neighborRelations:this.reference?.neighbors.length||0,
   ports:Object.values(this.reference?.ports||{}).reduce((n,p)=>n+p.length,0),
   pending:this.latest?.pending.length??0};
 }
}
