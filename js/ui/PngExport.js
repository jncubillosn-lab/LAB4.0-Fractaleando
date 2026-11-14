// 4K longest side, keeping the graph's natural aspect ratio for readable type.
// Bounds come from the entire scene, independently of camera and depth filters.
export function pngExportPlan({rects,routes,notice=false}){
 const boxes=[...rects.values()],paths=[...routes.values()];
 if(!boxes.length)throw Error('No hay conceptos para exportar.');
 if(paths.some(r=>!r.points))throw Error('Hay conexiones pendientes de cálculo.');
 const points=paths.flatMap(r=>r.points),xs=[...boxes.flatMap(r=>[r.l,r.r]),...points.map(p=>p.x)],
  ys=[...boxes.flatMap(r=>[r.t,r.b]),...points.map(p=>p.y)];
 const bbox={x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};
 if(!Object.values(bbox).every(Number.isFinite)||bbox.width<=0||bbox.height<=0)throw Error('La geometría del grafo no es válida.');
 const margin=64,top=margin+(notice?40:0);
 const limit=4096,scale=Math.min((limit-2*margin)/bbox.width,(limit-top-margin)/bbox.height);
 const width=Math.min(limit,Math.ceil(bbox.width*scale+2*margin)),height=Math.min(limit,Math.ceil(bbox.height*scale+top+margin));
 return {width,height,scale,offsetX:margin-bbox.x*scale,offsetY:top-bbox.y*scale,bbox,nodes:boxes.length,edges:paths.length};
}

export function completeGraphClone({lines,nodes,sEl}){
 const graph=sEl('g');graph.append(lines.cloneNode(true),nodes.cloneNode(true));
 for(const layer of graph.children)layer.style.removeProperty('display');
 for(const el of graph.querySelectorAll('[data-node-id],[data-edge-key],[data-over-edge-key]')){
  el.style.removeProperty('display');el.classList.remove('hidden');
 }
 return graph;
}
