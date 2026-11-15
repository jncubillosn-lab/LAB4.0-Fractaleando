import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GraphDocument} from '../js/core/GraphDocument.js';
import {parseGraphFile} from '../js/io/GraphFile.js';
import {edgeKey} from '../js/core/GraphIdentity.js';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {layoutPlane} from '../js/geometry/PlaneLayout.js';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';
import {computeDerivedScene} from '../js/geometry/DerivedScene.js';
import {AvoidLib} from 'libavoid-js';
import {GraphDocument as PreviousGraphDocument} from './fixtures/graph-document-0.2.13.js';

function sample(){
 const names=['constructor','toString','__proto__','hasOwnProperty'];
 const nodes=[{id:'p1',parent:null,branch:-1,width:108,text:'Root',x:0,y:0},
  ...names.map((id,branch)=>({id,parent:'p1',branch,width:190,text:id,x:0,y:0}))];
 return {nodes,edges:names.map(to=>({from:'p1',to})),focusRoot:'p1',depth:5};
}
test('IDs que coinciden con propiedades de Object conservan jerarquía, puertos y rutas',async()=>{
 const state=parseGraphFile(JSON.stringify(sample())),doc=new GraphDocument({...state,focusRoot:'p1',depth:5});
 assert.equal(doc.currentNodes().length,5);
 for(const n of state.nodes)assert.equal(doc.readDepthMap()[n.id],n.id==='p1'?0:1);
 const layout=layoutPlane(state.nodes,n=>({w:n.width,h:53}));
 for(const n of state.nodes)Object.assign(n,layout.positions.get(n.id));
 const initial=computeInitialRoutes({...state,positions:[...layout.positions],rects:[...layout.rects],levels:doc.readDepthMap()});
 assert.ok(initial.routes.every(([,r])=>r.points));
 const register=new TopologyRegister({edgeKey}),reference=register.capture({...layout,routes:new Map(initial.routes),edges:state.edges});
 assert.ok(register.restore(JSON.parse(JSON.stringify(reference))));
 register.capture({...layout,routes:new Map(initial.routes),edges:state.edges});
 for(const n of state.nodes)assert.ok(Array.isArray(reference.ports[n.id]));
 await AvoidLib.load();
 const input={...state,sourcePositions:layout.positions,metrics:layout.metrics,topologyReference:reference};
 const base=await computeDerivedScene({...input,mode:'02'},{load:async()=>AvoidLib.getInstance()});
 const spiral=await computeDerivedScene({...input,mode:'04',baseScene:base},{load:async()=>AvoidLib.getInstance()});
 for(const scene of [base,spiral]){
  assert.equal(scene.layout.positions.size,5);assert.equal(scene.layout.stats.overlaps,0);
  assert.ok(scene.result.routes.every(([,r])=>r.points));
  for(const n of state.nodes)assert.ok(Number.isFinite(scene.layout.levels[n.id]));
 }
});
test('el lector rechaza enlaces repetidos, invertidos y autorrelaciones sin alterar la entrada',()=>{
 const valid=sample();
 valid.edges.push({from:'constructor',to:'toString',style:'dotted'});
 assert.deepEqual(parseGraphFile(JSON.stringify(valid)),valid);
 for(const edge of [{...valid.edges[0]},{from:'toString',to:'constructor'},{from:'constructor',to:'constructor'}]){
  const invalid=structuredClone(valid);invalid.edges.push(edge);
  assert.throws(()=>parseGraphFile(JSON.stringify(invalid)),/duplicados|distintos/);
 }
});
test('la lectura de profundidad es lineal y refleja cambios sin índices obsoletos',()=>{
 const size=2000;let parentReads=0;
 const nodes=Array.from({length:size},(_,i)=>({id:i?'n'+i:'p1',get parent(){parentReads++;return i?(i===1?'p1':'n'+(i-1)):null;}}));
 const doc=new GraphDocument({nodes,edges:[],focusRoot:'p1',depth:size});
 assert.equal(doc.readDepthMap()['n1999'],1999);assert.ok(parentReads<size*8,parentReads);
 const state=sample(),editable=new GraphDocument(state);
 state.nodes.push({id:'child',parent:'constructor'});
 assert.equal(editable.readDepthMap().child,2);
 state.nodes.find(n=>n.id==='constructor').parent='toString';
 assert.equal(editable.readDepthMap().child,3);
 state.nodes.find(n=>n.id==='constructor').parent=null;
 assert.equal(editable.readDepthMap().child,3);
 state.nodes=[{id:'p1',parent:null}];assert.equal(Object.keys(editable.readDepthMap()).length,1);
 assert.equal(doc.depthMap()['n1999'],1999);
});
test('el índice conserva la semántica anterior de foco, componentes y ciclos heredados',()=>{
 let seed=20261114;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 const entries=record=>Object.entries(record).sort(([a],[b])=>a.localeCompare(b));
 for(let sample=0;sample<100;sample++){
  const nodes=[{id:'p1',parent:null},...Array.from({length:30},(_,i)=>({id:'n'+i,parent:null}))];
  for(const node of nodes.slice(1))node.parent=random()<.2?null:nodes[Math.floor(random()*nodes.length)].id;
  const state={nodes,edges:[],focusRoot:sample%3?'p1':nodes[1+sample%30].id,depth:20};
  const current=new GraphDocument(state),previous=new PreviousGraphDocument(state);
  assert.deepEqual(entries(current.readDepthMap()),entries(previous.readDepthMap()));
  assert.deepEqual(entries(current.depthMap()),entries(previous.depthMap()));
 }
});
