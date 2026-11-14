import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitNodeLabel} from '../js/ui/NodeTypography.js';
import {portInset} from '../js/geometry/PortPolicy.js';
import {portAt} from '../js/geometry/OrderedPorts.js';
import {drawCircuitSvg,emphasizeCrossings,visibleCrossings,scaleCrossings} from '../js/ui/CircuitSvg.js';

test('tipografía más grande con ajuste real al contenido y márgenes reservados',()=>{
 const measure=(text,size)=>[...text].length*size*.48;
 for(const text of ['Autopercepción','Optimización de recursos','Tecnologías rurales y capacidades locales','ÁÉÍÓÚ ñ ü','UnConceptoLargoSinEspaciosQueDebeConservarse']){
  const fitted=fitNodeLabel(text,{w:178,h:69},measure);
  assert.ok(fitted.fits,text);assert.ok(fitted.size>14&&fitted.size<=24,text);
  assert.equal(fitted.wrapped.join('').replaceAll(' ',''),text.replaceAll(' ',''));
  assert.ok(fitted.wrapped.every(s=>measure(s,fitted.size)<=150.001));
 }
});
test('los puertos evitan los extremos de las caras y mantienen libre el redondeo',()=>{
 const r={id:'a',x:0,y:0,w:190,h:69,l:-95,r:95,t:-34.5,b:34.5},rects=new Map([['a',r]]);
 assert.equal(portInset(r,'top'),36);assert.equal(portInset(r,'left'),18);
 assert.equal(portAt('left',r.l,r.b-8,rects,'a'),null);
 assert.equal(portAt('top',r.l+8,r.t,rects,'a'),null);
 assert.ok(portAt('left',r.l,0,rects,'a'));
});

function element(tag,attrs={}){
 const value={tag,attrs:{...attrs},children:[],style:{},dataset:{},handlers:{},classList:{contains:()=>false}};
 value.setAttribute=(key,v)=>{value.attrs[key]=String(v);if(key.startsWith('data-'))value.dataset[key.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=String(v);};
 for(const [key,v] of Object.entries(attrs))value.setAttribute(key,v);
 value.append=(...children)=>value.children.push(...children);
 value.addEventListener=(name,callback)=>{value.handlers[name]=callback;};
 value.querySelectorAll=()=>value.children.flatMap(c=>[...(c.attrs['data-over-edge-key']?[c]:[]),...c.querySelectorAll()]);
 return value;
}
test('el cruce copia el trazo superior y sus guiones; selección y filtros no abren huecos huérfanos',()=>{
 const linesEl=element('g'),edges=[{from:'a',to:'b'},{from:'c',to:'d',kind:'transversal'}];
 const key=e=>[e.from,e.to].sort().join('|');
 const routes=new Map([[key(edges[0]),{points:[{x:0,y:0},{x:100,y:0}]}],[key(edges[1]),{points:[{x:50,y:-50},{x:50,y:50}]}]]);
 const before=JSON.stringify([...routes]);
 const elements=drawCircuitSvg({ordered:edges,routes,linesEl,sEl:element,edgeKey:key,mode:'04'});
 const cut=linesEl.querySelectorAll()[0],upper=elements.get('c|d').children[0];
 assert.equal(cut.attrs.d,upper.attrs.d);
 assert.equal(cut.attrs['stroke-dasharray'],'5 5');assert.equal(Number(cut.attrs['stroke-width']),4.05);
 emphasizeCrossings(linesEl,new Set(['c|d']));assert.equal(Number(cut.attrs['stroke-width']),6.3);
 visibleCrossings(linesEl,new Set(['a|b']));assert.equal(cut.style.display,'none');
 visibleCrossings(linesEl,new Set(['a|b','c|d']));assert.equal(cut.style.display,'');
 emphasizeCrossings(linesEl,new Set());assert.equal(Number(cut.attrs['stroke-width']),4.05);
 scaleCrossings(linesEl,.125);assert.equal(Number(cut.attrs['stroke-width'])*.125,4.05);
 assert.equal(cut.attrs['stroke-dasharray'],'40 40');
 scaleCrossings(linesEl,2);assert.equal(Number(cut.attrs['stroke-width'])*2,4.05);
 assert.equal(cut.attrs['stroke-dasharray'],'2.5 2.5');
 assert.equal(JSON.stringify([...routes]),before);
});
