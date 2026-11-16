import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseGraphFile,checkpointHasRecords} from '../js/io/GraphFile.js';
import {bindGraphFiles} from '../js/ui/GraphFiles.js';

const source=readFileSync(new URL('../js/data/examples/fractalear.json',import.meta.url),'utf8');
const example=parseGraphFile(source);

test('el ejemplo creado en la herramienta explica seis partes del programa y conserva sus tres estilos',()=>{
 assert.equal(example.nodes.length,200);assert.equal(example.edges.length,201);
 assert.equal(example.nodes.find(n=>n.id==='p1').text,'Fractalear · ideas que se vuelven relaciones');
 assert.deepEqual(example.nodes.filter(n=>n.parent==='p1').map(n=>n.text),[
  'Construir una idea','Leer el mismo fractal','Calcular con cuidado','Guardar con intención','Cuidar la lectura','Comprobar el resultado']);
 assert.deepEqual([...new Set(example.edges.map(e=>e.style))].sort(),['dashed','dotted','solid']);
 assert.equal(checkpointHasRecords(example.planeCheckpoint),true);
 assert.equal(example.planeCheckpoint.positions.length,200);
 assert.equal(example.planeCheckpoint.routes.length,201);
 // El ejemplo documenta piezas técnicas reales, además del uso básico.
 for(const text of ['GraphDocument consulta la jerarquía','WorkerTask descarta respuestas tardías',
  'LibraryService aplica las reglas','CircuitSvg dibuja las tres vistas',
  'GitHub Pages sirve el sitio estático'])assert.ok(example.nodes.some(n=>n.text===text),text);
 const byId=new Map(example.nodes.map(n=>[n.id,n]));
 for(const node of example.nodes)if(node.parent){
  assert.ok(byId.has(node.parent));
  assert.ok(example.edges.some(e=>e.from===node.parent&&e.to===node.id));
 }
 assert.equal(example.edges.filter(e=>e.style==='solid').length,199);
 assert.equal(example.planeCheckpoint.routes.filter(route=>route.points===null).length,0);
});

function controller(fetcher){
 const notices=[],imports=[],input=new EventTarget();input.value='';
 const files=bindGraphFiles({fileInput:input,loadButton:{},saveButton:{},snapshot:()=>example,
  onImport:data=>imports.push(data),toast:message=>notices.push(message),fetcher});
 return {files,notices,imports};
}

test('el ejemplo se lee bajo demanda, se valida y una cancelación no devuelve un documento tardío',async()=>{
 const requests=[];
 const {files,notices,imports}=controller((url,{signal})=>new Promise(resolve=>requests.push({url,signal,resolve})));
 assert.equal(requests.length,0);
 const first=files.readExample('example.json');files.cancel();
 assert.equal(requests[0].signal.aborted,true);
 requests[0].resolve({ok:true,text:async()=>source});assert.equal(await first,null);
 const current=files.readExample('example.json');requests[1].resolve({ok:true,text:async()=>source});
 assert.deepEqual(await current,example);assert.deepEqual(notices,[]);assert.deepEqual(imports,[]);
});

test('un ejemplo ilegible no se aplica y abrir otro JSON invalida una descarga pendiente',async()=>{
 const invalid=controller(async()=>({ok:true,text:async()=>'{}'}));
 assert.equal(await invalid.files.readExample('example.json'),null);
 assert.deepEqual(invalid.imports,[]);assert.match(invalid.notices[0],/No se pudo abrir el ejemplo/);
 let resolve;
 const pending=controller(()=>new Promise(done=>{resolve=done;}));
 const wait=pending.files.readExample('example.json');pending.files.openText(source);
 resolve({ok:true,text:async()=>source});assert.equal(await wait,null);
 assert.deepEqual(pending.imports,[example]);
});
