import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';
import {readFileSync} from 'node:fs';
const router=new PcbRouter({state:{nodes:[],edges:[]},nodeById:()=>null,clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
const validator=new GeometryValidator({router,rectOverlap:(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t});
test('a nearly horizontal segment still has its real crossing and visual jump',()=>{
 const a={x:0,y:0},b={x:100,y:.005},c={x:50,y:-50},d={x:50,y:50};
 const relation=router.segmentRelation(a,b,c,d);
 assert.equal(relation.cross,1);assert.equal(relation.at.x,50);
 assert(Math.abs(relation.at.y-.0025)<1e-9);
 assert.equal(router.intersections([a,b],router.allSegments([c,d])).length,1);
});
test('ports on the perimeter do not authorize traversing their own boxes',()=>{
 const rects=[{id:'a',l:-30,r:30,t:-25,b:25},{id:'b',l:170,r:230,t:-25,b:25}];
 const fromPort={side:'right',x:30,y:0,sx:49,sy:0},toPort={side:'left',x:170,y:0,sx:151,sy:0};
 const points=[{x:30,y:0},{x:-100,y:0},{x:-100,y:-100},{x:300,y:-100},{x:300,y:0},{x:170,y:0}];
 assert.equal(router.routeShapeValid(points,rects,['a','b'],[],true),null);
 assert.equal(validator.validateRoute({edge:{from:'a',to:'b'},fromPort,toPort,points},rects).ok,false);
});
test('simplification does not accumulate tolerance into a diagonal accepted by the router',()=>{
 const points=[{x:0,y:0},{x:50,y:.006},{x:100,y:.012}];
 assert.equal(router.simplify(points).length,3);
 assert.equal(router.routeShapeValid([points[0],points[2]],[],[],[],true),null);
});
test('simplification preserves a short orthogonal dogleg instead of inventing a diagonal',()=>{
 const points=[{x:0,y:0},{x:40,y:0},{x:40,y:.0398},{x:80,y:.0398}];
 const simplified=router.simplify(points);
 assert.deepEqual(simplified,points);
 assert.notEqual(router.routeShapeValid(simplified,[],[],[],true),null);
});
test('compact diagonal branches choose the faces with physical clearance, without artificial crossings',()=>{
 const nodes=[{id:'p1',parent:null,x:0,y:0},
  {id:'a',parent:'p1',x:-110,y:-110},{id:'b',parent:'p1',x:-110,y:110},
  {id:'c',parent:'p1',x:110,y:110},{id:'d',parent:'p1',x:110,y:-110}];
 const edges=nodes.slice(1).map(n=>({from:'p1',to:n.id}));
 const rects=nodes.map(n=>{const w=n.id==='p1'?108:178,h=53;
  return [n.id,{id:n.id,x:n.x,y:n.y,w,h,l:n.x-w/2,r:n.x+w/2,t:n.y-h/2,b:n.y+h/2}];});
 const result=computeInitialRoutes({mode:'02',nodes,edges,rects,
  positions:nodes.map(n=>[n.id,{x:n.x,y:n.y}]),levels:{p1:0,a:1,b:1,c:1,d:1}});
 assert(result.routes.every(([,r])=>r.points));
 const circuitRouter=new PcbRouter({state:{nodes,edges},nodeById:id=>nodes.find(n=>n.id===id),mode:'02',clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const circuitValidator=new GeometryValidator({router:circuitRouter,rectOverlap:(a,b)=>a.l<b.r&&a.r>b.l&&a.t<b.b&&a.b>b.t});
 const audit=circuitValidator.audit(rects.map(([,r])=>r),result.routes.map(([,r])=>r));
 assert.equal(audit.invalid,0,JSON.stringify(audit.details));assert.equal(audit.crossings,0);
});
test('an exhausted routing budget preserves every edge as explicitly unresolved',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url)));
 const result=computeInitialRoutes({...fixture,maxDurationMs:0});
 assert.equal(result.budgetExceeded,true);assert.equal(result.routes.length,217);
 assert.equal(result.calculations,0);
 assert(result.routes.every(([,r])=>r.points===null&&r.unresolved));
});
test('the full initial PPR remains complete and independently valid',()=>{
 const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url)));
 const result=computeInitialRoutes(fixture),routes=new Map(result.routes);
 assert.equal(routes.size,217);assert([...routes.values()].every(r=>r.points));
 const audit=validator.audit(fixture.rects.map(([,r])=>r),[...routes.values()]);
 assert.equal(audit.invalid,0,JSON.stringify(audit.details));assert.equal(audit.portsRepeated,0);
 assert.equal(audit.crossings,71);
});
