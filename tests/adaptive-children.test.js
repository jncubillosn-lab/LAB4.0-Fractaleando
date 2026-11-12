import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';
import {translateChildElastic,translateChildPatch,childSpacingReport} from '../js/geometry/AdaptiveChildSpacing.js';

const nodes=[{id:'p1',parent:null},{id:'a',parent:'p1'},
 {id:'a1',parent:'a'},{id:'a2',parent:'a'}];
const positions=new Map([['p1',{x:0,y:0}],['a',{x:0,y:210}],
 ['a1',{x:-240,y:470}],['a2',{x:230,y:480}]]);
const rects=new Map([...positions].map(([id,p])=>[id,{id,...p,w:100,h:60,
 l:p.x-50,r:p.x+50,t:p.y-30,b:p.y+30}]));
const port=(side,x,y)=>({side,x,y,
 sx:x+(side==='right'?19:side==='left'?-19:0),
 sy:y+(side==='bottom'?19:side==='top'?-19:0)});
const edges=[{from:'p1',to:'a'},{from:'a',to:'a1'},{from:'a',to:'a2'}];
const edgeKey=e=>[e.from,e.to].sort().join('|');
const routes=new Map([
 [edgeKey(edges[0]),{edge:edges[0],fromPort:port('bottom',0,30),
  toPort:port('top',0,180),points:[{x:0,y:30},{x:0,y:180}]}],
 [edgeKey(edges[1]),{edge:edges[1],fromPort:port('left',-50,210),
  toPort:port('top',-240,440),points:[
   {x:-50,y:210},{x:-240,y:210},{x:-240,y:440}]}],
 [edgeKey(edges[2]),{edge:edges[2],fromPort:port('right',50,210),
  toPort:port('top',230,450),points:[
   {x:50,y:210},{x:230,y:210},{x:230,y:450}]}]
]);
const baseline={ps:positions,rr:rects,rs:routes};
const length=rs=>[...rs.values()].reduce((total,r)=>total+
 r.points.slice(1).reduce((sum,p,i)=>sum+
  Math.hypot(p.x-r.points[i].x,p.y-r.points[i].y),0),0);
const reference=new TopologyRegister({edgeKey}).capture({
 positions,rects,routes,edges});
const router=new PcbRouter({state:{nodes,edges},
 nodeById:id=>nodes.find(n=>n.id===id),clamp:(v,a,b)=>Math.max(a,Math.min(b,v)),
 mode:'02'});
const validator=new GeometryValidator({router,rectOverlap:(a,b,gap=0)=>
 a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap});

test('EXP-02-A: un hijo se aproxima sin obligar al hermano a compartir radio',()=>{
 const candidate=translateChildElastic(baseline,'a1','x',18);
 assert.ok(candidate);
 assert.equal(candidate.ps.get('a1').x,-222);
 assert.deepEqual(candidate.ps.get('a2'),positions.get('a2'));
 assert.equal(length(baseline.rs)-length(candidate.rs),18);
 const observed=new TopologyRegister({edgeKey}).capture({
  positions:candidate.ps,rects:candidate.rr,routes:candidate.rs,edges});
 const report=new TopologyRegister({edgeKey}).compare(reference,observed);
 assert.equal(report.issueCount,0,JSON.stringify(report));
 const audit=validator.audit([...candidate.rr.values()],[...candidate.rs.values()]);
 assert.equal(audit.invalid,0,JSON.stringify(audit.details));
 assert.equal(audit.boxes,0);
 assert.equal(audit.drawn,edges.length);
 assert.equal(observed.pending.length,0);
 const original=childSpacingReport(baseline,nodes);
 const moved=childSpacingReport(candidate,nodes);
 assert.ok(moved.byLevel[2].min<original.byLevel[2].min);
 assert.equal(moved.siblingGroups,1);
});

test('EXP-02-A: si el movimiento invade otra caja se rechaza antes de enrutar',()=>{
 assert.equal(translateChildElastic(baseline,'a1','x',420),null);
});
test('EXP-02-A: no basta deformar el dibujo si la longitud real aumenta',()=>{
 const elastic=translateChildElastic(baseline,'a1','x',18);
 const patch=translateChildPatch(baseline,'a1','x',18);
 assert.ok(elastic&&patch);
 assert.ok(length(elastic.rs)<length(baseline.rs));
 assert.ok(length(patch.rs)>length(baseline.rs));
});
