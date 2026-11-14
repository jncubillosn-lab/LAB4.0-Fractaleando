import {test} from 'node:test';
import assert from 'node:assert/strict';
import {hierarchySelection} from '../js/core/HierarchySelection.js';
import {assignOrderedPorts} from '../js/geometry/OrderedPorts.js';
import {routeCrossings,circuitAxis} from '../js/geometry/CircuitGeometry.js';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';
import {bevelRoutes} from '../js/geometry/CircuitRoutes.js';

const router=new PcbRouter({state:{nodes:[],edges:[]},nodeById:()=>null,mode:'02',clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
const validator=new GeometryValidator({router,rectOverlap:(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t});
const rect=(id,x,y,w=60,h=50)=>({id,x,y,w,h,l:x-w/2,r:x+w/2,t:y-h/2,b:y+h/2});
test('J3 resalta J0–J3 y solo vecinos de la siguiente generación; transversales no acortan la ascendencia',()=>{
 const nodes=[{id:'p1'},{id:'a',parent:'p1'},{id:'b',parent:'a'},{id:'c',parent:'b'},
  {id:'d',parent:'c'},{id:'e',parent:'d'},{id:'sibling',parent:'b'},{id:'next',parent:'sibling'}];
 const edges=nodes.filter(n=>n.parent).map(n=>({from:n.parent,to:n.id}));
 edges.push({from:'p1',to:'c',kind:'transversal'},{from:'c',to:'next',kind:'transversal'});
 const focus=hierarchySelection({nodes,edges,selectedId:'c',levels:{p1:0,a:1,b:2,c:3,d:4,e:5,sibling:3,next:4}});
 assert.deepEqual([...focus.nodeIds].sort(),['p1','a','b','c','d','next'].sort());
 assert.deepEqual([...focus.edgeKeys].sort(),['a|p1','a|b','b|c','c|d','c|next'].sort());
 const orphan=hierarchySelection({nodes:[{id:'p1'},{id:'x',parent:'p1'}],edges:[],selectedId:'x'});
 assert.deepEqual([...orphan.nodeIds],['x']);assert.equal(orphan.edgeKeys.size,0);
});
test('puertos enfrentados se alinean dentro del intervalo común para permitir una recta',()=>{
 const nodes=[{id:'a'},{id:'b'}],edges=[{from:'a',to:'b'}];
 const rects=new Map([['a',rect('a',0,0,100,80)],['b',rect('b',200,25,100,80)]]);
 const positions=new Map([...rects].map(([id,r])=>[id,{x:r.x,y:r.y}]));
 const ports=assignOrderedPorts({nodes,edges,rects,positions});
 assert.equal(ports.get('0:a').side,'right');assert.equal(ports.get('0:b').side,'left');
 assert.equal(ports.get('0:a').y,ports.get('0:b').y);
});
test('los cruces de derivadas admiten distancia cero al giro y se cuentan una sola vez',()=>{
 const path=[{x:0,y:0},{x:50,y:0},{x:50,y:50}],cross=[{x:25,y:-25},{x:75,y:25}];
 assert.equal(routeCrossings(path,cross).length,1);
 assert.equal(router.segmentRelation(path[0],path[1],cross[0],cross[1]).cross,1);
 assert.equal(router.segmentRelation(path[1],path[2],cross[0],cross[1]).overlap,false);
});
test('auditor acepta H/V/45 y rechaza la diagonal si invade un cuadro',()=>{
 const a=rect('a',0,0),b=rect('b',200,100);
 const route={edge:{from:'a',to:'b'},fromPort:{side:'right',x:30,y:0,sx:49,sy:0},toPort:{side:'left',x:170,y:100,sx:151,sy:100},
  points:[{x:30,y:0},{x:60,y:0},{x:80,y:20},{x:80,y:100},{x:170,y:100}]};
 assert.equal(validator.validateRoute(route,[a,b]).ok,true);
 assert.equal(validator.validateRoute(route,[a,b,rect('obstacle',70,10,10,10)]).ok,false);
 assert.equal(circuitAxis({x:0,y:0},{x:20,y:10}),null);
});
test('los biseles reducen longitud y la auditoría mide las diagonales dibujadas',()=>{
 const a=rect('a',0,0),b=rect('b',200,100),rects=new Map([['a',a],['b',b]]);
 const route={edge:{from:'a',to:'b'},fromPort:{side:'right',x:30,y:0,sx:49,sy:0},toPort:{side:'left',x:170,y:100,sx:151,sy:100},
  points:[{x:30,y:0},{x:80,y:0},{x:80,y:100},{x:170,y:100}]};
 const result=bevelRoutes({routes:[['a|b',route]],rects,router,validator});
 assert.ok(result.stats.beveledCorners>0);assert.ok(result.stats.savedLength>0);
 assert.equal(validator.audit([...rects.values()],result.routes.map(([,r])=>r)).invalid,0);
 assert.ok(result.routes[0][1].points.some((p,i,all)=>i&&circuitAxis(all[i-1],p)==='d'));
});
