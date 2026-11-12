import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TopologyRegister} from '../js/core/TopologyRegister.js';

const edgeKey=e=>[e.from,e.to].sort().join('|');
const edges=['a|p1','b|p1','c|p1'];
const ref={
 schema:'p1.topology.v1',
 edges,
 ports:{
  p1:edges.map((edge,i)=>({edge,id:'p1:p'+(i+1),side:'bottom'})),
  a:[{edge:edges[0],id:'a:p1',side:'top'}],
  b:[{edge:edges[1],id:'b:p1',side:'top'}],
  c:[{edge:edges[2],id:'c:p1',side:'top'}]
 },
 nodeOrders:{x:[['a'],['p1'],['b'],['c']],y:[['p1'],['a'],['b'],['c']]},
 crossings:[],crossingOrders:Object.fromEntries(edges.map(e=>[e,[]])),
 neighbors:[],pending:[]
};

test('02 permite cambiar el orden cartesiano y girar puertos sin perder su ciclo',()=>{
 const candidate=structuredClone(ref);
 candidate.nodeOrders={x:[['p1'],['c'],['b'],['a']],y:[['c'],['p1'],['a'],['b']]};
 candidate.ports.p1=[candidate.ports.p1[2],candidate.ports.p1[0],candidate.ports.p1[1]]
  .map(p=>({...p,side:'right'}));
 for(const id of ['a','b','c'])candidate.ports[id][0].side='left';
 const register=new TopologyRegister({edgeKey});
 assert.equal(register.compareEmbedding(ref,candidate).valid,true);
 assert.equal(register.compare(ref,candidate).valid,false);
});

test('02 rechaza invertir el orden circular de tres conexiones de J0',()=>{
 const candidate=structuredClone(ref);
 candidate.ports.p1=[candidate.ports.p1[0],candidate.ports.p1[2],candidate.ports.p1[1]];
 const r=new TopologyRegister({edgeKey}).compareEmbedding(ref,candidate);
 assert.equal(r.valid,false);
 assert.ok(r.counts.portOrder>0);
});

test('02 rechaza cambiar qué rutas se cruzan, aunque conserve el número total',()=>{
 const base=structuredClone(ref);
 base.crossings=[{a:edges[0],b:edges[1],count:1,over:edges[1]}];
 base.crossingOrders[edges[0]]=[edges[1]];
 base.crossingOrders[edges[1]]=[edges[0]];
 const candidate=structuredClone(base);
 candidate.crossings=[{a:edges[0],b:edges[2],count:1,over:edges[2]}];
 candidate.crossingOrders[edges[0]]=[edges[2]];
 candidate.crossingOrders[edges[1]]=[];
 candidate.crossingOrders[edges[2]]=[edges[0]];
 const r=new TopologyRegister({edgeKey}).compareEmbedding(base,candidate);
 assert.equal(r.valid,false);
 assert.ok(r.counts.crossing>0&&r.counts.crossingOrder>0);
});

test('02 rechaza pérdida de la relación de carriles del registro original',()=>{
 const base=structuredClone(ref);
 base.neighbors=[{a:edges[0],b:edges[1],axis:'v',side:1}];
 const candidate=structuredClone(base);
 candidate.neighbors=[];
 const r=new TopologyRegister({edgeKey}).compareEmbedding(base,candidate);
 assert.equal(r.valid,false);
 assert.ok(r.counts.neighbor>0);
});

test('02 preserva vecindad aunque una rotación de 180° invierta el lado métrico',()=>{
 const base=structuredClone(ref);
 base.neighbors=[{a:edges[0],b:edges[1],axis:'h',side:1}];
 const candidate=structuredClone(base);
 candidate.neighbors=[{a:edges[0],b:edges[1],axis:'h',side:-1}];
 assert.equal(new TopologyRegister({edgeKey}).compareEmbedding(base,candidate).valid,true);
});
