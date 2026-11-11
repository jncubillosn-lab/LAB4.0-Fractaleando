import {computeCompact02} from '../geometry/TopologicalCompact.js';

// 02 no invoca el enrutador de generación: transforma la totalidad de rutas
// validadas de 01 mediante la misma isotopía. Sin rutas reconstruidas a ciegas.
export {computeCompact02};
if(typeof WorkerGlobalScope!=='undefined'&&self instanceof WorkerGlobalScope){
 self.addEventListener('message',event=>{
  try{
   const result=computeCompact02(event.data);
   self.postMessage({token:event.data.token,result});
  }catch(error){
   self.postMessage({token:event.data.token,error:String(error?.stack||error)});
  }
 });
}
