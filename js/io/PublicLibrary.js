export function validLibraryUrl(value){
 try{const url=new URL(value);return url.origin==='https://script.google.com'&&/^\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/.test(url.pathname)&&!url.search&&!url.hash;}
 catch{return false;}
}

// On-demand requests only. A readable receipt is mandatory for success.
export function createPublicLibrary({url,fetcher=fetch,timeoutMs=15000,
 pause=ms=>new Promise(resolve=>setTimeout(resolve,ms)),uuid=()=>crypto.randomUUID()}={}){
 if(!validLibraryUrl(url))throw Error('La biblioteca todavía no está configurada.');
 async function request(payload){
  let lastError;
  for(let attempt=0;attempt<3;attempt++){
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),timeoutMs);
   try{
    const response=await fetcher(url,{method:'POST',body:JSON.stringify(payload),
     headers:{'Content-Type':'text/plain;charset=UTF-8'},credentials:'omit',mode:'cors',redirect:'follow',signal:controller.signal});
    if(!response.ok)throw Error('La biblioteca no respondió correctamente.');
    const data=await response.json();
    if(data?.ok===true)return data;
    const error=new Error(data?.error?.message||'La biblioteca no confirmó la operación.');
    error.retryable=data?.error?.retryable===true;throw error;
   }catch(error){
    lastError=error;
    if(error.retryable===false||attempt===2)throw error;
   }finally{clearTimeout(timer);}
   await pause(500*2**attempt+Math.random()*250);
  }
  throw lastError;
 }
 return {
  save:({name,content,requestId=uuid()})=>request({action:'save',name,content,requestId}),
  list:cursor=>request({action:'list',...(cursor?{cursor}:{})}),
  read:id=>request({action:'read',id}),
  newRequestId:uuid
 };
}
