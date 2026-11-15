import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindDiagramExports} from '../js/ui/DiagramExport.js';

class Element {
 constructor(tag='g'){this.tag=tag;this.children=[];this.dataset={};this.style={removeProperty(){}};this.classList={remove(){}};}
 append(...nodes){this.children.push(...nodes);}
 cloneNode(){const copy=new Element(this.tag);copy.children=this.children.map(node=>node.cloneNode());return copy;}
 querySelectorAll(){return [];}
 removeAttribute(){}
}
function browserAdapters(){
 const names=['fetch','FontFace','Image','XMLSerializer','document','requestAnimationFrame'];
 const originals=Object.fromEntries(names.map(name=>[name,globalThis[name]]));
 const create=URL.createObjectURL,revoke=URL.revokeObjectURL,consoleError=console.error;
 const downloads=[],notices=[];let startImage;
 const imageStarted=new Promise(resolve=>{startImage=resolve;});
 globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1),text:async()=>'Font licence'});
 globalThis.FontFace=class{async load(){return this;}};
 globalThis.Image=class{set src(value){this.source=value;startImage(this);}};
 globalThis.XMLSerializer=class{serializeToString(node){return '<'+node.tag+'>'+node.children.map(n=>this.serializeToString(n)).join('')+'</'+node.tag+'>';}};
 globalThis.requestAnimationFrame=fn=>queueMicrotask(fn);
 globalThis.document={documentElement:{dataset:{theme:'light'}},fonts:{add(){}},body:{append(){}},createElement(tag){
  if(tag==='a')return{remove(){},click(){downloads.push(this.download);}};
  return{getContext:()=>({fillRect(){},drawImage(){}}),toBlob:fn=>fn(new Blob(['image'],{type:'image/png'}))};
 }};
 URL.createObjectURL=()=> 'blob:test';URL.revokeObjectURL=()=>{};console.error=()=>{};
 return{downloads,notices,imageStarted,restore(){Object.assign(globalThis,originals);URL.createObjectURL=create;URL.revokeObjectURL=revoke;console.error=consoleError;}};
}
function controls(adapters,ready){
 const nodes=[{id:'p1'}],state={nodes,edges:[],renderQueued:false};
 const plane={ready,rects:new Map([['p1',{l:-50,r:50,t:-25,b:25}]]),routes:new Map()};
 const derived={mode:'01',current:null,exportNotice:()=>''},pngButton={disabled:false},svgButton={};
 bindDiagramExports({svgButton,pngButton,plane,derived,state,stage:{clientWidth:800,clientHeight:600},
  camera:new Element(),linesEl:new Element(),nodesEl:new Element(),diag:{},toast:t=>adapters.notices.push(t),sEl:tag=>new Element(tag)});
 return{pngButton,svgButton,derived};
}
test('PNG y SVG no anuncian una imagen vacía mientras la escena está calculándose',async()=>{
 const adapters=browserAdapters();
 try{
  const buttons=controls(adapters,false);
  await buttons.pngButton.onclick();await buttons.svgButton.onclick();
  assert.equal(adapters.downloads.length,0);assert.equal(adapters.notices.length,2);
  assert.ok(adapters.notices.every(text=>text.includes('Espera')));
  assert.equal(buttons.pngButton.disabled,false);
 }finally{adapters.restore();}
});
test('cambiar de vista durante la codificación no cambia la identidad del PNG capturado',async()=>{
 const adapters=browserAdapters();
 try{
  const {pngButton,derived}=controls(adapters,true),job=pngButton.onclick();
  const image=await adapters.imageStarted;
  derived.mode='04';image.onload();await job;
  assert.equal(adapters.downloads.length,1);assert.match(adapters.downloads[0],/^fractalear-01-4k-/);
 }finally{adapters.restore();}
});
