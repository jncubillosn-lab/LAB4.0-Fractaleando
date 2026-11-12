import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';
import {ViewLayouts} from '../js/geometry/ViewLayouts.js';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {createFanOutWarp} from '../js/geometry/FanOutWarp.js';
import {createLayerWarp} from '../js/geometry/LayerBandWarp.js';
import {auditFanOut} from '../js/geometry/FanOutAudit.js';
import {analyzeRadialHierarchy} from '../js/geometry/RadialHierarchy.js';

const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
const nodes=fixture.nodes,edges=fixture.edges,positions=new Map(fixture.positions),
 rects=new Map(fixture.rects),edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
const build=computeInitialRoutes(fixture),routes=new Map(build.routes);
const levels=Object.fromEntries(ViewLayouts.graphLevels(nodes,edges).levels);
const ordered=edges.map((e,i)=>({...e,__index:i})).sort((a,b)=>{
 const score=x=>Math.min(levels[x.from]??1000,levels[x.to]??1000)*10+
  (x.kind==='transversal'?5:0)+
  (Math.abs((levels[x.from]??1000)-(levels[x.to]??1000))>1?2:0);
 return score(a)-score(b)||a.__index-b.__index;
});
const original=new TopologyRegister({edgeKey}).capture({positions,rects,routes,edges:ordered});
const length=r=>[...r.values()].reduce((total,x)=>total+x.points.slice(1)
 .reduce((s,p,i)=>s+Math.hypot(p.x-x.points[i].x,p.y-x.points[i].y),0),0);
const fan=createFanOutWarp({nodes,positions,rects,routes});

test('EXP-02-B: acerca los J1 sin desplazar a sus descendientes por interpolación ficticia',()=>{
 assert.equal(fan.valid,true,fan.reason);
 const root=fan.ps.get('p1');
 assert.equal(fan.rootRadii.length,3);
 assert.ok(fan.rootRadii.every(x=>x.next<=371));
 assert.ok(fan.rootRadii.every(x=>x.next<=x.old));
 assert.ok(fan.rootRadii.some(x=>x.old-x.next>1000));
 assert.deepEqual(fan.ps.get('b11'),positions.get('b11'));
 assert.deepEqual(fan.ps.get('f111'),positions.get('f111'));
 assert.deepEqual(fan.ps.get('t1111'),positions.get('t1111'));
 assert.equal(fan.rs.size,217);
});

test('EXP-02-B: TODAS las conexiones conservan 71 cruces idénticos en el abanico',()=>{
 const audit=auditFanOut({rects:fan.rr,routes:fan.rs,ordered,reference:original,edgeKey});
 assert.equal(audit.valid,true,JSON.stringify(audit.details));
 assert.equal(audit.drawn,217);
 assert.equal(audit.crossings,71);
 assert.equal(audit.topologicalDifferences,0);
 assert.equal(audit.boxes,0);
 assert.equal(audit.invalid,0);
});

test('EXP-02-B: el radio máximo de J1 es estrictamente menor al mínimo de J2',()=>{
 const r=analyzeRadialHierarchy({nodes,positions:fan.ps});
 assert.ok(r.summary[1].max<r.summary[2].min);
 assert.equal(r.summary[1].count,3);
 // No sobreinterpretar el progreso: la reorganización completa sigue pendiente.
 assert.equal(r.valid,false,'no publicar 02 antes de ordenar J2–J5');
});

test('EXP-02-C: se ensaya reordenar todas las bandas, sin aprobar rutas inválidas',()=>{
 const r=createLayerWarp({nodes,positions:fan.ps,rects:fan.rr,routes:fan.rs});
 assert.equal(r.valid,true,r.reason);
 const radial=analyzeRadialHierarchy({nodes,positions:r.ps});
 assert.equal(radial.valid,true,JSON.stringify(radial.violations));
 assert.equal(radial.summary.length,6);
 const audit=auditFanOut({rects:r.rr,routes:r.rs,ordered,reference:original,edgeKey});
 assert.equal(audit.crossings,71,'sin pérdida de cruces');
 assert.equal(audit.topologicalDifferences,0,'sin cambios de pares/secuencia');
 // Los corredores y longitudes requieren trabajo adicional: NO promulgar.
 assert.equal(audit.valid,false,'no se considera vista publicable sin DRC');
 assert.ok(length(r.rs)>length(routes),'la banda no es todavía compacta');
});
