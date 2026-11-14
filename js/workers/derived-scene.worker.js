import {computeDerivedScene} from '../geometry/DerivedScene.js';
self.onmessage=async({data})=>{
 try{self.postMessage({result:await computeDerivedScene(data,{onProgress:progress=>self.postMessage({progress})})});}
 catch(error){self.postMessage({error:error.message||String(error)});}
};
