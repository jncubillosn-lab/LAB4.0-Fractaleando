import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitNodeLabel,NODE_FONT_SIZE} from '../js/ui/NodeTypography.js';
import {SvgRenderer} from '../js/ui/SvgRenderer.js';
import {linkStyle,linkPattern,validLinkStyle} from '../js/ui/LinkStyles.js';
import {portInset} from '../js/geometry/PortPolicy.js';
import {portAt} from '../js/geometry/OrderedPorts.js';
import {drawCircuitSvg,emphasizeCrossings,visibleCrossings,scaleCrossings} from '../js/ui/CircuitSvg.js';

test('tipografía fija: crece el cuadro y se conservan contenido y márgenes',()=>{
 const measure=(text,size)=>[...text].length*size*.48;
 for(const text of ['Autopercepción','Optimización de recursos','Tecnologías rurales y capacidades locales','ÁÉÍÓÚ ñ ü','UnConceptoLargoSinEspaciosQueDebeConservarse']){
  const fitted=fitNodeLabel(text,{w:178,h:69},measure);
  assert.ok(fitted.fits,text);assert.equal(fitted.size,NODE_FONT_SIZE,text);assert.ok(fitted.h>=69);
  assert.deepEqual(fitted.wrapped.flatMap(line=>line.split(/\s+/)),text.split(/\s+/));
  assert.ok(fitted.wrapped.every(s=>measure(s,fitted.size)<=fitted.w-2*fitted.paddingX+.001));
 }
});

test('Intrascendencia y Especialización ensanchan la caja sin cortar letras ni reducir la fuente',()=>{
 const measure=(text,size)=>text.length*size*.48;
 for(const text of ['Intrascendencia','Especialización']){
  const current=fitNodeLabel(text,{w:170,h:53},measure);
  assert.deepEqual(current.wrapped,[text]);assert.ok(current.w>170);assert.equal(current.size,24);
  assert.ok(current.w-measure(text,24)>=28);
  const previous=fitNodeLabel(text,{w:170,h:53},measure,{growToWords:false});
  assert.equal(previous.w,170);assert.ok(previous.wrapped.length>1);
 }
});
test('un término largo aumenta la altura, nunca reduce el tamaño de letra',()=>{
 const measure=(text,size)=>text.length*size*.48;
 const short=fitNodeLabel('Uno',{w:178,h:53},measure),long=fitNodeLabel('Un término largo que debe mantenerse legible dentro del cuadro',{w:178,h:53},measure);
 assert.equal(short.size,24);assert.equal(long.size,24);assert.ok(long.h>short.h);
});
test('los estilos de línea son independientes de la semántica y tienen continua por defecto',()=>{
 assert.equal(linkStyle({}),'solid');assert.equal(linkPattern({}),null);
 assert.equal(linkPattern({style:'dotted'}),'0 5');assert.equal(linkPattern({style:'dashed'}),'7 5');
 assert.equal(linkStyle({kind:'transversal'}),'dashed');
 assert.equal(linkStyle({kind:'transversal',style:'solid'}),'solid');
 assert.equal(validLinkStyle('unexpected'),false);
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
 value.replaceChildren=(...children)=>{value.children=[...children];};
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
 assert.equal(cut.attrs['stroke-dasharray'],'7 5');assert.equal(Number(cut.attrs['stroke-width']),4.05);
 emphasizeCrossings(linesEl,new Set(['c|d']));assert.equal(Number(cut.attrs['stroke-width']),6.3);
 visibleCrossings(linesEl,new Set(['a|b']));assert.equal(cut.style.display,'none');
 visibleCrossings(linesEl,new Set(['a|b','c|d']));assert.equal(cut.style.display,'');
 emphasizeCrossings(linesEl,new Set());assert.equal(Number(cut.attrs['stroke-width']),4.05);
 scaleCrossings(linesEl,.125);assert.equal(Number(cut.attrs['stroke-width'])*.125,4.05);
 assert.equal(cut.attrs['stroke-dasharray'],'56 40');
 scaleCrossings(linesEl,2);assert.equal(Number(cut.attrs['stroke-width'])*2,4.05);
 assert.equal(cut.attrs['stroke-dasharray'],'3.5 2.5');
 assert.equal(JSON.stringify([...routes]),before);
});
test('01 usa las mismas máscaras que 02/04 y no dibuja puentes semicirculares',()=>{
 const edges=[{from:'a',to:'b'},{from:'c',to:'d',style:'dotted'}],key=e=>e.from+'|'+e.to;
 const routes=new Map([['a|b',{points:[{x:0,y:0},{x:100,y:0}]}],['c|d',{points:[{x:50,y:-50},{x:50,y:50}]}]]);
 const ids=new Set();
 for(const mode of ['01','02','04']){
  const linesEl=element('g'),renderer=new SvgRenderer({linesEl,sEl:element,edgeKey:key});
  const drawn=renderer.draw(edges,routes,{mode});
  const lower=drawn.get('a|b').children[0],upper=drawn.get('c|d').children[0],cut=linesEl.querySelectorAll()[0];
  assert.ok(lower.attrs.mask);assert.ok(!/[QC]/.test(lower.attrs.d));
  assert.equal(upper.attrs['stroke-dasharray'],'0 5');assert.equal(cut.attrs['stroke-dasharray'],'0 5');
  ids.add(lower.attrs.mask);
 }
 assert.equal(ids.size,3);
});
