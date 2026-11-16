// This service must be deployed by the owner of the designated folder.
const LIBRARY_FOLDER_ID='1Hktgc57dZubg_Gul5Y1x-eDxuIPJZQqj';
const LIBRARY_FILE_FIELDS='id,name,createdTime,size,appProperties';

function libraryService_(){
 const query="'"+LIBRARY_FOLDER_ID+"' in parents and trashed = false";
 const store={
  findRequest(id){
   const page=Drive.Files.list({q:query+" and appProperties has { key='fractalearRequest' and value='"+id+"' }",
    fields:'files('+LIBRARY_FILE_FIELDS+')',pageSize:1});
   return page.files?.[0]||null;
  },
  create({name,content,appProperties}){
   const blob=Utilities.newBlob(content,'application/json',name);
   return Drive.Files.create({name,mimeType:'application/json',parents:[LIBRARY_FOLDER_ID],appProperties},blob,{fields:LIBRARY_FILE_FIELDS});
  },
  list(pageToken){
   return Drive.Files.list({q:query+" and mimeType = 'application/json'",pageSize:50,...(pageToken?{pageToken}:{}),
    orderBy:'createdTime desc',fields:'nextPageToken,files('+LIBRARY_FILE_FIELDS+')'});
  },
  metadata(id){return Drive.Files.get(id,{fields:LIBRARY_FILE_FIELDS+',parents,mimeType,trashed'});},
  readText(id){return DriveApp.getFileById(id).getBlob().getDataAsString('UTF-8');}
 };
 return createLibraryService({folderId:LIBRARY_FOLDER_ID,store,
  digest:text=>Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8)
   .map(value=>(value&255).toString(16).padStart(2,'0')).join(''),
  withLock:callback=>{
   const lock=LockService.getScriptLock();
   if(!lock.tryLock(1500))throw new LibraryError('BUSY','La biblioteca está ocupada. Reintentando…',true);
   try{return callback();}finally{lock.releaseLock();}
  }});
}

function doPost(event){
 let reply;
 try{
  const request=JSON.parse(event?.postData?.contents||'null');
  reply={ok:true,...libraryService_().dispatch(request)};
 }catch(error){
  const known=error instanceof LibraryError;
  reply={ok:false,error:{code:known?error.code:'UNAVAILABLE',
   message:known?error.message:'No se pudo contactar con la biblioteca. Tu diagrama sigue abierto.',
   retryable:known?error.retryable:true}};
 }
 return ContentService.createTextOutput(JSON.stringify(reply)).setMimeType(ContentService.MimeType.JSON);
}

function doGet(){
 return ContentService.createTextOutput(JSON.stringify({service:'fractalear-library',version:1}))
  .setMimeType(ContentService.MimeType.JSON);
}
