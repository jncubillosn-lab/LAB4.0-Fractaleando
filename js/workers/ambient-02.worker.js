import {computeCertified02} from '../geometry/CertifiedCompact02.js';

// Solo entradas serializables; 02 no invoca computeInitialRoutes.
// La tarea puede cancelarse cuando se abandona la vista.
if(typeof WorkerGlobalScope!=='undefined'&&self instanceof WorkerGlobalScope){
 self.addEventListener('message',event=>{
  const token=event.data?.token;
  try{
   const result=computeCertified02(event.data);
   self.postMessage({token,result});
  }catch(error){
   self.postMessage({token,error:String(error?.stack||error)});
  }
 });
}
export {computeCertified02};
