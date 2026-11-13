import {ViewLayouts} from '../geometry/ViewLayouts.js';
// Compute positions off the UI thread. Switching views terminates this worker.
self.onmessage=({data})=>{
 try{self.postMessage({result:new ViewLayouts().compute(data)});}
 catch(error){self.postMessage({error:error.message||String(error)});}
};
