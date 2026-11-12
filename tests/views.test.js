import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ViewLayouts} from '../js/geometry/ViewLayouts.js';
const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
const metrics=new Map(fixture.rects.map(([id,r])=>[id,{w:r.w,h:r.h}]));
const positions=new Map(fixture.positions);
const runner=new ViewLayouts();
const args={nodes:fixture.nodes,edges:fixture.edges,metrics,sourcePositions:positions};
test('02 no puede obtenerse sin rutas ni firma de 01',()=>{
 assert.throws(()=>runner.compute({mode:'02',...args}),/rutas certificadas de 01/);
});
test('03: radio idéntico por distancia mínima de vínculos y cero colisiones',()=>{
 const result=runner.compute({mode:'03',...args});
 assert.equal(result.positions.size,210);
 assert.equal(result.stats.radialOrder,true);
 assert.equal(result.stats.overlaps,0,JSON.stringify(result.stats.radialExtremes));
 const radii=new Map();
 for(const [id,p] of result.positions){
  const level=result.levels[id],radius=Math.hypot(p.x,p.y);
  if(radii.has(level))assert.ok(Math.abs(radii.get(level)-radius)<.01,id);
  else radii.set(level,radius);
 }
 assert.equal(result.levels.p1,0);
 assert.equal(result.levels.b0,1);
});
test('04: bandas radiales estrictas, T=0 y brazos determinados por J1',()=>{
 const result=runner.compute({mode:'04',...args});
 assert.equal(result.positions.size,210);
 assert.equal(result.stats.arms,3);
 assert.equal(result.stats.T,0);
 assert.equal(result.stats.radialOrder,true);
 assert.equal(result.stats.overlaps,0,JSON.stringify(result.stats.radialExtremes));
 const levels=Object.keys(result.stats.radialExtremes).map(Number).sort((a,b)=>a-b);
 for(let i=1;i<levels.length;i++)assert.ok(result.stats.radialExtremes[levels[i-1]].max<result.stats.radialExtremes[levels[i]].min);
});
test('R01: cuatro hijos directos de P1 producen cuatro brazos',()=>{
 const nodes=[{id:'p1',parent:null,branch:-1},{id:'b0',parent:'p1',branch:0},{id:'f0',parent:'p1',branch:1},{id:'t0',parent:'p1',branch:2},{id:'q0',parent:'p1',branch:3}];
 const edges=nodes.slice(1).map(n=>({from:'p1',to:n.id}));
 const metrics=new Map(nodes.map(n=>[n.id,{w:140,h:56}]));
 const sourcePositions=new Map(nodes.map((n,i)=>[n.id,{x:200*i,y:20*i}]));
 for(const mode of ['03','04']){
  const result=runner.compute({mode,nodes,edges,metrics,sourcePositions});
  assert.equal(result.stats.arms,4);assert.equal(result.positions.size,5);
  assert.equal(result.stats.overlaps,0);
 }
});
test('03 emplea distancia de enlaces al origen, sin inventar conexiones',()=>{
 const nodes=[{id:'p1',parent:null,branch:-1},{id:'a',parent:'p1',branch:0},{id:'b',parent:'a',branch:0},{id:'c',parent:'b',branch:0}];
 const edges=[{from:'p1',to:'a'},{from:'a',to:'b'},{from:'b',to:'c'},{from:'p1',to:'c',kind:'transversal'}];
 const metrics=new Map(nodes.map(n=>[n.id,{w:100,h:52}]));
 const sourcePositions=new Map(nodes.map((n,i)=>[n.id,{x:i*150,y:i*200}]));
 const orbit=runner.compute({mode:'03',nodes,edges,metrics,sourcePositions});
 assert.equal(orbit.levels.c,1);assert.equal(orbit.levels.b,2);assert.equal(edges.length,4);
});
test('03 y 04 son deterministas; 02 exige firma y rutas originales',()=>{
 for(const mode of ['03','04']){
  const a=runner.compute({mode,...args}),b=runner.compute({mode,...args});
  assert.deepEqual([...a.positions],[...b.positions]);
 }
});
