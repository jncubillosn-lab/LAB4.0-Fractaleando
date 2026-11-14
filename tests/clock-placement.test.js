import {test} from 'node:test';
import assert from 'node:assert/strict';
import {clockChildPosition} from '../js/geometry/ClockPlacement.js';
import {segmentEntersRect} from '../js/geometry/SegmentGeometry.js';

const parent={id:'parent',x:250,y:-180,w:190,h:53,l:155,r:345,t:-206.5,b:-153.5};
const metric={w:180,h:53};
const rect=p=>({l:p.x-90,r:p.x+90,t:p.y-26.5,b:p.y+26.5});
const hour=p=>(Math.round((Math.atan2(p.x-parent.x,parent.y-p.y)*6/Math.PI+12)%12))%12;
test('los hermanos recorren el reloj de cinco en cinco, sin solaparse ni mover al padre',()=>{
 const rects=[parent],before=JSON.stringify(parent),hours=[];
 for(let index=0;index<13;index++){
  const p=clockChildPosition({parent,metric,index,rects}),box=rect(p);
  hours.push(hour(p));
  assert.ok(rects.every(r=>box.l>=r.r+16||box.r<=r.l-16||box.t>=r.b+16||box.b<=r.t-16));
  rects.push(box);
 }
 assert.deepEqual(hours,[0,5,10,3,8,1,6,11,4,9,2,7,0]);
 assert.equal(JSON.stringify(parent),before);
 assert.ok(rects[13].b<rects[1].t);
});
test('una dirección ocupada se prolonga sin cambiar de hora ni invadir una ruta',()=>{
 const segments=[{a:{x:0,y:-300},b:{x:500,y:-300}}];
 const p=clockChildPosition({parent,metric,index:0,rects:[parent],segments});
 assert.equal(hour(p),0);assert.equal(p.x,parent.x);
 assert.equal(segmentEntersRect(segments[0].a,segments[0].b,rect(p),12),false);
 assert.ok(p.y<-300);
});
