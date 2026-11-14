import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clockChildPosition,nextClockIndex} from '../js/geometry/ClockPlacement.js';
import {segmentEntersRect} from '../js/geometry/SegmentGeometry.js';

const parent={id:'parent',x:250,y:-180,w:190,h:53,l:155,r:345,t:-206.5,b:-153.5};
const metric={w:180,h:53};
const rect=p=>({l:p.x-90,r:p.x+90,t:p.y-26.5,b:p.y+26.5});
const hour=p=>(Math.round((Math.atan2(p.x-parent.x,parent.y-p.y)*6/Math.PI+12)%12))%12;
test('los hermanos comparan dos posiciones a intervalos de 3:30 y conservan el padre y las rutas',()=>{
 const rects=[parent],before=JSON.stringify(parent),children=[];
 for(let i=0;i<24;i++){
  const index=nextClockIndex(children);
  const p=clockChildPosition({parent,metric,index,rects}),box=rect(p);
  assert.ok([index,index+1].includes(p.clockStep));
  const halfHour=(Math.atan2(p.x-parent.x,parent.y-p.y)*12/Math.PI+24)%24;
  assert.ok(Math.abs(halfHour-(p.clockStep*7%24))<1e-7);
  assert.ok(rects.every(r=>box.l>=r.r+16||box.r<=r.l-16||box.t>=r.b+16||box.b<=r.t-16));
  rects.push(box);children.push(p);
 }
 assert.equal(JSON.stringify(parent),before);
 assert.equal(nextClockIndex(JSON.parse(JSON.stringify(children))),children.at(-1).clockStep+1);
});
test('si el primer rayo está bloqueado, el segundo evita el rodeo largo',()=>{
 const segments=[{a:{x:0,y:-300},b:{x:500,y:-300}}];
 const obstacle={l:150,r:350,t:-1500,b:-220};
 const p=clockChildPosition({parent,metric,index:0,rects:[parent,obstacle],segments});
 assert.equal(p.clockStep,1);
 assert.equal(segmentEntersRect(segments[0].a,segments[0].b,rect(p),12),false);
 assert.ok(Math.hypot(p.x-parent.x,p.y-parent.y)<300);
});
