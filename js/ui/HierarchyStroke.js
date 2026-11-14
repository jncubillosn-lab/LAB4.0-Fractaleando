// Stable across depth filters: derive the scale from the complete hierarchy.
// A single-level graph keeps the existing minimum; extra depth never adds
// unbounded thickness. Transversals do not acquire a false parent hierarchy.
export function hierarchyStrokeProfile({mode,nodes=[],levels={}}){
 const minimum=1.35,maximum=2.05;
 const byId=new Map(nodes.map(n=>[n.id,n]));
 const maxDepth=Math.max(0,...Object.values(levels).filter(Number.isFinite));
 return edge=>{
  const depth=Math.max(levels[edge.from]??0,levels[edge.to]??0);
  const tree=edge.kind!=='transversal'&&(byId.get(edge.to)?.parent===edge.from||byId.get(edge.from)?.parent===edge.to);
  const weight=tree&&maxDepth>1?Math.max(0,Math.min(1,(maxDepth-depth)/(maxDepth-1))):0;
  return {depth,width:Number((minimum+(maximum-minimum)*weight).toFixed(3))};
 };
}
