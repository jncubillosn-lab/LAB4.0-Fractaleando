import {ViewLayouts} from '../../js/geometry/ViewLayouts.js';
// Test-only transport fixture: the production worker computes the complete scene.
self.onmessage=({data})=>{
 try{self.postMessage({result:new ViewLayouts().compute(data)});}
 catch(error){self.postMessage({error:error.message||String(error)});}
};
