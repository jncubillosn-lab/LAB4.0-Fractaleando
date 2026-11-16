/**
 * Traduce una selección en conceptos y vínculos que deben resaltarse.
 * La ascendencia se sigue por parent; la adyacencia incluye vínculos libres.
 * Así un enlace transversal se ilumina sin convertirlo en un padre inventado.
 */
// Selection follows actual ancestry, never a shortcut through a transversal.
export function hierarchySelection({nodes,edges,selectedId,levels={}}){
 const byId=new Map(nodes.map(n=>[n.id,n])),nodeIds=new Set(),edgeKeys=new Set();
 const key=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
 const existing=new Map(edges.map(e=>[key(e),e]));
 let at=byId.get(selectedId);
 while(at&&!nodeIds.has(at.id)){
  nodeIds.add(at.id);
  const parent=byId.get(at.parent),link=parent&&key({from:at.id,to:parent.id});
  if(!parent||!existing.has(link))break;
  edgeKeys.add(link);at=parent;
 }
 if(byId.has(selectedId))for(const e of edges){
  const other=e.from===selectedId?e.to:e.to===selectedId?e.from:null;
  // Cross-links are direct neighbours too; they never substitute for ancestry.
  if(other&&byId.has(other)){
   nodeIds.add(other);edgeKeys.add(key(e));
  }
 }
 return {nodeIds,edgeKeys};
}
