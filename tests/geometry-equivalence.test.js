import {test} from 'node:test';
import assert from 'node:assert/strict';
import {segmentIntersection,segmentEntersRect} from '../js/geometry/SegmentGeometry.js';
import {segmentIntersection as previousIntersection,segmentEntersRect as previousClip} from './fixtures/segment-geometry-0.2.11.js';

test('las comprobaciones rápidas conservan los resultados numéricos de 0.2.11',()=>{
 let seed=20261114;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/2**32;};
 for(let i=0;i<12000;i++){
  const scale=[1e-8,1,1000,1e7][i%4],point=()=>({x:(random()-.5)*scale,y:(random()-.5)*scale});
  const a=point(),b=point(),c=point(),d=point();
  if(i%5===0)b.y=a.y;if(i%7===0)d.x=c.x;if(i%11===0){b.x=a.x;b.y=a.y;}
  if(i%13===0){c.x=b.x;c.y=b.y;}
  assert.deepEqual(segmentIntersection(a,b,c,d),previousIntersection(a,b,c,d),'intersection '+i);
  const r={l:Math.min(c.x,d.x),r:Math.max(c.x,d.x),t:Math.min(c.y,d.y),b:Math.max(c.y,d.y)},pad=[0,3,9][i%3];
  assert.equal(segmentEntersRect(a,b,r,pad),previousClip(a,b,r,pad),'rectangle '+i);
 }
 // The old endpoint tolerance also admits hits infinitesimally beyond a tip.
 for(const offset of [-1e-10,0,1e-10,1e-9,2e-9]){
  const a={x:0,y:0},b={x:100,y:.005},c={x:100*(1+offset),y:-100},d={x:c.x,y:100};
  assert.deepEqual(segmentIntersection(a,b,c,d),previousIntersection(a,b,c,d));
 }
});
