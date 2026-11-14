import {RadialLayout} from '../geometry/RadialLayout.js';
import {ViewLayouts} from '../geometry/ViewLayouts.js';
import {SvgRenderer} from '../ui/SvgRenderer.js';
import {TopologyRegister} from '../core/TopologyRegister.js';
import {checkDerivedTopology} from '../core/DerivedTopology.js';
import {computeDerivedScene,SCENE_VERSION} from '../geometry/DerivedScene.js';
import {PcbRouter} from '../geometry/PcbRouter.js';
import {GeometryValidator} from '../geometry/GeometryValidator.js';
import {hierarchySelection} from '../core/HierarchySelection.js';

// Vistas derivadas read-only: conservan el grafo y el plano 01.
// Cada vista tiene su punto de control y comparte la referencia topológica 01.
export class DerivedViews {
 constructor({state,plane,camera,linesEl,nodesEl,sEl,router,validator,edgeKey,readDepthMap,fit,geometry,toast,referenceTopology,onSelect}){
  Object.assign(this,{state,plane,camera,linesEl,nodesEl,sEl,router,validator,edgeKey,readDepthMap,fit,geometry,toast,referenceTopology,onSelect});
  this.layoutEngine=new ViewLayouts();
  this.router=new PcbRouter({state,nodeById:id=>state.nodes.find(n=>n.id===id),mode:'02',clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
  this.validator=new GeometryValidator({router:this.router,rectOverlap:(a,b)=>ViewLayouts.overlap(a,b,0)});
  this.cache=new Map();this.mode='01';this.version=0;
  this.pending=null;this.staged={};this.rejected=null;
  this.names={'01':['Plano conceptual / 01','Construcción y fractaleo','Núcleo · trayectorias editables'],
   '02':['Rayos compactos / 02','Agrupación radial','Ramas próximas · radios según el espacio disponible'],
   '04':['Espiral / 04','Crecimiento espiral','Giro de la distribución compacta 02 · T = 0']};
  this.derivedLines=sEl('g',{id:'derivedLines'});
  this.derivedNodes=sEl('g',{id:'derivedNodes'});
  camera.append(this.derivedLines,this.derivedNodes);
  this.renderer=new SvgRenderer({linesEl:this.derivedLines,sEl,router:this.router,edgeKey});
  this.current=null;
  this.graphIdentity=null;
 }
 sourceKey(){return JSON.stringify([...this.plane.positions].sort(([a],[b])=>a.localeCompare(b)).map(([id,p])=>[id,Math.round(p.x*100)/100,Math.round(p.y*100)/100]));}
 referenceKey(){return JSON.stringify(this.referenceTopology?.()??null);}
 graphKey(){
  return JSON.stringify({nodes:this.state.nodes.map(n=>[n.id,n.text,n.width,n.branch,n.parent]),
   edges:this.state.edges.map(e=>[e.from,e.to,e.kind||''])});
 }
 reset(){
  this.version++;
  if(this.pending){this.pending.terminate?.();this.pending=null;}
  this.cache.clear();this.current=null;this.staged={};this.graphIdentity=null;this.rejected=null;
  this.derivedLines.replaceChildren();this.derivedNodes.replaceChildren();
  this.switchVisibility('01');this.updateLabels('01');
 }
 switchVisibility(mode){
  const derived=mode!=='01';
  if(derived){this.state.linkFrom=null;this.state.unlinkFrom=null;}
  this.linesEl.style.display=derived?'none':'';
  this.nodesEl.style.display=derived?'none':'';
  this.derivedLines.style.display=derived?'':'none';
  this.derivedNodes.style.display=derived?'':'none';
  document.querySelector('.app')?.classList.toggle('view-derived',derived);
  for(const id of ['addBtn','linkBtn','unlinkBtn','deleteBtn','nodeText','narrowBtn','widenBtn']){
   const control=document.getElementById(id);
   if(control)control.disabled=derived; // 01 recupera sus acciones originales; app revalida la selección.
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
 async computeScene(input){
  if(typeof Worker==='undefined')return computeDerivedScene(input);
  return new Promise((resolve,reject)=>{
   const worker=new Worker(new URL('../workers/derived-scene.worker.js',import.meta.url),{type:'module'});
   this.pending=worker;let settled=false;
   const finish=(error,result)=>{
    if(settled)return;settled=true;clearTimeout(timeout);worker.terminate();
    if(this.pending===worker)this.pending=null;
    if(error)reject(error);else resolve(result);
   };
   const timeout=setTimeout(()=>finish(new Error('Límite de cálculo (75 s)')),75000);
   worker.onmessage=({data})=>{
    if(data.progress){this.status('Compactando '+data.progress.mode+' · comprobando conexiones · paso '+data.progress.pass);return;}
    data.error?finish(new Error(data.error)):finish(null,data.result);
   };
   worker.onerror=event=>finish(new Error(event.message||'Error de distribución'));
   worker.postMessage(input);
  });
 }
 snapshot(scene,identity){
  const {layout,result}=scene,routes=new Map(result.routes);
  const ordered=this.state.edges.map(e=>({...e}));
  const audit=this.validator.audit([...layout.rects.values()],[...routes.values()]);
  const {topology,report}=checkDerivedTopology({reference:this.referenceTopology?.(),edgeKey:this.edgeKey,
   positions:layout.positions,rects:layout.rects,routes,edges:ordered});
  const unfinished=[...routes.values()].filter(r=>!r?.points).length;
  const valid=audit.boxes===0&&audit.invalid===0&&audit.portsRepeated===0&&layout.stats.geometricallySafe&&
   layout.stats.constraintsValid&&report.valid&&report.compared&&unfinished===0&&routes.size===this.state.edges.length;
  return {mode:layout.mode,identity,layout,routes,ordered,topology,audit,report,unfinished,valid,
   budgetExceeded:result.budgetExceeded,calculations:result.calculations};
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
  this.mode=mode;this.rejected=null;
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
  const key=this.graphKey(),identity=key+this.sourceKey()+this.referenceKey();
  if(this.graphIdentity!==identity){
   this.cache.clear();this.graphIdentity=identity;
  }
  let cached=this.cache.get(mode);
  if(!cached)cached=this.tryRestore(mode,key);
  if(!cached)this.current=null;
  if(cached){this.cache.set(mode,cached);this.current=cached;this.draw(cached);this.fit();return;}
  this.status('Calculando la vista '+mode+' y sus conexiones…');
  const token=this.version,metrics=this.metrics();
  try{
   const base=this.cache.get('02');
   const scene=await this.computeScene({mode,nodes:this.state.nodes,edges:this.state.edges,metrics,
    sourcePositions:this.plane.positions,topologyReference:this.referenceTopology?.(),
    baseScene:mode==='04'&&base?{layout:base.layout,result:{routes:[...base.routes]}}:undefined});
   if(token!==this.version)return;
   if(scene.layout.stats.graphSignature!==RadialLayout.signature(this.state.nodes,this.state.edges))throw Error('El grafo cambió durante el cálculo.');
   if(scene.baseScene)this.cache.set('02',this.snapshot(scene.baseScene,identity));
   const snapshot=this.snapshot(scene,identity);
   this.cache.set(mode,snapshot);this.current=snapshot;
   this.draw(snapshot);this.fit();
  }catch(error){
   if(token!==this.version)return;
   this.derivedLines.replaceChildren();this.derivedNodes.replaceChildren();
   this.linesEl.style.display='';this.nodesEl.style.display='';
   this.status('No se completó la vista '+mode+'. Se muestra 01 Plano. '+error.message,true);this.fit();
  }
 }
 drawNodes(layout){
  this.derivedNodes.replaceChildren();
  for(const node of this.state.nodes){
   const m=this.geometry(node),p=layout.positions.get(node.id);
   if(!p)continue;
   const g=this.sEl('g',{class:'node'+(node.id==='p1'?' core':node.parent==='p1'?' anchor':''),
    'data-node-id':node.id,tabindex:0,role:'button','aria-label':node.text,'aria-pressed':node.id===this.state.selected?'true':'false',
    transform:'translate('+p.x.toFixed(2)+' '+p.y.toFixed(2)+')'});
   const select=()=>{if(this.onSelect)this.onSelect(node.id);else{this.state.selected=node.id;this.paintSelection();}};
   g.addEventListener('pointerdown',event=>event.stopPropagation());
   g.addEventListener('click',event=>{event.stopPropagation();select();});
   g.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();select();}});
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
  this.renderer.draw(snapshot.ordered,snapshot.routes,{mode:snapshot.mode,nodes:this.state.nodes,levels:snapshot.layout.levels});
  this.paintVisibility();
 }
 paintVisibility(){
  if(this.mode==='01')return;
  const current=this.current;
  if(!current){
   if(this.rejected){
    const s=this.rejected,violations=s.distanceViolations||[],worst=[...violations].sort((a,b)=>b.gap-a.gap)[0];
    this.status('02 no resuelto · Se muestra 01 Plano. '+s.overlaps+' solapes; '+violations.length+
     ' enlaces superan 2H ('+s.maxAllowedGap.toFixed(1)+' px). '+
     (worst?'Mayor separación: '+worst.from+' → '+worst.to+' = '+worst.gap.toFixed(1)+' px. ':'')+
     (s.orderViolations?.length||0)+' inversiones de orden; '+(s.sectorViolations?.length||0)+' cuadros fuera de sector; '+
     (s.disconnected?.length||0)+' conceptos desconectados. No se aumentó la cota.',true);
   }else this.status('Calculando las rutas de esta representación…');
   return;
  }
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
  const prefix='Vista '+this.mode+' · '+shown.size+' conceptos · '+drawn+' vínculos · separación media '+s.meanGap.toFixed(0)+' px';
  const warning=problems>0||!current.valid;
  this.status(prefix+' · '+(warning?
    ('En revisión: '+current.unfinished+' pendientes, '+current.audit.invalid+
     ' rutas inválidas, '+(current.report.issueCount||0)+' diferencias topológicas.'+
     (s.distanceViolations?.length?' '+s.distanceViolations.length+' enlaces superan la cota 2H ensayada.':'')+
     (current.budgetExceeded?' Se alcanzó el límite de cálculo.':'')):
    ('Geometría y topología comprobadas · '+current.audit.crossings+' cruces · validación normativa pendiente · '+s.arms+' brazos J1'+
     (this.mode==='02'?' · separación máxima '+s.maxGap.toFixed(1)+' / '+s.maxAllowedGap.toFixed(1)+' px (2H)':''))),warning);
  const footer=document.getElementById('footHint');
  if(footer)footer.textContent='Vista '+this.mode+' · '+drawn+' conexiones visibles · referencia 01';
  const scope=document.getElementById('scopeInfo'),stats=document.getElementById('stats');
  if(scope)scope.textContent=shown.size+' conceptos visibles · '+drawn+' vínculos trazados · '+pending+' pendientes';
  if(stats)stats.textContent=this.state.nodes.length+' conceptos · '+this.state.edges.length+' vínculos · '+current.unfinished+' rutas pendientes';
  this.paintSelection();
 }
 paintSelection(){
  const focus=hierarchySelection({nodes:this.state.nodes,edges:this.state.edges,selectedId:this.state.selected,levels:this.current?.layout.levels});
  for(const el of this.derivedNodes.children){
   const selected=el.dataset.nodeId===this.state.selected;
   el.classList.toggle('selected',selected);el.classList.toggle('hierarchy-focus',focus.nodeIds.has(el.dataset.nodeId));
   el.setAttribute('aria-pressed',String(selected));
  }
  for(const el of this.derivedLines.querySelectorAll('[data-edge-key]'))
   el.classList.toggle('hierarchy-focus',focus.edgeKeys.has(el.dataset.edgeKey));
 }
 exportNotice(){
  if(this.mode==='01')return '';
  const c=this.current;
  if(!c)return 'BORRADOR · vista '+this.mode+' sin resultado aprobado';
  if(!c.valid)return 'EN REVISIÓN · vista '+this.mode+' · '+c.unfinished+' rutas pendientes · '+(c.report.issueCount||0)+' diferencias topológicas';
  return 'BORRADOR · vista '+this.mode+' · validación normativa pendiente';
 }
 // Recuperación segura de una vista previamente calculada: mismos datos y
 // geometría de 01, mismas posiciones deterministas, DRC independiente y
 // firma de relaciones intacta. No acepta archivos que inventan caminos.
 tryRestore(mode,graphKey){
  const stored=this.staged[mode];
  if(!stored||stored.layoutVersion!==SCENE_VERSION||stored.graphKey!==graphKey||stored.sourceKey!==this.sourceKey()||stored.referenceKey!==this.referenceKey()||
     !Array.isArray(stored.positions)||!Array.isArray(stored.routes)||
     !TopologyRegister.validShape(stored.topology))return null;
  if(stored.coreGapFactor!==undefined&&(!Number.isFinite(stored.coreGapFactor)||stored.coreGapFactor<=0||stored.coreGapFactor>1))return null;
  const input={nodes:this.state.nodes,edges:this.state.edges,metrics:this.metrics(),sourcePositions:this.plane.positions,topologyReference:this.referenceTopology?.()};
  const policy={coreClearances:stored.coreClearances||{},coreGapFactor:stored.coreGapFactor??.5};
  const baseLayout=mode==='04'?this.layoutEngine.compute({mode:'02',...input,...policy,nodeClearances:stored.baseNodeClearances||{}}):undefined;
  const layout=this.layoutEngine.compute({mode,...input,...policy,baseLayout,nodeClearances:stored.nodeClearances||{}});
  if(layout.stats.overlaps||layout.stats.radialOrder===false||layout.stats.constraintsValid===false)return null;
  const saved=new Map(stored.positions.map(p=>[p.id,p]));
  if(saved.size!==layout.positions.size)return null;
  for(const [id,p] of layout.positions){
   const q=saved.get(id);
   if(!q||!Number.isFinite(q.x)||!Number.isFinite(q.y)||
      Math.hypot(q.x-p.x,q.y-p.y)>.1)return null;
  }
  const edges=new Map(this.state.edges.map(e=>[this.edgeKey(e),e]));
  const routes=new Map();
  for(const record of stored.routes){
   if(!record||!edges.has(record.key)||routes.has(record.key)||
      !Array.isArray(record.points)||!record.fromPort||!record.toPort)return null;
   routes.set(record.key,{edge:edges.get(record.key),points:record.points,style:record.style,
    fromPort:record.fromPort,toPort:record.toPort});
  }
  if(routes.size!==edges.size)return null;
  const levels=layout.levels;
  const priority=e=>{
   const a=levels[e.from]??1000,b=levels[e.to]??1000;
   return Math.min(a,b)*10+(e.kind==='transversal'?5:0)+(Math.abs(a-b)>1?2:0);
  };
  const ordered=this.state.edges.map((e,i)=>({...e,__index:i}))
   .sort((a,b)=>priority(a)-priority(b)||a.__index-b.__index);
  const audit=this.validator.audit([...layout.rects.values()],[...routes.values()]);
  if(audit.invalid||audit.boxes||audit.portsRepeated||audit.drawn!==edges.size)return null;
  const {topology,report}=checkDerivedTopology({reference:this.referenceTopology?.(),edgeKey:this.edgeKey,
   positions:layout.positions,rects:layout.rects,routes,edges:ordered});
  if(!report.valid||!report.compared)return null;
  return {mode,identity:graphKey+this.sourceKey()+this.referenceKey(),layout,routes,ordered,topology,audit,report,
   unfinished:0,valid:true,calculations:0,restored:true};
 }
 exportData(){
  const output={};
  const identity=this.graphKey()+this.sourceKey()+this.referenceKey();
  for(const [mode,c] of this.cache)if(c.valid&&c.identity===identity)
   output[mode]={layoutVersion:SCENE_VERSION,nodeClearances:c.layout.stats.nodeClearances,baseNodeClearances:c.layout.stats.baseNodeClearances,
    coreClearances:c.layout.stats.coreClearances,coreGapFactor:c.layout.stats.coreGapFactor,graphKey:this.graphKey(),sourceKey:this.sourceKey(),referenceKey:this.referenceKey(),
    validation:{geometry:true,topology:true,normative:'pending-definition',pendingDefinitions:['D1','D2','D3','D4']},
    topology:c.topology.reference,
    positions:[...c.layout.positions].map(([id,p])=>({id,x:p.x,y:p.y})),
    routes:[...c.routes].map(([key,r])=>({key,points:r.points,fromPort:r.fromPort,toPort:r.toPort,style:r.style}))};
  return output;
 }
 restoreData(data){
  this.staged={};
  if(!data||typeof data!=='object')return;
  for(const mode of ['02','04'])if(TopologyRegister.validShape(data[mode]?.topology))
   this.staged[mode]=data[mode];
 }
 diagnostic(){
  const value=this.current;
  return {mode:this.mode,cached:[...this.cache.keys()],rejected:this.rejected,
   current:value?{...value.layout.stats,valid:value.valid,normative:'pending-definition',budgetExceeded:Boolean(value.budgetExceeded),audit:value.audit,
    topology:value.topology.status(),pending:value.unfinished,restored:Boolean(value.restored),pendingKeys:[...value.routes].filter(([,r])=>!r?.points).map(([key])=>key),calculations:value.calculations}:null};
 }
}
