import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createLoadingIndicator} from '../js/ui/LoadingIndicator.js';

function harness(){
 const title={},detail={},attrs=new Map(),stageAttrs=new Map(),frames=[];
 const bar={setAttribute:(key,value)=>attrs.set(key,value)};
 const panel={hidden:false,querySelector:q=>q.includes('title')?title:q.includes('detail')?detail:bar};
 const loading=createLoadingIndicator({panel,stage:{setAttribute:(k,v)=>stageAttrs.set(k,v)},requestFrame:fn=>frames.push(fn)});
 return {loading,panel,title,detail,attrs,stageAttrs,frames};
}
test('finales y mensajes tardíos no ocultan la carga de otra operación',()=>{
 const h=harness(),initial=h.loading.begin('Inicio','Tipografía'),view=h.loading.begin('Compacto','Conexiones');
 initial.finish();initial.update('Mensaje obsoleto');
 assert.equal(h.panel.hidden,false);assert.equal(h.title.textContent,'Compacto');
 assert.equal(h.stageAttrs.get('aria-busy'),'true');
 view.update('Comprobando rutas');assert.equal(h.attrs.get('aria-valuetext'),'Comprobando rutas');
 assert.equal(h.attrs.has('aria-valuenow'),false);
 view.finish();view.finish();assert.equal(h.panel.hidden,true);assert.equal(h.stageAttrs.get('aria-busy'),'false');
});
test('la espera permite pintar la barra antes de ejecutar trabajo síncrono',async()=>{
 const h=harness(),boot=h.loading.begin('Inicio'),exporting=h.loading.begin('PNG');
 let ready=false;const painted=exporting.paint().then(()=>{ready=true;});
 assert.equal(h.frames.length,1);h.frames.shift()();await Promise.resolve();assert.equal(ready,false);
 h.frames.shift()();await painted;assert.equal(ready,true);
 exporting.finish();assert.equal(h.title.textContent,'Inicio');assert.equal(h.panel.hidden,false);
 boot.finish();assert.equal(h.panel.hidden,true);
});
