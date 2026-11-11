import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {computeCompact02} from '../js/geometry/TopologicalCompact.js';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {ViewLayouts} from '../js/geometry/ViewLayouts.js';

const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
const built=computeInitialRoutes(fixture);
const levelData=ViewLayouts.graphLevels(fixture.nodes,fixture.edges);
const levels=Object.fromEntries(levelData.levels);
const ordered=fixture.edges.map((e,i)=>({...e,__index:i})).sort((a,b)=>{
 const score=x=>Math.min(levels[x.from]??1000,levels[x.to]??1000)*10+
  (x.kind==='transversal'?5:0)+
  (Math.abs((levels[x.from]??1000)-(levels[x.to]??1000))>1?2:0);
 return score(a)-score(b)||a.__index-b.__index;
});
const refRegister=new TopologyRegister({edgeKey});
const reference=refRegister.capture({positions:new Map(fixture.positions),
 rects:new Map(fixture.rects),routes:new Map(built.routes),edges:ordered});
const input={nodes:fixture.nodes,edges:fixture.edges,positions:fixture.positions,
 rects:fixture.rects,routes:built.routes,reference,levels};

test('02: no altera ni un cruce de 01 durante la transformación certificada',()=>{
 assert.equal(reference.crossings.reduce((n,c)=>n+c.count,0),71);
 const r=computeCompact02(input);
 assert.equal(r.topologyValid,true,JSON.stringify(r.report?.issues||[]));
 assert.equal(r.topology?.crossings.reduce((n,c)=>n+c.count,0),71);
 assert.equal(r.routes.length,217);
 assert.equal(r.audit.drawn,217);
 assert.equal(r.audit.boxes,0);
 assert.equal(r.audit.invalid,0);
 assert.equal(r.audit.portsRepeated,0);
 assert.equal(r.report.issueCount,0);
 assert.equal(r.positions.length,210);
 assert.ok(r.attempted>0);
 assert.deepEqual(new Map(r.positions).get('p1'),{x:0,y:0});
 assert.equal(r.valid,r.topologyValid&&r.zoneValid&&r.lengthValid);
 assert.ok(!r.valid||r.stats.reductionPercent>0);
});

test('02: una referencia de cruces alterada rechaza todo el proceso, no reparcha enlaces',()=>{
 const tampered=structuredClone(reference);
 assert.ok(tampered.crossings.length>0);
 tampered.crossings[0].count++;
 const r=computeCompact02({...input,reference:tampered});
 assert.equal(r.valid,false);
 assert.equal(r.topologyValid,false);
 assert.ok(!r.positions);
 assert.match(r.reason,/01/);
});

test('02: sin registro de 01 no se genera ninguna vista provisional',()=>{
 const r=computeCompact02({...input,reference:null});
 assert.equal(r.valid,false);
 assert.equal(r.topologyValid,false);
 assert.ok(!r.positions);
});

test('02: nunca equipara un grafo editado con la firma anterior de 01',()=>{
 const edges=structuredClone(fixture.edges);
 edges[0].to='f0';
 const r=computeCompact02({...input,edges});
 assert.equal(r.valid,false);
 assert.equal(r.topologyValid,false);
 assert.ok(!r.positions);
});


test('02: cuatro J1 pueden satisfacer simultáneamente las tres normas',()=>{
 const nodes=[
  {id:'p1',parent:null,branch:-1},
  {id:'a',parent:'p1',branch:0},{id:'b',parent:'p1',branch:1},
  {id:'c',parent:'p1',branch:2},{id:'d',parent:'p1',branch:3}
 ];
 const ps=new Map([['p1',{x:0,y:0}],['a',{x:0,y:-360}],
  ['b',{x:360,y:0}],['c',{x:0,y:360}],['d',{x:-360,y:0}]]);
 const rects=new Map([...ps].map(([id,p])=>[id,{id,...p,w:100,h:60,
  l:p.x-50,r:p.x+50,t:p.y-30,b:p.y+30}]));
 const edges=nodes.slice(1).map(n=>({from:'p1',to:n.id}));
 const port=(side,x,y)=>({side,x,y,
  sx:x+(side==='right'?19:side==='left'?-19:0),
  sy:y+(side==='bottom'?19:side==='top'?-19:0)});
 const endpoints={
  a:[port('top',0,-30),port('bottom',0,-330)],
  b:[port('right',50,0),port('left',310,0)],
  c:[port('bottom',0,30),port('top',0,330)],
  d:[port('left',-50,0),port('right',-310,0)]
 };
 const routes=new Map(edges.map(e=>{
  const [fromPort,toPort]=endpoints[e.to];
  return [edgeKey(e),{edge:e,points:[{x:fromPort.x,y:fromPort.y},
   {x:toPort.x,y:toPort.y}],fromPort,toPort}];
 }));
 const topology=new TopologyRegister({edgeKey});
 const reference=topology.capture({positions:ps,rects,routes,edges});
 const r=computeCompact02({nodes,edges,positions:[...ps],rects:[...rects],
  routes:[...routes],levels:{p1:0,a:1,b:1,c:1,d:1},reference});
 assert.equal(r.topologyValid,true,JSON.stringify(r.report?.issues));
 assert.equal(r.zoneValid,true,JSON.stringify(r.stats?.sectors));
 assert.equal(r.lengthValid,true,r.reason);
 assert.equal(r.valid,true);
 assert.equal(r.stats.arms,4);
 assert.equal(r.stats.crossings,0);
 assert.equal(r.audit.drawn,4);
 assert.ok(r.stats.routeLength<r.stats.sourceRouteLength);
});
