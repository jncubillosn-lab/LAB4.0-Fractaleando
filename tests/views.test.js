import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {ViewLayouts} from '../js/geometry/ViewLayouts.js';
import {RadialLayout} from '../js/geometry/RadialLayout.js';
const fixture=JSON.parse(readFileSync(new URL('./route-fixture.json',import.meta.url),'utf8'));
const args={nodes:fixture.nodes,edges:fixture.edges,
 metrics:new Map(fixture.rects.map(([id,r])=>[id,{w:r.w,h:r.h}])),sourcePositions:new Map(fixture.positions)};
const runner=new ViewLayouts();
function tree(depth=3,arms=3){
 const nodes=[{id:'p1',parent:null}],edges=[];let queue=['p1'];
 for(let d=0;d<depth;d++){
  const next=[];
  for(const id of queue)for(let j=0;j<(d===0?arms:2);j++){
   const n={id:id+'_'+j,parent:id,branch:d===0?j:nodes.find(n=>n.id===id).branch};
   nodes.push(n);edges.push({from:id,to:n.id});next.push(n.id);
  }
  queue=next;
 }
 return {nodes,edges,metrics:new Map(nodes.map(n=>[n.id,{w:140,h:56}])),
  sourcePositions:new Map(nodes.map((n,i)=>[n.id,{x:i*200,y:i*80}]))};
}
function audit(input,result){
 const sorted=[...input.nodes].sort((a,b)=>(input.sourcePositions.get(a.id)?.y??0)-(input.sourcePositions.get(b.id)?.y??0)||a.id.localeCompare(b.id));
 return RadialLayout.audit({nodes:sorted,edges:input.edges,positions:result.positions,metrics:input.metrics,
  sectors:new Map(Object.entries(result.stats.sectors)),owner:new Map(Object.entries(result.stats.owners)),baseHeight:result.stats.baseHeight});
}
test('02 radial: 46 nodos, mismos padres y vínculos, compactos y sin solapes',()=>{
 const input=tree(4),before=JSON.stringify([...input.nodes,...input.edges,[...input.sourcePositions]]);
 const result=runner.compute({mode:'02',...input});
 assert.equal(result.positions.size,46);assert.deepEqual(result.positions.get('p1'),{x:0,y:0});
 assert.equal(result.stats.geometricallySafe,true);
 assert.equal(result.stats.overlaps,0);
 assert.equal(result.stats.radialOrder,true);
 assert.equal(result.stats.constraintsValid,audit(input,result).valid);
 assert.equal(result.stats.baseHeight,56);assert.equal(result.stats.maxAllowedGap,112);
 assert.equal(result.stats.graphSignature,RadialLayout.signature(input.nodes,input.edges));
 assert.equal(JSON.stringify([...input.nodes,...input.edges,[...input.sourcePositions]]),before);
});
test('R01 radial: el número de sectores sigue los hijos reales de J0',()=>{
 for(const arms of [1,2,3,4]){
  const result=runner.compute({mode:'02',...tree(1,arms)});
  assert.equal(result.stats.arms,arms);assert.equal(result.stats.constraintsValid,true);
 }
});
test('02 conserva jerarquía de 01 incluso si un vínculo transversal acorta el camino',()=>{
 const input=tree(3);const last=input.nodes.at(-1);
 input.edges.push({from:'p1',to:last.id,kind:'transversal'});
 const result=runner.compute({mode:'02',...input});
 assert.equal(result.levels[last.id],3);
 assert.equal(result.stats.graphSignature,RadialLayout.signature(input.nodes,input.edges));
});
test('PPR completo no se declara válido si falla la cota o la geometría',()=>{
 const before=JSON.stringify(fixture),result=runner.compute({mode:'02',...args}),check=audit(args,result);
 assert.equal(result.positions.size,210);assert.equal(JSON.stringify(fixture),before);
 assert.equal(result.stats.maxAllowedGap,106);
 assert.equal(result.stats.constraintsValid,check.valid);
 // This is a regression for the unresolved acceptance case, not a success
 // criterion for PPR. The full PPR acceptance remains open in the docs.
 assert.equal(result.stats.constraintsValid,false);
 assert.ok(check.distanceViolations.length>0||check.overlaps>0);
});
test('auditor independiente detecta exceso de distancia y pérdidas de orden',()=>{
 const input=tree(2),result=runner.compute({mode:'02',...input});
 assert.equal(audit(input,result).valid,true);
 const id=input.nodes.at(-1).id,p=result.positions.get(id);
 result.positions.set(id,{x:p.x*20,y:p.y*20});
 assert.ok(audit(input,result).distanceViolations.length>0);
});
test('componentes desconectados y ciclos no se ocultan ni crean parentescos',()=>{
 const input=tree(1);input.nodes.push({id:'orphan',parent:null},{id:'cycleA',parent:'cycleB'},{id:'cycleB',parent:'cycleA'});
 input.nodes.forEach(n=>input.metrics.set(n.id,{w:140,h:56}));
 const result=runner.compute({mode:'02',...input});
 assert.equal(result.positions.size,input.nodes.length);assert.equal(result.stats.constraintsValid,false);
 assert.ok(result.stats.disconnected.includes('orphan'));
 assert.ok(result.stats.disconnected.includes('cycleA'));
});
test('medidas faltantes o extremos inexistentes se rechazan expresamente',()=>{
 const input=tree(1);input.metrics.delete('p1');
 assert.throws(()=>runner.compute({mode:'02',...input}),/Dimensiones/);
 input.metrics.set('p1',{w:140,h:56});input.edges.push({from:'p1',to:'missing'});
 assert.throws(()=>runner.compute({mode:'02',...input}),/inexistente/);
});
test('03 retirado y distribución determinista para 02 y 04',()=>{
 assert.deepEqual(ViewLayouts.MODES,['01','02','04']);
 assert.throws(()=>runner.compute({mode:'03',...args}),/no reconocida/);
 for(const mode of ['02','04']){
  const input=mode==='02'?tree(3):args;
  assert.deepEqual([...runner.compute({mode,...input}).positions],[...runner.compute({mode,...input}).positions]);
 }
});
test('04 gira la base 02 con crecimiento hacia fuera y brazos variables',()=>{
 const result=runner.compute({mode:'04',...args});
 assert.equal(result.positions.size,210);assert.equal(result.stats.arms,3);
 assert.equal(result.stats.T,0);assert.equal(result.stats.radialOrder,true);assert.equal(result.stats.overlaps,0);
 const four=runner.compute({mode:'04',...tree(1,4)});
 assert.equal(four.stats.arms,4);assert.equal(four.stats.overlaps,0);
});

