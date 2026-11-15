import {test} from 'node:test';
import assert from 'node:assert/strict';
import {bindPoetryCarousel} from '../js/ui/PoetryCarousel.js';
import {poetryQuotes} from '../js/data/PoetryQuotes.js';

class Element extends EventTarget{
 constructor(){super();this.attrs=new Map();}
 setAttribute(k,v){this.attrs.set(k,v);}
}
test('el carrusel conserva fuentes y traducciones y descansa durante lectura, pausa y pestaña oculta',()=>{
 assert.equal(poetryQuotes.length,17);assert.equal(new Set(poetryQuotes.map(q=>q.author)).size,17);
 for(const q of poetryQuotes){assert.match(q.source,/^https:\/\//);assert.ok(q.original.split(/\s+/).length<=25);if(q.lang!=='es')assert.ok(q.translation);}
 const root=new Element(),doc=new Element(),motion=new Element(),elements=new Map(),timers=new Map();let serial=0;
 root.ownerDocument=doc;root.contains=el=>[...elements.values()].includes(el);
 root.querySelector=key=>{if(!elements.has(key))elements.set(key,new Element());return elements.get(key);};
 doc.defaultView={matchMedia:()=>motion};motion.matches=false;doc.hidden=false;
 const carousel=bindPoetryCarousel(root,{setTimer:fn=>{timers.set(++serial,fn);return serial;},clearTimer:id=>timers.delete(id)});
 const count=elements.get('[data-poem-count]');assert.equal(count.textContent,'1 / 17');assert.equal(timers.size,1);
 const advance=[...timers.values()][0];timers.clear();advance();assert.equal(count.textContent,'2 / 17');assert.equal(timers.size,1);
 root.dispatchEvent(new Event('mouseenter'));assert.equal(timers.size,0);
 root.dispatchEvent(new Event('mouseleave'));assert.equal(timers.size,1);
 elements.get('[data-poem-pause]').dispatchEvent(new Event('click'));assert.equal(timers.size,0);
 elements.get('[data-poem-next]').dispatchEvent(new Event('click'));assert.equal(count.textContent,'3 / 17');assert.equal(timers.size,0);
 elements.get('[data-poem-pause]').dispatchEvent(new Event('click'));assert.equal(timers.size,1);
 doc.hidden=true;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(timers.size,0);
 doc.hidden=false;doc.dispatchEvent(new Event('visibilitychange'));assert.equal(timers.size,1);
 const reduced=new Event('change');reduced.matches=true;motion.dispatchEvent(reduced);assert.equal(timers.size,0);
 carousel.dispose();elements.get('[data-poem-pause]').dispatchEvent(new Event('click'));assert.equal(timers.size,0);
});
