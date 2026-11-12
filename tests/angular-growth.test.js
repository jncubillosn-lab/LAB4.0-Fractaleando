import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {computeAngularGrowth} from '../js/geometry/AngularGrowthLayout.js';
import {analyzeRadialHierarchy} from '../js/geometry/RadialHierarchy.js';

const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));

test('02 angular: 210 conceptos, J1 próximos y J2-J5 estrictamente exteriores',()=>{
 const r=computeAngularGrowth(fixture);
 assert.equal(r.valid,true,JSON.stringify(r.stats.unplaced));
 assert.equal(r.positions.length,210);
 assert.equal(r.rects.length,210);
 assert.equal(r.stats.arms,3);
 assert.equal(r.stats.overlaps,0);
 assert.equal(r.stats.sectorsValid,true);
 assert.equal(r.stats.radialValid,true);
 assert.deepEqual(r.stats.radialBands.map(x=>x.count),[1,3,32,122,46,6]);
 for(let i=1;i<r.stats.radialBands.length;i++)
  assert.ok(r.stats.radialBands[i].min>r.stats.radialBands[i-1].max);
 const original=analyzeRadialHierarchy({nodes:fixture.nodes,positions:fixture.positions});
 assert.ok(r.stats.radialBands[1].max<original.summary[1].min);
 assert.ok(r.stats.radialBands[1].max<r.stats.radialBands[2].min);
 assert.ok(r.stats.centerManhattan<r.stats.sourceCenterManhattan);
 assert.ok(r.stats.centerManhattan>0);
 assert.equal(r.stats.unplaced.length,0);
});

test('02 angular: determinismo sin imponer radios iguales a descendientes',()=>{
 const a=computeAngularGrowth(fixture),b=computeAngularGrowth(fixture);
 assert.deepEqual(a.positions,b.positions);
 assert.deepEqual(a.stats.radialBands,b.stats.radialBands);
 assert.ok(a.stats.radialBands[2].span>0);
 assert.ok(a.stats.radialBands[3].span>0);
});

test('02 angular: la cuenta de zonas responde a cuatro J1, no a tres fijos',()=>{
 const nodes=[
  {id:'p1',parent:null},{id:'a',parent:'p1',branch:0},
  {id:'b',parent:'p1',branch:1},{id:'c',parent:'p1',branch:2},
  {id:'d',parent:'p1',branch:3},
  {id:'a1',parent:'a'},{id:'b1',parent:'b'},
  {id:'c1',parent:'c'},{id:'d1',parent:'d'}
 ];
 const positions=nodes.map((n,i)=>[n.id,{x:100*i,y:80*i}]);
 const rects=nodes.map(n=>[n.id,{id:n.id,w:90,h:55}]);
 const r=computeAngularGrowth({nodes,positions,rects});
 assert.equal(r.valid,true,JSON.stringify(r.stats));
 assert.equal(r.stats.arms,4);
 assert.equal(r.stats.radialBands[1].count,4);
 assert.equal(r.stats.radialBands[2].count,4);
});

test('02 angular: no es posible aprobar jerarquía cíclica',()=>{
 const nodes=[{id:'p1',parent:null},{id:'a',parent:'b'},{id:'b',parent:'a'}];
 const rects=nodes.map(n=>[n.id,{id:n.id,w:90,h:55}]);
 const positions=nodes.map((n,i)=>[n.id,{x:i*100,y:0}]);
 const r=computeAngularGrowth({nodes,rects,positions});
 assert.equal(r.valid,false);
 assert.match(r.reason,/Jerarquía incompleta/);
});
