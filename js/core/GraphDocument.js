// J0/Jn domain, independent from SVG and routing.
export class GraphDocument {
 constructor(state){this.state=state;}
 nodeById(id){return this.state.nodes.find(n=>n.id===id);}
 linksOf(id){return this.state.edges.filter(e=>e.from===id||e.to===id);}
 treeChildren(id,branch){return this.state.nodes.filter(n=>n.parent===id&&(branch===undefined||n.branch===branch));}
 depthMap(){
  const nodes=new Map(this.state.nodes.map(n=>[n.id,n])),levels={},visiting=new Set();
  const depth=id=>{
   if(Object.hasOwn(levels,id))return levels[id];
   if(visiting.has(id))return Infinity;
   const n=nodes.get(id);if(!n)return Infinity;
   visiting.add(id);const value=id==='p1'?0:!n.parent?2:depth(n.parent)+1;
   visiting.delete(id);levels[id]=value;return value;
  };
  for(const n of this.state.nodes)depth(n.id);
  return levels;
 }
 // A disconnected component is still data. Its descendants must remain visible
 // under 'Todas las capas', without inventing a new parent or a new edge (H03).
 readDepthMap(){
  const root=this.nodeById(this.state.focusRoot)?this.state.focusRoot:'p1';
  const d={[root]:0},stack=[root];
  const visit=()=>{
   for(let i=0;i<stack.length;i++){
    const id=stack[i];for(const child of this.treeChildren(id))if(d[child.id]===undefined){d[child.id]=d[id]+1;stack.push(child.id);}
   }
  };
  visit();
  if(root==='p1'){
   for(const n of this.state.nodes){
    if(n.id!=='p1'&&d[n.id]===undefined&&(!n.parent||!this.nodeById(n.parent))){d[n.id]=2;stack.push(n.id);}
   }
   visit();
   // Defensive handling of orphan cycles in legacy graphs; never invent edges.
   for(const n of this.state.nodes)if(d[n.id]===undefined){d[n.id]=2;stack.push(n.id);visit();}
  }
  return d;
 }
 maximumDepth(){const d=this.readDepthMap();return Math.max(0,...this.state.nodes.map(n=>Number.isFinite(d[n.id])?d[n.id]:0));}
 rawVisibleNodes(){const levels=this.readDepthMap();return this.state.nodes.filter(n=>Number.isFinite(levels[n.id])&&levels[n.id]<=this.state.depth);}
 currentNodes(){this.state.contextActive=false;return this.rawVisibleNodes();}
}
