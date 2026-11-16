import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {createLibraryService} from '../cloud/LibraryService.js';
import {createPublicLibrary,validLibraryUrl} from '../js/io/PublicLibrary.js';
import {bindGraphFiles} from '../js/ui/GraphFiles.js';

const source=readFileSync(new URL('./fixtures/word-wrap-0.2.10.json',import.meta.url),'utf8');
const folderId='fixed-folder',requestId='00000000-0000-4000-8000-000000000001';
const url='https://script.google.com/macros/s/deployment_for_test/exec';
function fixture(){
 const files=[],reads=[];
 const store={
  findRequest:id=>files.find(file=>file.appProperties.fractalearRequest===id),
  create:record=>{const file={...record,id:'file_'+(files.length+1),mimeType:'application/json',parents:[folderId],
   createdTime:'2026-11-16T00:00:00Z',size:String(Buffer.byteLength(record.content))};files.push(file);return file;},
  list:()=>({files,nextPageToken:'another-page'}),
  metadata:id=>files.find(file=>file.id===id),
  readText:id=>{reads.push(id);return files.find(file=>file.id===id).content;}
 };
 const service=createLibraryService({folderId,store,digest:text=>createHash('sha256').update(text).digest('hex'),withLock:fn=>fn()});
 return {files,reads,service};
}
test('la biblioteca conserva el texto JSON exacto, sus posiciones y sus sangrías',()=>{
 const {service,files}=fixture();
 const saved=service.dispatch({action:'save',name:'Mi fractal',content:source,requestId});
 assert.equal(saved.file.name,'Mi fractal.json');assert.equal(files[0].content,source);
 const loaded=service.dispatch({action:'read',id:saved.file.id});
 assert.deepEqual(Buffer.from(loaded.content),Buffer.from(source));
 assert.deepEqual(Object.keys(saved.file).sort(),['createdTime','id','name','size']);
});
test('reintentar no duplica y dos guardados con el mismo nombre crean copias independientes',()=>{
 const {service,files}=fixture(),save={action:'save',name:'Igual.json',content:source,requestId};
 const first=service.dispatch(save);assert.deepEqual(service.dispatch(save),first);assert.equal(files.length,1);
 service.dispatch({...save,requestId:'00000000-0000-4000-8000-000000000002'});assert.equal(files.length,2);
 assert.notEqual(files[0].id,files[1].id);assert.equal(files[0].name,files[1].name);
 assert.throws(()=>service.dispatch({...save,name:'Otro'}),error=>error.code==='REQUEST_CONFLICT');
});
test('la API rechaza carpetas elegidas, borrados, sobrescrituras y JSON inválido antes de escribir',()=>{
 const {service,files}=fixture(),save={action:'save',name:'Diagrama',content:source,requestId};
 for(const request of [{...save,folderId:'other'},{...save,content:'{}'},
  {...save,requestId:"' or trashed=false"},{action:'delete',id:'file_1'},{action:'update',id:'file_1'}])
  assert.throws(()=>service.dispatch(request),error=>error.code==='INVALID_REQUEST');
 assert.equal(files.length,0);
});
test('un identificador ajeno a la carpeta se rechaza antes de leer su contenido',()=>{
 const {service,files,reads}=fixture();
 files.push({id:'private_file',mimeType:'application/json',parents:['personal-folder'],content:'private'});
 assert.throws(()=>service.dispatch({action:'read',id:'private_file'}),error=>error.code==='NOT_FOUND');
 assert.deepEqual(reads,[]);
});
test('el listado devuelve solo metadatos públicos y conserva la paginación',()=>{
 const {service}=fixture();service.dispatch({action:'save',name:'Diagrama',content:source,requestId});
 const page=service.dispatch({action:'list'});assert.equal(page.nextCursor,'another-page');
 assert.equal(page.files.length,1);assert.equal(page.files[0].content,undefined);assert.equal(page.files[0].parents,undefined);
});
test('crear el cliente no hace peticiones y los reintentos conservan el mismo identificador',async()=>{
 const calls=[];let attempt=0;
 const client=createPublicLibrary({url,pause:async()=>{},uuid:()=>requestId,fetcher:async(_,options)=>{
  calls.push(JSON.parse(options.body));
  assert.equal(options.credentials,'omit');assert.equal(options.mode,'cors');
  if(attempt++===0)throw Error('network');
  return {ok:true,json:async()=>({ok:true,file:{id:'saved'}})};
 }});
 assert.equal(calls.length,0);
 await client.save({name:'Solo nombre',content:source});
 assert.equal(calls.length,2);assert.deepEqual(calls[0],calls[1]);assert.equal(calls[0].content,source);
 assert.equal(validLibraryUrl('https://attacker.example/exec'),false);
 assert.equal(validLibraryUrl(url+'?folder=other'),false);
});
test('una respuesta opaca no confirma un guardado y un rechazo definitivo no se reintenta',async()=>{
 let calls=0;
 const opaque=createPublicLibrary({url,pause:async()=>{},fetcher:async()=>({ok:false,type:'opaque'})});
 await assert.rejects(opaque.save({name:'Archivo',content:source,requestId}));
 const invalid=createPublicLibrary({url,pause:async()=>{},fetcher:async()=>{
  calls++;return {ok:true,json:async()=>({ok:false,error:{message:'Archivo inválido',retryable:false}})};
 }});
 await assert.rejects(invalid.save({name:'Archivo',content:source,requestId}),/Archivo inválido/);
 assert.equal(calls,1);
});
test('nube y descarga local usan la misma serialización y la apertura existente',()=>{
 const fileInput=new EventTarget(),loadButton={},saveButton={};let prepared=0,imported;
 const data=JSON.parse(source);
 const files=bindGraphFiles({fileInput,loadButton,saveButton,snapshot:()=>data,
  beforeSave:()=>prepared++,onImport:value=>{imported=value;},toast(){}});
 assert.equal(files.serialize(),JSON.stringify(data,null,2));assert.equal(prepared,1);
 files.openText(source);assert.deepEqual(imported,data);
 assert.throws(()=>files.openText('{}'));assert.deepEqual(imported,data);
});
