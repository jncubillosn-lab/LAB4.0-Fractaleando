import {test} from 'node:test';
import assert from 'node:assert/strict';
import {pngExportPlan} from '../js/ui/PngExport.js';
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
