const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
const normal={top:[0,-1],right:[1,0],bottom:[0,1],left:[-1,0]};

export function portAt(side,x,y,rects,ownId,maxStub=19,clearance=9){
 const [nx,ny]=normal[side];let available=Infinity;
 for(const r of rects.values())if(r.id!==ownId){
  if(nx&&y>=r.t-clearance&&y<=r.b+clearance){const d=nx>0?r.l-clearance-x:x-r.r-clearance;if(d>=0)available=Math.min(available,d);}
  if(ny&&x>=r.l-clearance&&x<=r.r+clearance){const d=ny>0?r.t-clearance-y:y-r.b-clearance;if(d>=0)available=Math.min(available,d);}
 }
 const stub=Math.min(maxStub,available-1);
 if(stub<=clearance+.1)return null;
 return {side,x,y,sx:x+nx*stub,sy:y+ny*stub,stub};
}

// Ordered circular matching: each semantic edge keeps its place around its
// node. The cycle can rotate and change faces, as required by N1.1/N1.2.
export function assignOrderedPorts({nodes,edges,positions,rects,reference,spacing=11}){
 const requests=new Map(nodes.map(n=>[n.id,[]]));
 for(const [index,e] of edges.entries())for(const [id,other] of [[e.from,e.to],[e.to,e.from]])requests.get(id).push({index,edge:edgeKey(e),other});
 const result=new Map();
 for(const n of nodes){
  const r=rects.get(n.id),all=requests.get(n.id);
  const prior=new Map((reference?.ports?.[n.id]||[]).map((p,i)=>[p.edge,i]));
  const ordered=[...all].sort((a,b)=>(prior.get(a.edge)??Infinity)-(prior.get(b.edge)??Infinity)||
   Math.atan2(positions.get(a.other).y-r.y,positions.get(a.other).x-r.x)-Math.atan2(positions.get(b.other).y-r.y,positions.get(b.other).x-r.x)||a.index-b.index);
  const slots=[];
  for(const side of ['top','right','bottom','left']){
   const horizontal=side==='top'||side==='bottom',length=horizontal?r.w:r.h;
   const count=Math.max(1,Math.floor((length-16)/spacing)+1);
   for(let i=0;i<count;i++){
    const at=count===1?length/2:8+(length-16)*i/(count-1),offset=side==='bottom'||side==='left'?length-at:at;
    const x=horizontal?r.l+offset:side==='right'?r.r:r.l,y=horizontal?(side==='top'?r.t:r.b):r.t+offset;
    const p=portAt(side,x,y,rects,n.id);if(p)slots.push(p);
   }
  }
  const count=ordered.length,size=slots.length;if(!count||count>size)continue;
  const cost=(request,p)=>{
   const target=positions.get(request.other),dx=target.x-r.x,dy=target.y-r.y,[nx,ny]=normal[p.side];
   return Math.abs(p.sx-target.x)+Math.abs(p.sy-target.y)+Math.max(0,-nx*dx-ny*dy)*1.8;
  };
  let best=null;
  for(let start=0;start<size;start++){
   let previous=new Float64Array(size).fill(Infinity);previous[0]=cost(ordered[0],slots[start]);
   const history=[];
   for(let i=1;i<count;i++){
    const current=new Float64Array(size).fill(Infinity),parents=new Int16Array(size).fill(-1);
    let smallest=Infinity,at=-1;
    for(let j=1;j<size;j++){
     if(previous[j-1]<smallest){smallest=previous[j-1];at=j-1;}
     if(at>=0){current[j]=smallest+cost(ordered[i],slots[(start+j)%size]);parents[j]=at;}
    }
    history.push(parents);previous=current;
   }
   let end=0;for(let j=1;j<size;j++)if(previous[j]<previous[end])end=j;
   if(!best||previous[end]<best.cost){
    const chosen=new Array(count);let j=end;chosen[count-1]=slots[(start+j)%size];
    for(let i=count-1;i>0;i--){j=history[i-1][j];chosen[i-1]=slots[(start+j)%size];}
    best={cost:previous[end],chosen};
   }
  }
  for(let i=0;i<count;i++)result.set(ordered[i].index+':'+n.id,best.chosen[i]);
 }
 return result;
}