test('auditor usa coordenadas calculadas y exige J0 en el centro',()=>{
 const input=tree(2),result=runner.compute({mode:'02',...input});
 // geometry() may carry x/y from 01; these must never replace the result.
 for(const [id,m] of input.metrics)input.metrics.set(id,{...m,x:99999,y:99999});
 assert.equal(audit(input,result).valid,true);
 result.positions.set('p1',{x:1,y:0});
 assert.equal(audit(input,result).centered,false);
 assert.equal(audit(input,result).valid,false);
});

test('worker de distribución devuelve Maps y el mismo resultado que el cálculo directo',async()=>{
 const {Worker}=await import('node:worker_threads');
 const url=new URL('../js/workers/radial-layout.worker.js',import.meta.url).href;
 const worker=new Worker(`const {parentPort}=require('node:worker_threads');global.self={postMessage:r=>parentPort.postMessage(r)};import(${JSON.stringify(url)}).then(()=>parentPort.on('message',data=>self.onmessage({data})));`,{eval:true});
 try{
  const input={mode:'02',...tree(3)};
  const response=await new Promise((resolve,reject)=>{worker.once('message',resolve);worker.once('error',reject);worker.postMessage(input);});
  assert.equal(response.error,undefined);
  assert.ok(response.result.positions instanceof Map);
  assert.deepEqual(response.result,runner.compute(input));
 }finally{await worker.terminate();}
});
