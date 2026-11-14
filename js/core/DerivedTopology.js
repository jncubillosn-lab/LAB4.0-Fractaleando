import {TopologyRegister} from './TopologyRegister.js';

// Every derived view is measured against 01. A saved derived checkpoint
// supplies geometry, never authority to replace the common reference.
export function checkDerivedTopology({reference,edgeKey,...geometry}){
 const topology=new TopologyRegister({edgeKey});
 const reject=(reason)=>{
  const report={valid:false,compared:false,issueCount:1,counts:{reference:1},issues:[{kind:'reference',reason}]};
  topology.report=report;
  return {topology,report};
 };
 if(!topology.restore(reference))return reject('missing-01-reference');
 if(reference.pending.length)return reject('incomplete-01-reference');
 const signature=topology.capture(geometry);
 const equalSets=(a,b)=>a.size===b.size&&[...a].every(key=>b.has(key));
 if(!equalSets(new Set(reference.edges),new Set(signature.edges))||
    !equalSets(new Set(reference.nodeOrders.x.flat()),new Set(geometry.positions.keys())))
  return reject('different-graph');
 const report=topology.compare(reference,signature);
 topology.latest=signature;topology.report=report;
 return {topology,signature,report};
}
