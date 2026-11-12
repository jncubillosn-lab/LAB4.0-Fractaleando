import {test} from 'node:test';
import assert from 'node:assert/strict';
import {analyzeRadialHierarchy} from '../js/geometry/RadialHierarchy.js';

const nodes=[
 {id:'p1',parent:null},
 {id:'a',parent:'p1'},{id:'b',parent:'p1'},{id:'c',parent:'p1'},
 {id:'aa',parent:'a'},{id:'bb',parent:'b'},{id:'cc',parent:'c'},
 {id:'aaa',parent:'aa'}
];
const positions=new Map([
 ['p1',{x:0,y:0}],
 ['a',{x:70,y:-70}],['b',{x:0,y:130}],['c',{x:-150,y:-20}],
 ['aa',{x:220,y:-60}],['bb',{x:0,y:300}],['cc',{x:-310,y:-25}],
 ['aaa',{x:380,y:190}]
]);

test('v1.1: radios de un mismo nivel no tienen que ser iguales',()=>{
 const r=analyzeRadialHierarchy({nodes,positions});
 assert.equal(r.valid,true,JSON.stringify(r));
 assert.ok(r.summary[1].span>40);
 assert.ok(r.summary[2].span>60);
 assert.ok(r.summary[1].max<r.summary[2].min);
 assert.ok(r.summary[2].max<r.summary[3].min);
 assert.equal(r.summary[1].count,3);
});

test('v1.1: un solo J2 dentro del radio del J1 más lejano invalida 02',()=>{
 const ps=new Map(positions);
 ps.set('bb',{x:40,y:90});
 const r=analyzeRadialHierarchy({nodes,positions:ps});
 assert.equal(r.valid,false);
 assert.ok(r.violations.some(v=>v.innerLevel===1&&v.outerLevel===2));
 assert.ok(r.violations.some(v=>v.innerFarthest.includes('c')));
 assert.ok(r.violations.some(v=>v.outerNearest.includes('bb')));
});

test('v1.1: dos niveles de igual radio no cumplen una desigualdad estricta',()=>{
 const ps=new Map(positions);
 ps.set('bb',{x:-150,y:-20});
 const r=analyzeRadialHierarchy({nodes,positions:ps});
 assert.equal(r.valid,false);
});

test('v1.1: el número de ramas se obtiene de la estructura y no se fija en tres',()=>{
 const extra=[...nodes,{id:'d',parent:'p1'},{id:'dd',parent:'d'}];
 const ps=new Map(positions);
 ps.set('d',{x:0,y:-160});ps.set('dd',{x:0,y:-330});
 const r=analyzeRadialHierarchy({nodes:extra,positions:ps});
 assert.equal(r.summary[1].count,4);
 assert.equal(r.valid,true,JSON.stringify(r));
});

test('v1.1: detecta huérfanos y ciclos sin inventar pertenencia',()=>{
 const withOrphan=[...nodes,{id:'lost',parent:'unknown'}];
 assert.equal(analyzeRadialHierarchy({nodes:withOrphan,positions}).valid,false);
 const withCycle=[...nodes,{id:'x',parent:'y'},{id:'y',parent:'x'}];
 assert.equal(analyzeRadialHierarchy({nodes:withCycle,positions}).valid,false);
});
