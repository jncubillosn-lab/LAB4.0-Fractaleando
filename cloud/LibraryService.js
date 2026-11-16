import {parseGraphFile} from '../js/io/GraphFile.js';

const MIME='application/json';
export class LibraryError extends Error {
 constructor(code,message,retryable=false){super(message);this.code=code;this.retryable=retryable;}
}
const reject=(message)=>{throw new LibraryError('INVALID_REQUEST',message);};
const publicFile=file=>({id:file.id,name:file.name,createdTime:file.createdTime,size:file.size});

// The adapter owns one fixed folder. Client input never selects a Drive path.
export function createLibraryService({folderId,store,digest,withLock}){
 function check(request,fields){
  if(!request||typeof request!=='object'||Array.isArray(request)||
   Object.keys(request).some(key=>!fields.includes(key)))reject('Solicitud de biblioteca no válida.');
 }
 function validate(text){
  if(typeof text!=='string')reject('El diagrama debe ser un archivo JSON.');
  try{parseGraphFile(text);}catch{reject('El archivo no es un diagrama válido de Fractalear.');}
 }
 function save(request){
  check(request,['action','name','content','requestId']);
  if(typeof request.name!=='string'||!request.name.trim()||/[\u0000-\u001f]/.test(request.name))reject('Escribe un nombre para el archivo.');
  if(typeof request.requestId!=='string'||!/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(request.requestId))reject('Identificador de guardado no válido.');
  validate(request.content);
  const name=request.name.trim().replace(/\.json$/i,'')+'.json';
  const fingerprint=digest(name+'\0'+request.content);
  return withLock(()=>{
   const previous=store.findRequest(request.requestId);
   if(previous){
    if(previous.appProperties?.contentDigest!==fingerprint)
     throw new LibraryError('REQUEST_CONFLICT','Este intento de guardado ya corresponde a otro contenido.');
    return {file:publicFile(previous)};
   }
   // Preserve the exact text: validation never reserializes the document.
   return {file:publicFile(store.create({name,content:request.content,
    appProperties:{fractalearRequest:request.requestId,contentDigest:fingerprint}}))};
  });
 }
 function list(request){
  check(request,['action','cursor']);
  if(request.cursor!==undefined&&(typeof request.cursor!=='string'||request.cursor.length>4096))reject('Página de biblioteca no válida.');
  const page=store.list(request.cursor||undefined);
  return {files:(page.files||[]).map(publicFile),nextCursor:page.nextPageToken||null};
 }
 function read(request){
  check(request,['action','id']);
  if(typeof request.id!=='string'||!/^[a-zA-Z0-9_-]+$/.test(request.id))reject('Archivo no válido.');
  const file=store.metadata(request.id);
  // Check membership before reading bytes, even if the owner can access more.
  if(file.trashed||file.mimeType!==MIME||!file.parents?.includes(folderId))
   throw new LibraryError('NOT_FOUND','El archivo no pertenece a esta biblioteca.');
  const content=store.readText(request.id);validate(content);
  return {file:publicFile(file),content};
 }
 return {dispatch(request){
  if(request?.action==='save')return save(request);
  if(request?.action==='list')return list(request);
  if(request?.action==='read')return read(request);
  reject('La biblioteca solo permite guardar, consultar y abrir.');
 }};
}
