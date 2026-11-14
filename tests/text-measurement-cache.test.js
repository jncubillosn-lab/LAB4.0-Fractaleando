import {test} from 'node:test';
import assert from 'node:assert/strict';
import {nodeGeometry} from '../js/ui/NodeTypography.js';

function context(){
 return {calls:0,font:'',fontKerning:'normal',measureText(text){
  this.calls++;const weight=this.font.startsWith('700')?1.03:1,spacing=this.fontKerning==='none'?1.1:1;
  return {width:text.length*12*weight*spacing,actualBoundingBoxAscent:18,actualBoundingBoxDescent:5};
 }};
}
test('reutilizar medidas conserva geometría, ambos pesos y edición de contenido y ancho',()=>{
 const ctx=context(),node={id:'n1',width:178,text:'Capacidad técnica local'};
 const before=nodeGeometry(node,ctx),calls=ctx.calls;
 assert.deepEqual(nodeGeometry(node,ctx),before);assert.equal(ctx.calls,calls);
 node.text='Especialización';const edited=nodeGeometry(node,ctx);
 assert.deepEqual(edited.wrapped,['Especialización']);assert.ok(edited.w>178);assert.ok(ctx.calls>calls);
 node.width=300;assert.equal(nodeGeometry(node,ctx).w,300);
 const other=context();assert.deepEqual(nodeGeometry(node,other),nodeGeometry(node,ctx));assert.ok(other.calls>0);
 ctx.fontKerning='none';const changed=nodeGeometry(node,ctx);other.fontKerning='none';
 assert.deepEqual(changed,nodeGeometry(node,other));
});
test('la caché no retiene indefinidamente los textos de una sesión de edición larga',()=>{
 const ctx=context(),node={id:'n1',width:178,text:'Inicial'};
 nodeGeometry(node,ctx);
 for(let i=0;i<3000;i++)nodeGeometry({...node,text:'Palabra'+i},ctx);
 const calls=ctx.calls;nodeGeometry(node,ctx);assert.ok(ctx.calls>calls);
 const oversized={...node,text:'A'.repeat(600)};nodeGeometry(oversized,ctx);
 const after=ctx.calls;nodeGeometry(oversized,ctx);assert.ok(ctx.calls>after);
});
test('al terminar de cargar la fuente se descartan las medidas de respaldo',async()=>{
 const typography=await import('../js/ui/NodeTypography.js?font-ready-test');
 const ctx=context(),originalMeasure=ctx.measureText;let scale=1;
 ctx.measureText=function(text){const value=originalMeasure.call(this,text);return {...value,width:value.width*scale};};
 const node={id:'n1',width:178,text:'Especialización'},before=typography.nodeGeometry(node,ctx);
 const original={fetch:globalThis.fetch,FontFace:globalThis.FontFace,document:globalThis.document};
 try{
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1),text:async()=>'Font licence'});
  globalThis.FontFace=class {async load(){return this;}};
  globalThis.document={fonts:{add(){scale=1.2;}}};
  await typography.loadNodeTypography();
  assert.ok(typography.nodeGeometry(node,ctx).w>before.w);
 }finally{Object.assign(globalThis,original);}
});
