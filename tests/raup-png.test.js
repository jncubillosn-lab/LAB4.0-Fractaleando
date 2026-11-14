import {test} from 'node:test';
import assert from 'node:assert/strict';
import {raupPoint,validateRaup} from '../js/geometry/RaupModel.js';
import {pngExportPlan} from '../js/ui/PngExport.js';
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
test('Raup: W es expansión por vuelta, D es la razón interior/exterior y T produce traslación axial',()=>{
 const p={W:4,D:.4,T:.6,scale:30,phi:.7},a=raupPoint({...p,theta:0}),b=raupPoint({...p,theta:2*Math.PI});
 near(b.x,a.x*4);near(b.y,a.y*4);
 const outer=raupPoint({...p,phi:0,theta:0}),inner=raupPoint({...p,phi:Math.PI,theta:0});
 near(inner.x/outer.x,.4);near(a.z,0);near(b.z,30*2*.6/(1-.4)*(4-1));
 near(raupPoint({...p,T:0,theta:9}).z,0);
 for(const bad of [{W:1,D:.4,T:0},{W:4,D:1,T:0},{W:4,D:-.1,T:0},{W:4,D:.4,T:NaN}])assert.throws(()=>validateRaup(bad));
});
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
