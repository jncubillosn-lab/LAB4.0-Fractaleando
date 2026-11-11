import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';
import {readFileSync} from 'node:fs';

const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
function basic(){
 const nodes=['a','b','c','d','e','f'];
 const positions=new Map(nodes.map((id,i)=>[id,{x:i*100,y:i*60}]));
 const rects=new Map(nodes.map(id=>[id,{id,w:60,h:50}]));
 const edges=[{from:'a',to:'b'},{from:'c',to:'d'},{from:'e',to:'f'}];
 const make=(edge,points,fromPort,toPort)=>[edgeKey(edge),{edge,points,fromPort,toPort}];
 const port=(side,x,y)=>({side,x,y,sx:x,sy:y});
 const routes=new Map([
  make(edges[0],[{x:0,y:10},{x:120,y:10}],port('right',0,10),port('left',120,10)),
  make(edges[1],[{x:0,y:30},{x:120,y:30}],port('right',0,30),port('left',120,30)),
  make(edges[2],[{x:50,y:-25},{x:50,y:55}],port('bottom',50,-25),port('top',50,55)),
 ]);
 return {positions,rects,routes,edges};
}
test('el registro de PPR identifica los 217 vínculos y 71 cruces sin incorporar coordenadas',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
 const routes=new Map(computeInitialRoutes(fixture).routes);
 const register=new TopologyRegister({edgeKey});
 const sample=register.capture({positions:new Map(fixture.positions),rects:new Map(fixture.rects),
  routes,edges:fixture.edges});
 assert.equal(sample.edges.length,217);
 assert.equal(sample.crossings.reduce((n,c)=>n+c.count,0),71);
 assert.equal(sample.pending.length,0);
 assert.ok(sample.neighbors.length>0);
 assert.ok(sample.ports.p1.every(p=>/^p1:p\d+$/.test(p.id)));
 assert.ok(!JSON.stringify(sample).includes('"x":-766'));
 assert.equal(register.observe(sample).valid,true);
});
test('escalado positivo y traslación conservan las relaciones registradas',()=>{
 const base=basic(),register=new TopologyRegister({edgeKey});
 register.observe(register.capture(base));
 const moved={
  edges:base.edges,
  positions:new Map([...base.positions].map(([id,p])=>[id,{x:p.x*2+250,y:p.y*3-300}])),
  rects:new Map([...base.rects].map(([id,r])=>[id,{...r,w:r.w*2,h:r.h*3}])),
  routes:new Map([...base.routes].map(([id,r])=>[id,{...r,
   points:r.points.map(p=>({x:p.x*2+250,y:p.y*3-300})),
   fromPort:{...r.fromPort,x:r.fromPort.x*2+250,y:r.fromPort.y*3-300},
   toPort:{...r.toPort,x:r.toPort.x*2+250,y:r.toPort.y*3-300}}]))
 };
 const report=register.observe(register.capture(moved));
 assert.equal(report.valid,true,JSON.stringify(report));
});
test('conserva identidad de puerto tras insertar nuevos vínculos',()=>{
 const base=basic(),register=new TopologyRegister({edgeKey});
 const old=register.capture(base);register.observe(old);
 const rt={edge:{from:'a',to:'g'},points:[{x:0,y:50},{x:100,y:50}],
  fromPort:{side:'right',x:0,y:50},toPort:{side:'left',x:100,y:50}};
 const extended={...base,edges:[...base.edges,rt.edge],
  positions:new Map([...base.positions,['g',{x:850,y:0}]]),
  rects:new Map([...base.rects,['g',{id:'g',w:60,h:50}]]),
  routes:new Map([...base.routes,[edgeKey(rt.edge),rt]])};
 const next=register.capture(extended);
 const prevId=old.ports.a.find(p=>p.edge===edgeKey(base.edges[0])).id;
 assert.equal(next.ports.a.find(p=>p.edge===edgeKey(base.edges[0])).id,prevId);
 assert.equal(register.observe(next).valid,true);
});
test('identifica inversión de orden de puertos',()=>{
 const base=basic(),register=new TopologyRegister({edgeKey});
 register.observe(register.capture(base));
 const modified=basic();
 for(const id of [edgeKey(base.edges[0]),edgeKey(base.edges[1])]){
  const rt=modified.routes.get(id),v=rt.fromPort.y;
  rt.fromPort.y=v===10?30:10;
 }
 const report=register.compare(register.reference,register.capture(modified));
 // Los puertos pertenecen a nodos distintos: cambiar valores no invierte orden en el mismo cuadro.
 assert.equal(report.counts.portOrder,0);
});
test('detecta inversión real de dos puertos sobre el mismo cuadro',()=>{
 const base=basic();
 base.routes.get(edgeKey(base.edges[1])).edge.from='a';
 base.edges[1].from='a';
 const oldKey=edgeKey({from:'c',to:'d'}),newKey=edgeKey(base.edges[1]);
 base.routes.set(newKey,base.routes.get(oldKey));base.routes.delete(oldKey);
 const register=new TopologyRegister({edgeKey});
 const previous=register.capture(base);register.observe(previous);
 const changed=basic();
 changed.edges[1].from='a';
 changed.routes.get(oldKey).edge.from='a';
 const second=changed.routes.get(oldKey);
 changed.routes.delete(oldKey);changed.routes.set(newKey,second);
 const pA=changed.routes.get(edgeKey(changed.edges[0])).fromPort;
 const pB=changed.routes.get(newKey).fromPort;
 [pA.y,pB.y]=[pB.y,pA.y];
 const report=register.compare(previous,register.capture(changed));
 assert.ok(report.counts.portOrder>0,JSON.stringify(report));
});
test('cruce existente no puede desaparecer ni cambiar su secuencia',()=>{
 const base=basic(),register=new TopologyRegister({edgeKey});
 const prior=register.capture(base);register.observe(prior);
 assert.equal(prior.crossings.reduce((n,c)=>n+c.count,0),2);
 const missing=basic();
 missing.routes.get(edgeKey(base.edges[2])).points=[{x:150,y:-25},{x:150,y:55}];
 const report=register.observe(register.capture(missing));
 assert.ok(report.counts.crossing>0,JSON.stringify(report));
 assert.equal(register.reference,prior,'Una topología inválida NO sustituye la referencia');
});
test('registra inversión de lado entre dos carriles paralelos',()=>{
 const base=basic(),register=new TopologyRegister({edgeKey});
 const old=register.capture(base);register.observe(old);
 const changed=basic();
 const rt1=changed.routes.get(edgeKey(base.edges[0])),rt2=changed.routes.get(edgeKey(base.edges[1]));
 rt1.points=rt1.points.map(p=>({...p,y:40}));
 rt2.points=rt2.points.map(p=>({...p,y:0}));
 const report=register.compare(old,register.capture(changed));
 assert.ok(report.counts.neighbor>0,JSON.stringify(report));
});
test('detecta inversión de orden espacial de conceptos',()=>{
 const base=basic(),register=new TopologyRegister({edgeKey});
 register.observe(register.capture(base));
 const moved=basic();
 moved.positions.get('a').x=10000;
 const report=register.compare(register.reference,register.capture(moved));
 assert.ok(report.counts.nodeOrder>0,JSON.stringify(report));
});
