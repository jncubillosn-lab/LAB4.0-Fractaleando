import {ViewLayouts} from '../geometry/ViewLayouts.js';
import {SvgRenderer} from '../ui/SvgRenderer.js';
import {TopologyRegister} from '../core/TopologyRegister.js';
import {computeInitialRoutes} from '../workers/initial-route.worker.js';

// Vistas derivadas read-only: conservan el grafo y el plano 01.
// Cada vista tiene su propio punto de control y registro topológico.
export class DerivedViews {
 constructor({state,plane,camera,linesEl,nodesEl,sEl,router,validator,edgeKey,readDepthMap,fit,geometry,toast}){
  Object.assign(this,{state,plane,camera,linesEl,nodesEl,sEl,router,validator,edgeKey,readDepthMap,fit,geometry,toast});
  this.layoutEngine=new ViewLayouts();
  this.cache=new Map();this.mode='01';this.version=0;
  this.pending=null;this.staged={};
  this.names={'01':['Plano conceptual / 01','Construcción y fractaleo','Núcleo · trayectorias editables'],
   '02':['Proximidad / 02','Reorganización compacta','Geometría conservadora · relaciones intactas'],
   '03':['Órbitas / 03','Jerarquías y cercanía','Mismo radio para cada jerarquía'],
   '04':['Espiral / 04','Crecimiento espiral','Un brazo por cada término J1 · T = 0']};
  this.derivedLines=sEl('g',{id:'derivedLines'});
  this.derivedNodes=sEl('g',{id:'derivedNodes'});
  camera.append(this.derivedLines,this.derivedNodes);
  this.renderer=new SvgRenderer({linesEl:this.derivedLines,sEl,router,edgeKey});
  this.current=null;
  this.graphIdentity=null;
 }
 graphKey(){
  return JSON.stringify({nodes:this.state.nodes.map(n=>[n.id,n.text,n.width,n.branch,n.parent]),
   edges:this.state.edges.map(e=>[e.from,e.to,e.kind||''])});
 }
 reset(){
  this.version++;
  if(this.pending){this.pending.terminate?.();this.pending=null;}
  this.cache.clear();this.current=null;this.staged={};this.graphIdentity=null;
  this.derivedLines.replaceChildren();this.derivedNodes.replaceChildren();
  this.switchVisibility('01');this.updateLabels('01');
 }
 switchVisibility(mode){
  const derived=mode!=='01';
  this.linesEl.style.display=derived?'none':'';
  this.nodesEl.style.display=derived?'none':'';
  this.derivedLines.style.display=derived?'':'none';
  this.derivedNodes.style.display=derived?'':'none';
  document.querySelector('.app')?.classList.toggle('view-derived',derived);
  for(const id of ['addBtn','linkBtn','unlinkBtn','deleteBtn','nodeText','narrowBtn','widenBtn']){
   const control=document.getElementById(id);
   if(derived&&control)control.disabled=true;
  }
  for(const button of document.querySelectorAll('[data-view]')){
   const active=button.dataset.view===mode;
   button.classList.toggle('selected',active);
   button.setAttribute('aria-pressed',active?'true':'false');
  }
 }
 updateLabels(mode){
  const text=this.names[mode];
  for(const [index,selector] of ['.toplabel .eyebrow','.toplabel .maptitle','.toplabel .mapcaption'].entries()){
   const el=document.querySelector(selector);if(el)el.textContent=text[index];
  }
  const footer=document.getElementById('viewState');
  if(footer)footer.textContent=mode==='01'?'01 · EDITABLE':mode+' · LECTURA';
 }
 metrics(){
  return new Map(this.state.nodes.map(n=>[n.id,this.geometry(n)]));
 }
 async route(layout,nodes,edges,token){
  const payload={
   nodes:nodes.map(n=>({...n,...layout.positions.get(n.id)})),
   edges:edges.map(e=>({...e})),
   positions:[...layout.positions],
   rects:[...layout.rects],
   levels:layout.levels
  };
  // Workers de módulo son archivos ordinarios de GitHub Pages.
  // Al abandonar la vista se cancela el cálculo anterior.
  if(typeof Worker==='undefined')return computeInitialRoutes(payload);
  return new Promise((resolve,reject)=>{
   const worker=new Worker('./js/workers/initial-route.worker.js',{type:'module'});
   this.pending=worker;
   let settled=false;
   const finish=(error,data)=>{
    if(settled)return;settled=true;clearTimeout(timeout);
    worker.terminate();
    if(this.pending===worker)this.pending=null;
    if(error)reject(error);else resolve(data);
   };
   const timeout=setTimeout(()=>finish(new Error('Límite de cálculo de rutas (30 s)')),30000);
   worker.onmessage=event=>event.data?.error?
    finish(new Error(event.data.error)):
    finish(null,event.data.result);
   worker.onerror=event=>finish(new Error(event.message||'Error del motor geométrico'));
   worker.postMessage({...payload,token});
  });
 }
 status(message,warning=false){
  const el=document.getElementById('derivedStatus');
  if(!el)return;
  el.hidden=this.mode==='01';
  if(el.hidden)return;
  el.classList.toggle('warning',Boolean(warning));
  el.textContent=message;
 }
 async select(mode){
  if(!ViewLayouts.MODES.includes(mode))return;
  const old=this.mode;this.mode=mode;
  ++this.version;
  if(this.pending){this.pending.terminate();this.pending=null;}
  this.switchVisibility(mode);this.updateLabels(mode);
  if(mode==='01'){
   this.current=null;this.status('');
   this.state.renderQueued=false;
   this.linesEl.style.display='';this.nodesEl.style.display='';
   this.toast('Vista 01 recuperada. Geometría y edición originales intactas.');
   return;
  }
  if(!this.plane.ready){
   this.mode='01';this.switchVisibility('01');this.updateLabels('01');
   this.toast('La geometría original todavía se está calculando.');
   return;
  }
  const key=this.graphKey();
  if(this.graphIdentity!==key){
   this.cache.clear();this.graphIdentity=key;
  }
  const cached=this.cache.get(mode);
  if(!cached)this.current=null;
  if(cached){this.current=cached;this.draw(cached);this.fit();return;}
  this.status('Calculando la vista '+mode+' y sus conexiones…');
  const token=this.version,metrics=this.metrics();
  const layout=this.layoutEngine.compute({mode,nodes:this.state.nodes,edges:this.state.edges,
   metrics,sourcePositions:this.plane.positions});
  if(token!==this.version)return;
  // Mostrar cuadros antes del cálculo sin inventar líneas provisionales.
  this.derivedLines.replaceChildren();
  this.drawNodes(layout);
  this.fit();
  try{
   const result=await this.route(layout,this.state.nodes,this.state.edges,token);
   if(token!==this.version)return;
   const routes=new Map(result.routes);
   const levels=layout.levels;
   const ordered=this.state.edges.map((e,i)=>({...e,__index:i}))
    .sort((a,b)=>{
     const pr=x=>{
      const u=levels[x.from]??1000,v=levels[x.to]??1000;
      return Math.min(u,v)*10+(x.kind==='transversal'?5:0)+(Math.abs(u-v)>1?2:0);
     };
     return pr(a)-pr(b)||a.__index-b.__index;
    });
   const audit=this.validator.audit([...layout.rects.values()],[...routes.values()]);
   const topology=new TopologyRegister({edgeKey:this.edgeKey});
   const signature=topology.capture({positions:layout.positions,rects:layout.rects,routes,edges:ordered});
   const stored=this.staged[mode];
   if(stored&&TopologyRegister.validShape(stored)&&stored.edges.join('|')===signature.edges.join('|')){
    topology.restore(stored);
   }
   const report=topology.observe(signature);
   const unfinished=[...routes.values()].filter(r=>!r?.points).length;
   const valid=audit.boxes===0&&audit.invalid===0&&audit.portsRepeated===0&&
     layout.stats.overlaps===0&&layout.stats.radialOrder!==false&&report.valid&&unfinished===0;
   const snapshot={mode,layout,routes,ordered,topology,audit,report,unfinished,valid,calculations:result.calculations};
   this.cache.set(mode,snapshot);this.current=snapshot;
   this.draw(snapshot);
   this.fit();
  }catch(error){
   if(token!==this.version)return;
   console.warn('Vista '+mode+':',error);
   this.status('Vista '+mode+' · distribución disponible, pero no se encontraron todas las rutas: '+error.message,true);
  }
 }
 drawNodes(layout){
  this.derivedNodes.replaceChildren();
  for(const node of this.state.nodes){
   const m=this.geometry(node),p=layout.positions.get(node.id);
   if(!p)continue;
   const g=this.sEl('g',{class:'node'+(node.id==='p1'?' core':node.parent==='p1'?' anchor':''),
    'data-node-id':node.id,transform:'translate('+p.x.toFixed(2)+' '+p.y.toFixed(2)+')'});
   g.append(this.sEl('rect',{x:-m.w/2,y:-m.h/2,width:m.w,height:m.h,rx:8,ry:8}));
   const label=this.sEl('text'),wrapped=m.wrapped||[node.text];
   for(let i=0;i<wrapped.length;i++){
    const t=this.sEl('tspan',{x:0,y:-(wrapped.length-1)*m.lineheight/2+i*m.lineheight});
    t.textContent=wrapped[i];label.append(t);
   }
   g.append(label);
   const title=this.sEl('title');title.textContent=node.text;g.append(title);
   this.derivedNodes.append(g);
  }
 }
 draw(snapshot){
  this.derivedLines.replaceChildren();
  this.drawNodes(snapshot.layout);
  this.renderer.draw(snapshot.ordered,snapshot.routes);
  this.paintVisibility();
 }
 paintVisibility(){
  if(this.mode==='01')return;
  const current=this.current;
  if(!current){this.status('Calculando las rutas de esta representación…');return;}
  const shown=new Set(this.state.nodes.filter(n=>
   (current.layout.levels[n.id]??Infinity)<=this.state.depth).map(n=>n.id));
  for(const el of this.derivedNodes.children)el.style.display=shown.has(el.dataset.nodeId)?'':'none';
  let drawn=0,pending=0;
  for(const [key,rt] of current.routes){
   const show=shown.has(rt.edge.from)&&shown.has(rt.edge.to);
   const el=this.derivedLines.querySelector('[data-edge-key="'+CSS.escape(key)+'"]');
   if(el)el.style.display=show?'':'none';
   if(show){if(rt.points)drawn++;else pending++;}
  }
  const s=current.layout.stats,problems=current.audit.invalid+current.audit.boxes+current.audit.portsRepeated+
   (current.report.issueCount||0)+current.unfinished;
  const prefix='Vista '+this.mode+' · '+shown.size+' conceptos · '+drawn+' vínculos';
  const warning=problems>0;
  this.status(prefix+' · '+(warning?
    ('En revisión: '+current.unfinished+' pendientes, '+current.audit.invalid+
     ' rutas inválidas, '+(current.report.issueCount||0)+' diferencias topológicas.'):
    ('Geometría verificada · '+s.arms+' brazos J1')),warning);
 }
 exportData(){
  const output={};
  for(const [mode,c] of this.cache)if(c.valid)
   output[mode]={topology:c.topology.reference,
    positions:[...c.layout.positions].map(([id,p])=>({id,x:p.x,y:p.y})),
    routes:[...c.routes].map(([key,r])=>({key,points:r.points,fromPort:r.fromPort,toPort:r.toPort}))};
  return output;
 }
 restoreData(data){
  this.staged={};
  if(!data||typeof data!=='object')return;
  for(const mode of ['02','03','04'])if(TopologyRegister.validShape(data[mode]?.topology))
   this.staged[mode]=data[mode].topology;
 }
 diagnostic(){
  const value=this.current;
  return {mode:this.mode,cached:[...this.cache.keys()],
   current:value?{...value.layout.stats,valid:value.valid,audit:value.audit,
    topology:value.topology.status(),pending:value.unfinished,pendingKeys:[...value.routes].filter(([,r])=>!r?.points).map(([key])=>key),calculations:value.calculations}:null};
 }
}
