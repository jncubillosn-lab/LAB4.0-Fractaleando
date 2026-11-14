import {test} from 'node:test';
import assert from 'node:assert/strict';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {checkDerivedTopology} from '../js/core/DerivedTopology.js';
import {DerivedViews} from '../js/views/DerivedViews.js';
import {orderRoots} from '../js/core/RootOrder.js';

const edgeKey=e=>[e.from,e.to].sort().join('|');
function geometry(cross=false){
 const edges=[{from:'a',to:'b'},{from:'c',to:'d'}];
 const positions=new Map(['a','b','c','d'].map((id,i)=>[id,{x:i*100,y:i*50}]));
 const rects=new Map([...positions].map(([id,p])=>[id,{id,...p,w:60,h:50}]));
 const routes=new Map(edges.map((edge,i)=>{
  const points=i&&cross?[{x:50,y:-30},{x:50,y:30}]:[{x:0,y:i*20},{x:100,y:i*20}];
  return [edgeKey(edge),{edge,points,fromPort:{...points[0],side:'right'},toPort:{...points[1],side:'left'}}];
 }));
 return {positions,rects,routes,edges};
}
test('una vista no se autoaprueba sin referencia 01 ni cambia la referencia compartida',()=>{
 const input=geometry(),register=new TopologyRegister({edgeKey});
 const reference=register.capture(input),before=structuredClone(reference);
 const absent=checkDerivedTopology({edgeKey,...input});
 assert.equal(absent.report.valid,false);assert.equal(absent.topology.status().valid,false);
 const accepted=checkDerivedTopology({reference,edgeKey,...input});
 assert.equal(accepted.report.valid,true);assert.equal(accepted.report.compared,true);
 const rejected=checkDerivedTopology({reference,edgeKey,...geometry(true)});
 assert.equal(rejected.report.valid,false);assert.ok(rejected.report.counts.crossing>0);
 assert.deepEqual(reference,before);
});
test('una vista no aprueba si falta un vínculo, un concepto o una ruta de la referencia',()=>{
 const input=geometry(),reference=new TopologyRegister({edgeKey}).capture(input);
 const missing=geometry();missing.edges.pop();
 assert.equal(checkDerivedTopology({reference,edgeKey,...missing}).report.valid,false);
 const missingNode=geometry();missingNode.positions.delete('d');
 assert.equal(checkDerivedTopology({reference,edgeKey,...missingNode}).report.valid,false);
 const pending=structuredClone(reference);pending.pending.push(pending.edges[0]);
 assert.equal(checkDerivedTopology({reference:pending,edgeKey,...input}).report.valid,false);
});
test('la identidad de caché cambia si cambian rutas de 01 aunque no se muevan cajas',()=>{
 const register=new TopologyRegister({edgeKey});
 const reference=register.capture(geometry()),changed=register.capture(geometry(true));
 const key=value=>DerivedViews.prototype.referenceKey.call({referenceTopology:()=>value});
 assert.notEqual(key(reference),key(changed));
});
test('la exportación descarta caché de otra referencia y resultados inválidos',()=>{
 const view={graphKey:()=> 'graph',sourceKey:()=> 'positions',referenceKey:()=> 'reference',
  cache:new Map([['04',{valid:true,identity:'graphpositionsOLD'}]])};
 assert.deepEqual(DerivedViews.prototype.exportData.call(view),{});
 view.cache.set('04',{valid:false,identity:'graphpositionsreference'});
 assert.deepEqual(DerivedViews.prototype.exportData.call(view),{});
});
test('la imagen exportada identifica borradores, fallos y validación normativa pendiente',()=>{
 const notice=value=>DerivedViews.prototype.exportNotice.call(value);
 assert.equal(notice({mode:'01'}),'');
 assert.match(notice({mode:'02'}),/BORRADOR/);
 assert.match(notice({mode:'04',current:{valid:false,unfinished:2,report:{issueCount:705}}}),/2 rutas pendientes/);
 assert.match(notice({mode:'02',current:{valid:true}}),/validación normativa pendiente/);
});
test('las regiones de J1 parten del orden horario de 01, sin invertir ramas por su etiqueta',()=>{
 const roots=[{id:'a',branch:0},{id:'b',branch:1},{id:'c',branch:2}];
 const before=structuredClone(roots);
 const reference={ports:{p1:[{edge:'c|p1'},{edge:'b|p1'},{edge:'a|p1'}]}};
 assert.deepEqual(orderRoots(roots,reference).map(n=>n.id),['c','b','a']);
 assert.deepEqual(roots,before);
});
