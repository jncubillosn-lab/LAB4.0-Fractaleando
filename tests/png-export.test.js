import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pngExportPlan,exportScene} from '../js/ui/PngExport.js';
test('PNG 4K encaja todo el grafo y sus rutas con margen, sin depender de cámara ni filtros',()=>{
 const rects=new Map([['a',{l:-500,r:0,t:-40,b:40}],['b',{l:1500,r:1800,t:500,b:700}]]);
 const routes=new Map([['a|b',{points:[{x:0,y:0},{x:2200,y:0},{x:2200,y:600},{x:1500,y:600}]}]]);
 const p=pngExportPlan({rects,routes,notice:true});assert.equal(Math.max(p.width,p.height),4096);
 assert.equal(p.nodes,2);assert.equal(p.edges,1);
 for(const [x,y] of [[p.bbox.x,p.bbox.y],[p.bbox.x+p.bbox.width,p.bbox.y+p.bbox.height]]){
  assert.ok(x*p.scale+p.offsetX>=63&&x*p.scale+p.offsetX<=p.width-63);
  assert.ok(y*p.scale+p.offsetY>=103&&y*p.scale+p.offsetY<=p.height-63);
 }
 const tall=pngExportPlan({rects:new Map([['a',{l:0,r:200,t:0,b:2000}]]),routes:new Map()});
 assert.ok(tall.width<tall.height);assert.equal(tall.height,4096);
 assert.throws(()=>pngExportPlan({rects,routes:new Map([['a|b',{points:null}]])}),/pendientes/);
});
test('una escena en carga o con rutas ausentes no se confunde con un grafo completo',()=>{
 const state={nodes:[{id:'a'},{id:'b'}],edges:[{from:'a',to:'b'}]};
 const plane={ready:false,rects:new Map([['a',{}],['b',{}]]),routes:new Map()};
 const derived={mode:'01',current:null,exportNotice:()=>''};
 assert.throws(()=>exportScene({plane,derived,state,complete:true}),/termine/);
 assert.throws(()=>exportScene({plane,derived,state}),/termine/);
 plane.ready=true;
 assert.throws(()=>exportScene({plane,derived,state,complete:true}),/Faltan/);
 plane.routes.set('a|b',{edge:state.edges[0],points:null});
 assert.throws(()=>exportScene({plane,derived,state,complete:true}),/pendientes/);
 plane.routes.get('a|b').points=[{x:0,y:0},{x:100,y:0}];
 assert.equal(exportScene({plane,derived,state,complete:true}).mode,'01');
 derived.mode='02';assert.throws(()=>exportScene({plane,derived,state,complete:true}),/termine/);
 derived.current={layout:{rects:plane.rects},routes:plane.routes};
 assert.equal(exportScene({plane,derived,state,complete:true}).mode,'02');
 state.edges.push({...state.edges[0]});
 assert.throws(()=>exportScene({plane,derived,state,complete:true}),/Faltan/);
});
