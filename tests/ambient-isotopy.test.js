import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCertifiedPatch,applyCertifiedPatch} from '../js/geometry/AmbientIsotopy.js';
import {captureEmbeddedTopology,compareEmbeddedTopology} from '../js/geometry/EmbeddedTopology.js';
import {computeCertified02} from '../js/geometry/CertifiedCompact02.js';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';

const rect=(id,x,y,w=100,h=60)=>({id,x,y,w,h,l:x-w/2,r:x+w/2,t:y-h/2,b:y+h/2});
function simple(){
 const nodes=[{id:'p1',parent:null},{id:'a',parent:'p1'}],
  edges=[{from:'p1',to:'a'}],
  positions=new Map([['p1',{x:0,y:0}],['a',{x:300,y:100}]]),
  rects=new Map([['p1',rect('p1',0,0)],['a',rect('a',300,100)]]);
 const fromPort={side:'right',x:50,y:0,sx:69,sy:0},
  toPort={side:'left',x:250,y:100,sx:231,sy:100};
 const routes=new Map([['a|p1',{edge:edges[0],points:[
  {x:50,y:0},{x:150,y:0},{x:150,y:100},{x:250,y:100}],
  fromPort,toPort}]]);
 return {nodes,edges,positions,rects,routes};
}
test('la isotopía transforma íntegramente las líneas, no solo sus extremos',()=>{
 const original=simple(),before=captureEmbeddedTopology(original);
 assert.equal(before.valid,true,JSON.stringify(before.problems));
 const trial=applyCertifiedPatch(original,{targetId:'a',dx:-12,dy:-8});
 assert.equal(trial.valid,true,trial.reason);
 assert.ok(trial.proof.bound<1);
 assert.ok(trial.proof.exactPolylineSubdivision);
 const after=captureEmbeddedTopology(trial.snapshot);
 assert.equal(after.valid,true,JSON.stringify(after.problems));
 assert.equal(compareEmbeddedTopology(before.signature,after.signature).issueCount,0);
 assert.deepEqual(trial.snapshot.positions.get('p1'),original.positions.get('p1'));
 assert.equal(trial.snapshot.positions.get('a').x,288);
 assert.ok(trial.snapshot.routes.get('a|p1').points.length>=4);
 assert.ok(trial.snapshot.routes.get('a|p1').points.some(p=>p.x!==150&&p.x!==250&&p.x!==50));
});

test('ningún movimiento con Lipschitz >= 1 puede aprobarse',()=>{
 const original=simple();
 const bad=createCertifiedPatch({rects:original.rects,targetId:'a',dx:90});
 assert.equal(bad.valid,false);
 assert.match(bad.reason,/Lipschitz/);
});

test('la meseta rígida no puede deformar cuadros de terceros',()=>{
 const original=simple();
 original.rects.set('c',rect('c',420,100));
 original.positions.set('c',{x:420,y:100});
 const bad=createCertifiedPatch({rects:original.rects,targetId:'a',dx:8});
 assert.equal(bad.valid,false);
 assert.match(bad.reason,/otro cuadro/);
});

test('PPR real: antes de mover cualquier cosa se exigen las 217 rutas y 71 cruces de 01',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
 const source=computeInitialRoutes(fixture);
 const routes=new Map(source.routes);
 const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
 const reference=new TopologyRegister({edgeKey}).capture({
  positions:new Map(fixture.positions),rects:new Map(fixture.rects),
  routes,edges:fixture.edges
 });
 assert.equal(reference.pending.length,0);
 assert.equal(reference.crossings.reduce((s,c)=>s+c.count,0),71);
 const result=computeCertified02({...fixture,routes:[...routes],
  reference,maxMoves:3});
 assert.equal(result.topologyPreserved,true,JSON.stringify(result));
 assert.equal(result.certified,true,JSON.stringify(result));
 assert.equal(result.audit.drawn,217);
 assert.equal(result.audit.crossings,71);
 assert.equal(result.report.issueCount,0);
 assert.ok(result.steps.length>=1);
 assert.ok(result.steps.every(s=>s.maxLip<1&&s.crossings===71));
 assert.equal(result.valid,false,'no declarar completadas las cuatro prioridades');
});
