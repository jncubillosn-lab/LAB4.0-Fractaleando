import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {performance} from 'node:perf_hooks';
import {ViewLayouts} from '../js/geometry/ViewLayouts.js';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';

const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
test('02 · diagnóstico de rutas después de ensamblar los bloques',()=>{
 const m=new Map(fixture.rects.map(([id,r])=>[id,{w:r.w,h:r.h}]));
 const layout=new ViewLayouts().compute({mode:'02',nodes:fixture.nodes,edges:fixture.edges,
  metrics:m,sourcePositions:new Map(fixture.positions)});
 const started=performance.now();
 const original=computeInitialRoutes(fixture);
 const result=computeInitialRoutes({...fixture,positions:[...layout.positions],
  rects:[...layout.rects],mode:'02',levels:layout.levels,
  sourcePositions:fixture.positions,sourceRoutes:original.routes});
 const byId=new Map(fixture.nodes.map(n=>[n.id,n]));
 const router=new PcbRouter({state:{nodes:fixture.nodes,edges:fixture.edges},mode:'02',
  nodeById:id=>byId.get(id),clamp:(x,a,b)=>Math.max(a,Math.min(b,x))});
 const v=new GeometryValidator({router,rectOverlap:(a,b,gap=0)=>
  a.l<b.r+gap&&a.r>b.l-gap&&a.t<b.b+gap&&a.b>b.t-gap});
 const audit=v.audit([...layout.rects.values()],result.routes.map(([,r])=>r));
 const pending=result.routes.filter(([,r])=>!r.points).map(([k])=>k);
 console.log('COMPACT_ROUTE_RESULT',JSON.stringify({stats:layout.stats,
  pending,valid:audit.invalid,boxes:audit.boxes,crosses:audit.crossings,
  durationsMs:Math.round(performance.now()-started),calculations:result.calculations,preserved:result.preserved}));
 assert.equal(pending.length,0,JSON.stringify(pending));
 assert.equal(audit.invalid,0);
});
