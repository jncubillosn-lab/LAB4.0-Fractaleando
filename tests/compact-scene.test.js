import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {AvoidLib} from 'libavoid-js';
import {computeDerivedScene} from '../js/geometry/DerivedScene.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {ViewLayouts} from '../js/geometry/ViewLayouts.js';
import {RadialLayout} from '../js/geometry/RadialLayout.js';
import {checkDerivedTopology} from '../js/core/DerivedTopology.js';

test('PPR completo: rayos compactos, 217 rutas seguras y 04 derivada de la misma base',async()=>{
 const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url)));
 const topologyReference=JSON.parse(readFileSync(new URL('./ppr-topology-reference.json',import.meta.url)));
 const input={...fixture,topologyReference,metrics:new Map(fixture.rects.map(([id,r])=>[id,{w:r.w,h:r.h}])),sourcePositions:new Map(fixture.positions)};
 const original=JSON.stringify(fixture),reference=JSON.stringify(topologyReference);
 const sourceRects=new Map(fixture.rects);
 const originalMean=fixture.edges.reduce((s,e)=>s+RadialLayout.gap(sourceRects.get(e.from),sourceRects.get(e.to)),0)/217;
 await AvoidLib.load();const options={load:async()=>AvoidLib.getInstance()};
 const base=await computeDerivedScene({mode:'02',...input},options);
 console.log(JSON.stringify({stage:'base',pending:base.pending,passes:base.layout.stats.capacityPasses,core:base.layout.stats.coreSpacing}));
 assert.equal(base.layout.stats.coreSpacing.factor,.5);
 for(const link of base.layout.stats.coreSpacing.links){
  assert.equal(link.constrained,false,JSON.stringify(link));
  assert.ok(Math.abs(link.ratio-.5)<.001,JSON.stringify(link));
  assert.ok(link.actualGap>=base.layout.stats.coreSpacing.minimumGap);
 }
 const spiral=await computeDerivedScene({mode:'04',...input,baseScene:base},options);
 const checker=new PcbRouter({state:fixture,nodeById:id=>fixture.nodes.find(n=>n.id===id),mode:'02',clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const validator=new GeometryValidator({router:checker,rectOverlap:(a,b)=>ViewLayouts.overlap(a,b,0)});
 for(const scene of [base,spiral]){
  const {layout,result}=scene,routes=new Map(result.routes);
  const audit=validator.audit([...layout.rects.values()],[...routes.values()]);
  const report=checkDerivedTopology({reference:topologyReference,edgeKey:e=>[e.from,e.to].sort().map(encodeURIComponent).join('|'),positions:layout.positions,rects:layout.rects,routes,edges:fixture.edges}).report;
  console.log(JSON.stringify({mode:layout.mode,meanGap:layout.stats.meanGap,passes:layout.stats.capacityPasses,pending:scene.pending,topology:report.counts,circuit:layout.stats.circuit,routing:layout.stats.routing}));
  assert.equal(layout.positions.size,210);assert.equal(routes.size,217);assert.equal(scene.pending,0);
  assert.equal(audit.drawn,217);assert.equal(audit.boxes+audit.invalid+audit.portsRepeated,0,JSON.stringify(audit.details));
  assert.deepEqual(layout.positions.get('p1'),{x:0,y:0});assert.equal(layout.stats.radialOrder,true);
  assert.ok(layout.stats.meanGap<originalMean*.70);
  assert.ok(layout.stats.bounds.width/layout.stats.bounds.height<2.5&&layout.stats.bounds.height/layout.stats.bounds.width<2.5);
  assert.equal(report.compared,true);assert.equal(report.counts.portOrder,0);
  // Existing crossing pairs/order and 2H remain independently measured;
  // neither is waived to label this packed preview as normatively approved.
  assert.equal(layout.stats.maxAllowedGap,106);
  assert.ok(layout.stats.circuit.beveledCorners>0);
  assert.ok(layout.stats.circuit.savedLength>0);
  assert.ok(layout.stats.routing.straight>0);
 }
 assert.deepEqual(spiral.layout.stats.baseBounds,base.layout.stats.bounds);
 assert.equal(spiral.layout.stats.baseMeanGap,base.layout.stats.meanGap);
 assert.ok(spiral.layout.stats.W>0);assert.equal(spiral.layout.stats.T,0);
 const moved=[...base.layout.positions].filter(([id,p])=>Math.hypot(p.x-spiral.layout.positions.get(id).x,p.y-spiral.layout.positions.get(id).y)>1);
 assert.ok(moved.length>190);
 const radii=new Set([...base.layout.positions.values()].map(p=>Math.round(Math.hypot(p.x,p.y))));
 assert.ok(radii.size>150,'Los radios no deben limitarse a un anillo por generación.');
 assert.equal(JSON.stringify(fixture),original);assert.equal(JSON.stringify(topologyReference),reference);
});
