import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PcbRouter} from '../js/geometry/PcbRouter.js';

const nodes=[
 {id:'p1',parent:null},{id:'b0',parent:'p1'},
 {id:'f0',parent:'p1'},{id:'t0',parent:'p1'}
];
const byId=new Map(nodes.map(n=>[n.id,n]));
const make=mode=>new PcbRouter({state:{nodes,edges:[]},
 nodeById:id=>byId.get(id),mode,
 clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
const center={id:'p1',x:0,y:0,parent:null},arm=[
 {id:'b0',x:-215,y:-125,parent:'p1'},
 {id:'f0',x:215,y:-125,parent:'p1'},
 {id:'t0',x:0,y:250,parent:'p1'}
];

test('02 usa los puertos que miran a cada J1, nunca todas las salidas abajo',()=>{
 const r=make('02');
 assert.deepEqual(arm.map(n=>r.prefSide(center,n,{from:'p1',to:n.id})),
  ['left','right','bottom']);
 assert.deepEqual(arm.map(n=>r.prefSide(n,center,{from:'p1',to:n.id})),
  ['right','left','top']);
});

test('01 conserva su criterio de puertos previo para la vista plana',()=>{
 const r=make('01');
 assert.deepEqual(arm.map(n=>r.prefSide(center,n,{from:'p1',to:n.id})),
  ['bottom','bottom','bottom']);
});
