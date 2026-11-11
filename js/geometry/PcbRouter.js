// Routing of individual semantic links on a single 2D plane.
// The class is instantiated for the active document; its algorithms are
// extracted from the last approved R01 implementation, not a retired engine.
export class PcbRouter {
 constructor({state,nodeById,clamp,mode='01'}){
  const ROUTE_CLEAR=9, ROUTE_SEPARATION=6, PORT_STUB=19;
  function prefSide(node,other,edge){
   if(mode==='03'||mode==='04'){
    const dx=other.x-node.x,dy=other.y-node.y;
    return Math.abs(dx)>Math.abs(dy)*.72?
     (dx>0?'right':'left'):(dy>0?'bottom':'top');
   }
   if(edge.kind==='transversal')return other.y>node.y?'bottom':'top';
   if((node.id==='p1'&&other.parent==='p1'))return 'bottom';
   if((other.id==='p1'&&node.parent==='p1'))return 'top';
   if(other.parent===node.id)return node.parent==='p1'?'bottom':'right';
   if(node.parent===other.id)return 'left';
   const dx=other.x-node.x,dy=other.y-node.y;
   return Math.abs(dx)>Math.abs(dy)*.72?(dx>0?'right':'left'):(dy>0?'bottom':'top');
  }
  function assignPorts(edges,positions,rects){
   const requests=new Map();
   for(const [idx,e] of edges.entries()){
    for(const [id,other] of [[e.from,e.to],[e.to,e.from]]){
     const p=positions.get(id),q=positions.get(other);if(!p||!q)continue;
     if(!requests.has(id))requests.set(id,[]);
     requests.get(id).push({idx,other,prefer:prefSide({id,...p,parent:nodeById(id)?.parent},{id:other,...q,parent:nodeById(other)?.parent},e),target:q});
    }
   }
   const ports=new Map();
   for(const [id,list] of requests){
    const r=rects.get(id),sides={top:[],right:[],bottom:[],left:[]};
    const cap={top:Math.max(2,Math.floor((r.w-12)/10)),bottom:Math.max(2,Math.floor((r.w-12)/10)),right:Math.max(2,Math.floor((r.h-12)/10)),left:Math.max(2,Math.floor((r.h-12)/10))};
    // Por preferencia espacial, los puertos propios son distintos aun en una misma caja.
    for(const entry of list){
     const dx=entry.target.x-r.x,dy=entry.target.y-r.y;
     const alternatives=[entry.prefer,dx>=0?'right':'left',dy>=0?'bottom':'top',dx>=0?'left':'right',dy>=0?'top':'bottom'];
     let side=alternatives.find(x=>sides[x].length<cap[x]);
     if(!side)side=Object.keys(sides).sort((a,b)=>sides[a].length/cap[a]-sides[b].length/cap[b])[0];
     sides[side].push(entry);
    }
    for(const [side,group] of Object.entries(sides)){
     group.sort((a,b)=>(side==='top'||side==='bottom'?Math.abs(b.target.y-r.y)-Math.abs(a.target.y-r.y):a.target.y-b.target.y)||a.idx-b.idx);
     const length=(side==='top'||side==='bottom'?r.w:r.h);
     for(let k=0;k<group.length;k++){
      const fraction=(k+1)/(group.length+1);
      const offset=clamp((fraction-.5)*length,-length/2+8,length/2-8);
      const p={side};
      if(side==='top'||side==='bottom'){
       p.x=r.x+offset;p.y=side==='top'?r.t:r.b;
       p.sx=p.x;p.sy=p.y+(side==='top'?-PORT_STUB:PORT_STUB);
      }else{
       p.x=side==='left'?r.l:r.r;p.y=r.y+offset;
       p.sx=p.x+(side==='left'?-PORT_STUB:PORT_STUB);p.sy=p.y;
      }
      ports.set(group[k].idx+':'+id,p);
     }
    }
   }
   return ports;
  }
  function allSegments(points){const segments=[];for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<.01)continue;segments.push({a,b,h:Math.abs(a.y-b.y)<.01});}return segments;}
  function segmentHitsRect(a,b,r,pad=ROUTE_CLEAR){
   const l=r.l-pad,rr=r.r+pad,t=r.t-pad,bb=r.b+pad;
   if(Math.abs(a.y-b.y)<.01){const y=a.y;return y>t&&y<bb&&Math.min(a.x,b.x)<rr&&Math.max(a.x,b.x)>l;}
   if(Math.abs(a.x-b.x)<.01){const x=a.x;return x>l&&x<rr&&Math.min(a.y,b.y)<bb&&Math.max(a.y,b.y)>t;}
   return true;
  }
  function onSegmentVal(z,a,b,eps=0){return z>=Math.min(a,b)-eps&&z<=Math.max(a,b)+eps;}
  function segmentRelation(a,b,c,d){
   const ah=Math.abs(a.y-b.y)<.001,bh=Math.abs(c.y-d.y)<.001;
   if(ah===bh){
    const dist=ah?Math.abs(a.y-c.y):Math.abs(a.x-c.x);
    const lo=Math.max(Math.min(ah?a.x:a.y,ah?b.x:b.y),Math.min(ah?c.x:c.y,ah?d.x:d.y));
    const hi=Math.min(Math.max(ah?a.x:a.y,ah?b.x:b.y),Math.max(ah?c.x:c.y,ah?d.x:d.y));
    if(dist<ROUTE_SEPARATION&&hi-lo>0.5)return {overlap:true,cross:0};
    return {overlap:false,cross:0};
   }
   const x=ah?c.x:a.x,y=ah?a.y:c.y;
   if(onSegmentVal(x,ah?a.x:c.x,ah?b.x:d.x,.01)&&onSegmentVal(y,ah?c.y:a.y,ah?d.y:b.y,.01)){
    // Una intersección a menos de 7 px de un giro no admite un salto legible.
    const d1=Math.min(Math.hypot(x-a.x,y-a.y),Math.hypot(x-b.x,y-b.y));
    const d2=Math.min(Math.hypot(x-c.x,y-c.y),Math.hypot(x-d.x,y-d.y));
    if(d1<9||d2<9)return {overlap:true,cross:0};
    return {overlap:false,cross:1,at:{x,y}};
   }
   return {overlap:false,cross:0};
  }
  function routeShapeValid(points,rects,ownIds,occupied,allowCross){
   let crosses=0;const segments=allSegments(points);
   for(const [i,seg] of segments.entries()){
    for(const r of rects){
     if(!ownIds.includes(r.id)&&segmentHitsRect(seg.a,seg.b,r))return null;
     if(ownIds.includes(r.id)&&i!==0&&i!==segments.length-1&&segmentHitsRect(seg.a,seg.b,r))return null;
    }
    for(const old of occupied){const q=segmentRelation(seg.a,seg.b,old.a,old.b);if(q.overlap)return null;if(q.cross){if(!allowCross)return null;crosses+=q.cross;}}
   }
   return crosses;
  }
  function simplify(points){
   const out=[];
   for(const p of points){if(out.length&&Math.hypot(out.at(-1).x-p.x,out.at(-1).y-p.y)<.05)continue;
    out.push(p);
    while(out.length>=3){const [a,b,c]=out.slice(-3);if((Math.abs(a.x-b.x)<.01&&Math.abs(b.x-c.x)<.01)||(Math.abs(a.y-b.y)<.01&&Math.abs(b.y-c.y)<.01))out.splice(out.length-2,1);else break;}
   }
   return out;
  }
  function fastCandidates(s,t,rects,occupied,own){
   const options=[];
   const add=(coords)=>{
    const points=simplify([s,...coords,t]);
    if(points.some((p,i)=>i&&Math.abs(p.x-points[i-1].x)>.01&&Math.abs(p.y-points[i-1].y)>.01))return;
    const crossings=routeShapeValid(points,rects,own,occupied,true);
    if(crossings!==null){let len=0;for(const g of allSegments(points))len+=Math.abs(g.a.x-g.b.x)+Math.abs(g.a.y-g.b.y);
     options.push({points,crossings,len});}
   };
   if(Math.abs(s.x-t.x)<.01||Math.abs(s.y-t.y)<.01)add([]);
   add([{x:t.x,y:s.y}]);add([{x:s.x,y:t.y}]);
   const midX=(s.x+t.x)/2,midY=(s.y+t.y)/2;
   for(const off of [0,-24,24,-48,48,-96,96,160,-160]){
    const xx=midX+off,yy=midY+off;
    add([{x:xx,y:s.y},{x:xx,y:t.y}]);
    add([{x:s.x,y:yy},{x:t.x,y:yy}]);
   }
   options.sort((a,b)=>a.crossings-b.crossings||a.len-b.len||a.points.length-b.points.length);
   return options[0]||null;
  }
  function findRouteGrid(start,end,allRects,occupied,allowCross,margin,limitMs){
   const minx=Math.min(start.x,end.x)-margin,maxx=Math.max(start.x,end.x)+margin;
   const miny=Math.min(start.y,end.y)-margin,maxy=Math.max(start.y,end.y)+margin;
   const near=allRects.filter(r=>r.r>=minx&&r.l<=maxx&&r.b>=miny&&r.t<=maxy);
   const xs=[start.x,end.x,minx,maxx],ys=[start.y,end.y,miny,maxy];
   for(const r of near){xs.push(r.l-ROUTE_CLEAR-3,r.r+ROUTE_CLEAR+3);ys.push(r.t-ROUTE_CLEAR-3,r.b+ROUTE_CLEAR+3);}
   // Los cruces lejanos conservan los obstáculos, pero no multiplican los ejes
   // por cada tramo ya dibujado. El solapamiento se sigue validando íntegro.
   if(Math.abs(start.x-end.x)+Math.abs(start.y-end.y)<1400)for(const z of occupied){
    if(z.h&&z.a.y>=miny&&z.a.y<=maxy){ys.push(z.a.y-ROUTE_SEPARATION-3,z.a.y+ROUTE_SEPARATION+3);}
    if(!z.h&&z.a.x>=minx&&z.a.x<=maxx){xs.push(z.a.x-ROUTE_SEPARATION-3,z.a.x+ROUTE_SEPARATION+3);}
   }
   const uniq=v=>[...new Set(v.filter(Number.isFinite).map(n=>Math.round(n*100)/100))].sort((a,b)=>a-b);
   const xx=uniq(xs),yy=uniq(ys),nx=xx.length,ny=yy.length;
   if(nx*ny>60000)return null;
   const xi=xx.indexOf(Math.round(start.x*100)/100),yi=yy.indexOf(Math.round(start.y*100)/100),
         tx=xx.indexOf(Math.round(end.x*100)/100),ty=yy.indexOf(Math.round(end.y*100)/100);
   if(xi<0||yi<0||tx<0||ty<0)return null;
   const target=ty*nx+tx,source=yi*nx+xi;
   const g=new Map(),parent=new Map();const heap=[];
   function push(item){let k=heap.length;heap.push(item);while(k>0){let p=(k-1)>>1;if(heap[p].f<=item.f)break;heap[k]=heap[p];k=p;}heap[k]=item;}
   function pop(){const out=heap[0],last=heap.pop();if(heap.length){let k=0;while(k*2+1<heap.length){let j=k*2+1;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[j].f>=last.f)break;heap[k]=heap[j];k=j;}heap[k]=last;}return out;}
   const startKey=source*3;g.set(startKey,0);push({k:startKey,f:Math.abs(start.x-end.x)+Math.abs(start.y-end.y),v:0});
   const blocked=new Map();
   function candidate(a,b){const key=`${a.x},${a.y}|${b.x},${b.y}`;
    if(blocked.has(key))return blocked.get(key);
    let penalty=0;
    for(const r of near){if(segmentHitsRect(a,b,r)){blocked.set(key,null);return null;}}
    for(const old of occupied){const rel=segmentRelation(a,b,old.a,old.b);if(rel.overlap||rel.cross&&!allowCross){blocked.set(key,null);return null;}penalty+=rel.cross*250000;}
    blocked.set(key,penalty);return penalty;
   }
   let expansions=0,goal=null;
   while(heap.length&&expansions++<130000){
    const cur=pop();if(cur.v!==g.get(cur.k))continue;
    const idx=Math.floor(cur.k/3),dir=cur.k%3;
    if(idx===target){goal=cur.k;break;}
    const ix=idx%nx,iy=Math.floor(idx/nx),a={x:xx[ix],y:yy[iy]};
    for(const [ax,ay,nd] of [[ix-1,iy,1],[ix+1,iy,1],[ix,iy-1,2],[ix,iy+1,2]]){
     if(ax<0||ax>=nx||ay<0||ay>=ny)continue;
     const b={x:xx[ax],y:yy[ay]},extra=candidate(a,b);if(extra===null)continue;
     const nidx=ay*nx+ax,nkey=nidx*3+nd;
     const distance=Math.abs(a.x-b.x)+Math.abs(a.y-b.y),cost=cur.v+distance+extra+(dir&&dir!==nd?11:0);
     if(cost<(g.get(nkey)??Infinity)){
      g.set(nkey,cost);parent.set(nkey,cur.k);
      push({k:nkey,v:cost,f:cost+Math.abs(b.x-end.x)+Math.abs(b.y-end.y)});
     }
    }
   }
   if(goal===null)return null;
   const rev=[];for(let k=goal;k!==undefined;k=parent.get(k)){
    const idx=Math.floor(k/3);rev.push({x:xx[idx%nx],y:yy[Math.floor(idx/nx)]});
   }
   rev.reverse();return simplify(rev);
  }
  // Búsqueda auxiliar para órbitas densas: intenta carriles Manhattan
  // amplios antes de declarar pendiente una conexión. No atraviesa cajas
  // ni permite tramos compartidos; cada candidato pasa routeShapeValid.
  function wideCandidates(start,s,t,end,obstacles,occupied,own){
   const time=performance.now();
   const midX=(s.x+t.x)/2,midY=(s.y+t.y)/2;
   const nums=new Set(),ys=new Set();
   const add=(set,v)=>{if(Number.isFinite(v))set.add(Math.round(v*100)/100);};
   const minX=Math.min(s.x,t.x),maxX=Math.max(s.x,t.x);
   const minY=Math.min(s.y,t.y),maxY=Math.max(s.y,t.y);
   for(const d of [30,80,160,320,640,1300,2600,5200]){
    for(const sign of [-1,1]){
     add(nums,midX+sign*d);add(ys,midY+sign*d);
    }
    add(nums,minX-d);add(nums,maxX+d);
    add(ys,minY-d);add(ys,maxY+d);
   }
   for(const r of obstacles){
    if(r.r>=minX-700&&r.l<=maxX+700){
     add(nums,r.l-ROUTE_CLEAR-5);add(nums,r.r+ROUTE_CLEAR+5);
    }
    if(r.b>=minY-700&&r.t<=maxY+700){
     add(ys,r.t-ROUTE_CLEAR-5);add(ys,r.b+ROUTE_CLEAR+5);
    }
   }
   // Los carriles externos más cercanos se examinan primero.
   const channels=(set,mid)=>[...set].sort((a,b)=>Math.abs(a-mid)-Math.abs(b-mid)).slice(0,48);
   let best=null;
   function consider(candidate){
    const points=simplify(candidate);
    if(points.some((p,i)=>i&&Math.abs(p.x-points[i-1].x)>.01&&Math.abs(p.y-points[i-1].y)>.01))return;
    const crosses=routeShapeValid(points,obstacles,own,occupied,true);
    if(crosses===null)return;
    const len=allSegments(points).reduce((v,x)=>v+Math.abs(x.a.x-x.b.x)+Math.abs(x.a.y-x.b.y),0);
    if(!best||crosses<best.crosses||crosses===best.crosses&&len<best.len)best={points,crosses,len};
   }
   let tested=0;
   for(const x of channels(nums,midX)){
    consider([start,s,{x,y:s.y},{x,y:t.y},t,end]);
    if(++tested%8===0&&performance.now()-time>140)break;
   }
   tested=0;
   for(const y of channels(ys,midY)){
    consider([start,s,{x:s.x,y},{x:t.x,y},t,end]);
    if(++tested%8===0&&performance.now()-time>240)break;
   }
   return best;
  }
  function routeEdge(src,dst,obstacles,occupied){
   const start={x:src.x,y:src.y},s={x:src.sx,y:src.sy};
   const t={x:dst.sx,y:dst.sy},end={x:dst.x,y:dst.y};
   const own=[src.id,dst.id];
   // Las rutas salen por puertos individuales; los segmentos se confirman antes de dibujar.
   let possible=[];
   // Canal individual para ramas paralelas del mismo progenitor.
   // Se reserva por orden espacial: los hijos más alejados usan los carriles interiores.
   const parent=nodeById(src.id),child=nodeById(dst.id);
   if((mode==='01'||mode==='02')&&child?.parent===src.id&&src.side==='right'&&dst.side==='left'&&t.x-s.x>30){
    const py=parent.y,above=t.y<py;
    const siblings=state.nodes.filter(n=>n.parent===src.id&&((n.y<py)===above))
     .sort((a,b)=>above?a.y-b.y:b.y-a.y);
    const rank=siblings.findIndex(n=>n.id===dst.id);
    if(rank>=0){
     const v=(rank+1)/(siblings.length+1),lane=s.x+8+v*(t.x-s.x-16);
     const candidate=simplify([start,s,{x:lane,y:s.y},{x:lane,y:t.y},t,end]);
     const valid=routeShapeValid(candidate,obstacles,own,occupied,false);
     if(valid===0)return {points:candidate,crosses:0};
    }
   }
   const straight=fastCandidates(s,t,obstacles,occupied,own);
   if(straight)possible.push(straight);
   const localFirst=straight?.crossings===0&&routeShapeValid(simplify([start,...straight.points,end]),obstacles,own,occupied,false)===0?straight:null;
   let best=localFirst;
   if(!best){
    for(const margin of [110,280,620]){
     let search=findRouteGrid(s,t,obstacles,occupied,false,margin);
     if(search){const full=simplify([start,...search,end]);if(routeShapeValid(full,obstacles,own,occupied,false)===0){best={points:search,crossings:0};break;}}
    }
   }
   if(!best&&straight&&routeShapeValid(simplify([start,...straight.points,end]),obstacles,own,occupied,true)!==null)best=straight;
   if(!best){for(const margin of [210,650,1200]){
    let search=findRouteGrid(s,t,obstacles,occupied,true,margin);
    if(search){const full=simplify([start,...search,end]),crossings=routeShapeValid(full,obstacles,own,occupied,true);
     if(crossings!==null){best={points:search,crossings};break;}}
   }}
   if(!best&&mode==='03'){
    const wide=wideCandidates(start,s,t,end,obstacles,occupied,own);
    if(wide)return {points:wide.points,crosses:wide.crosses};
   }
   if(!best)return null;
   const p=simplify([start,...best.points,end]);
   const crosses=routeShapeValid(p,obstacles,own,occupied,true);
   return crosses===null?null:{points:p,crosses};
  }
  function linePath(points,jumps=[]){
   const coords=points.map(p=>({x:p.x,y:p.y}));const fmt=n=>Number(n.toFixed(2));
   let d=`M ${fmt(coords[0].x)} ${fmt(coords[0].y)}`;
   for(let i=1;i<coords.length;i++){
    const a=coords[i-1],b=coords[i];
    const isH=Math.abs(a.y-b.y)<.01;
    const p=jumps.filter(c=>isH?Math.abs(c.y-a.y)<.05&&onSegmentVal(c.x,a.x,b.x,-8):Math.abs(c.x-a.x)<.05&&onSegmentVal(c.y,a.y,b.y,-8))
     .sort((x,y)=>isH?((x.x-a.x)*Math.sign(b.x-a.x)-(y.x-a.x)*Math.sign(b.x-a.x)):((x.y-a.y)*Math.sign(b.y-a.y)-(y.y-a.y)*Math.sign(b.y-a.y)));
    for(const c of p){
     const sign=isH?Math.sign(b.x-a.x):Math.sign(b.y-a.y);
     const near=p.filter(v=>v!==c).reduce((v,q)=>Math.min(v,Math.hypot(q.x-c.x,q.y-c.y)),Infinity);
     const r=Math.max(1.25,Math.min(7,near/3.3));
     c.radius=r;
     if(isH)d+=` L ${fmt(c.x-r*sign)} ${fmt(a.y)} Q ${fmt(c.x)} ${fmt(c.y-r*1.28)} ${fmt(c.x+r*sign)} ${fmt(a.y)}`;
     else d+=` L ${fmt(a.x)} ${fmt(c.y-r*sign)} Q ${fmt(c.x+r*1.28)} ${fmt(c.y)} ${fmt(a.x)} ${fmt(c.y+r*sign)}`;
    }
    d+=` L ${fmt(b.x)} ${fmt(b.y)}`;
   }
   return d;
  }
  function intersections(points,occupied){const pointsOut=[];for(const sg of allSegments(points))for(const old of occupied){const rel=segmentRelation(sg.a,sg.b,old.a,old.b);if(rel.cross&&rel.at&&!pointsOut.some(v=>Math.hypot(v.x-rel.at.x,v.y-rel.at.y)<.05))pointsOut.push(rel.at);}return pointsOut;}
  Object.assign(this,{prefSide,assignPorts,allSegments,segmentHitsRect,onSegmentVal,segmentRelation,routeShapeValid,simplify,fastCandidates,findRouteGrid,routeEdge,linePath,intersections});
  this.clearance=ROUTE_CLEAR;
  this.separation=ROUTE_SEPARATION;
  this.portStub=PORT_STUB;
 }
}
