// Pure bounded radial layout. No edits to the graph or to 01 coordinates.
// A finite search may fail; audit() is independent of the search and decides
// acceptance. Never enlarge the edge-distance limit to make a drawing pass.
import {orderRoots} from '../core/RootOrder.js';

export class RadialLayout {
 static gap(a,b){
  return Math.hypot(Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),
   Math.max(0,Math.abs(a.y-b.y)-(a.h+b.h)/2));
 }
 static angleDelta(a,b){return Math.atan2(Math.sin(a-b),Math.cos(a-b));}
 static signature(nodes,edges){
  return JSON.stringify({nodes:nodes.map(n=>[n.id,n.parent??null,n.branch??null]).sort((a,b)=>a[0].localeCompare(b[0])),
   edges:edges.map(e=>[e.from,e.to,e.kind??'']).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)))});
 }
 static audit({nodes,edges,positions,metrics,sectors,owner,baseHeight,clearance=14}){
  const boxes=nodes.map(n=>({id:n.id,...positions.get(n.id),w:metrics.get(n.id)?.w,h:metrics.get(n.id)?.h}));
  const byId=new Map(boxes.map(b=>[b.id,b]));
  const collisions=[],distanceViolations=[],outwardViolations=[],sectorViolations=[],orderViolations=[];
  let maxGap=0;
  for(let i=0;i<boxes.length;i++)for(let j=0;j<i;j++){
   const a=boxes[i],b=boxes[j];
   if(Math.abs(a.x-b.x)<(a.w+b.w)/2+clearance-1e-4&&
      Math.abs(a.y-b.y)<(a.h+b.h)/2+clearance-1e-4)collisions.push([a.id,b.id]);
  }
  for(const edge of edges){
   const a=byId.get(edge.from),b=byId.get(edge.to);if(!a||!b)continue;
   const gap=this.gap(a,b);maxGap=Math.max(maxGap,gap);
   if(gap>2*baseHeight+1e-4)distanceViolations.push({from:a.id,to:b.id,gap,limit:2*baseHeight});
  }
  for(const n of nodes){
   const a=byId.get(n.id),parent=byId.get(n.parent);
   if(parent&&Math.hypot(a.x,a.y)<=Math.hypot(parent.x,parent.y)+1e-4)outwardViolations.push(n.id);
   const sector=sectors.get(owner.get(n.id));
   if(sector){
    // Test the entire rectangle, not just its centre.
    const corners=[[-1,-1],[-1,1],[1,-1],[1,1]];
    if(corners.some(([sx,sy])=>Math.abs(this.angleDelta(Math.atan2(a.y+sy*a.h/2,a.x+sx*a.w/2),sector.center))>sector.span/2+1e-5))
     sectorViolations.push(n.id);
   }
  }
  // Sibling order comes from the measured 01 plane and is part of the audit.
  const siblings=new Map();
  for(const n of nodes)if(n.parent&&n.parent!=='p1'){
   if(!siblings.has(n.parent))siblings.set(n.parent,[]);siblings.get(n.parent).push(n);
  }
  // nodes are supplied in the stable sibling order chosen by compute().
  for(const list of siblings.values())for(let i=1;i<list.length;i++){
   const a=byId.get(list[i-1].id),b=byId.get(list[i].id),s=sectors.get(owner.get(a.id));
   if(s&&this.angleDelta(Math.atan2(a.y,a.x),s.center)>this.angleDelta(Math.atan2(b.y,b.x),s.center)+1e-4)
    orderViolations.push([a.id,b.id]);
  }
  const origin=byId.get('p1');
  const centered=Boolean(origin)&&Math.hypot(origin.x,origin.y)<=1e-4;
  const complete=positions.size===nodes.length&&boxes.every(b=>Number.isFinite(b.x)&&Number.isFinite(b.y)&&b.w>0&&b.h>0);
  return {valid:complete&&centered&&!collisions.length&&!distanceViolations.length&&!outwardViolations.length&&!sectorViolations.length&&!orderViolations.length,
   complete,centered,overlaps:collisions.length,collisions,distanceViolations,outwardViolations,sectorViolations,orderViolations,
   baseHeight,maxAllowedGap:2*baseHeight,maxGap};
 }
 compute({nodes,edges,metrics,sourcePositions,topologyReference}){
  if(!nodes.length)return {mode:'02',positions:new Map(),rects:new Map(),levels:{},stats:{nodes:0,overlaps:0,constraintsValid:true}};
  const source=sourcePositions instanceof Map?sourcePositions:new Map(sourcePositions||[]);
  metrics=metrics instanceof Map?metrics:new Map(metrics);
  const byId=new Map(nodes.map((n,i)=>[n.id,i]));
  if(byId.size!==nodes.length||!byId.has('p1'))throw Error('El radial requiere identidades únicas y un núcleo p1.');
  for(const n of nodes){const m=metrics.get(n.id);if(!m||!Number.isFinite(m.w)||!Number.isFinite(m.h)||m.w<=0||m.h<=0)throw Error('Dimensiones inválidas: '+n.id);}
  for(const e of edges)if(!byId.has(e.from)||!byId.has(e.to))throw Error('Vínculo con extremo inexistente.');
  const root=byId.get('p1'),children=nodes.map(()=>[]),parent=nodes.map(n=>byId.get(n.parent)??-1);
  nodes.forEach((n,i)=>{if(i!==root&&parent[i]>=0)children[parent[i]].push(i);});
  const order=(a,b)=>(source.get(nodes[a].id)?.y??0)-(source.get(nodes[b].id)?.y??0)||nodes[a].id.localeCompare(nodes[b].id);
  children.forEach(c=>c.sort(order));
  children[root]=orderRoots(children[root].map(i=>nodes[i]),topologyReference).map(n=>byId.get(n.id));
  if(nodes[root].parent)throw Error('El núcleo p1 no puede tener padre.');
  const auditNodes=[...nodes].sort((a,b)=>order(byId.get(a.id),byId.get(b.id)));
  const roots=children[root],owner=new Map(),levels={},disconnected=[],weight=new Map(),visited=new Set();
  const walk=(i,level,branch)=>{
   if(visited.has(i))return 0;visited.add(i);levels[nodes[i].id]=level;
   if(branch)owner.set(nodes[i].id,branch);
   let sum=0;for(const c of children[i])sum+=walk(c,level+1,branch||nodes[c].id);
   const m=metrics.get(nodes[i].id);weight.set(i,Math.max(m.w, sum));return weight.get(i);
  };
  walk(root,0,null);
  for(let i=0;i<nodes.length;i++)if(!visited.has(i)){
   disconnected.push(nodes[i].id);walk(i,1,'disconnected');
  }
  const sectors=new Map(),total=roots.reduce((s,i)=>s+weight.get(i),0);
  let cursor=-Math.PI/2;
  for(const i of roots){const span=Math.PI*2*weight.get(i)/total;sectors.set(nodes[i].id,{center:cursor+span/2,span});cursor+=span;}
  const baseHeight=Math.min(...nodes.map(n=>metrics.get(n.id).h)),limit=2*baseHeight,clearance=14;
  const widths=nodes.map(n=>metrics.get(n.id).w),heights=nodes.map(n=>metrics.get(n.id).h);
  const links=edges.map(e=>[byId.get(e.from),byId.get(e.to)]),angles=new Float64Array(nodes.length);
  const angularVisited=new Set();
  const assign=(i,center,span)=>{
   if(angularVisited.has(i))return;angularVisited.add(i);
   angles[i]=center;let at=center-span/2;const sum=children[i].reduce((s,c)=>s+weight.get(c),0);
   for(const c of children[i]){const arc=span*weight.get(c)/sum;assign(c,at+arc/2,arc);at+=arc;}
  };
  // Ignore already visited orphan cycles; they are retained and reported below.
  for(const i of roots){const s=sectors.get(nodes[i].id);assign(i,s.center,s.span);}
  const positions=new Map();
  let best=null,bestScore=Infinity;
  // Deterministic multiple starts; no global scale expansion.
  for(let attempt=0;attempt<8;attempt++){
   const rotation=Math.PI/4;
   if(attempt===3){for(const sector of sectors.values())sector.center+=rotation;for(let i=0;i<angles.length;i++)angles[i]+=rotation;}
   const x=new Float64Array(nodes.length),y=new Float64Array(nodes.length);
   for(let i=0;i<nodes.length;i++){
    const depth=levels[nodes[i].id]||0,r=depth*(baseHeight+limit*.55+attempt*baseHeight*.3);
    x[i]=Math.cos(angles[i])*r;y[i]=Math.sin(angles[i])*r;
   }
   x[root]=0;y[root]=0;
   const move=(i,dx,dy)=>{if(i!==root){x[i]+=dx;y[i]+=dy;}};
   const projectSector=i=>{
    const s=sectors.get(owner.get(nodes[i].id));if(!s)return;
    // Corner constraints are linear halfplanes for sectors up to pi. For a
    // larger sector use angular clamping of the centre and a corner margin.
    if(s.span<=Math.PI){
     for(const [angle,sign] of [[s.center-s.span/2,1],[s.center+s.span/2,-1]]){
      const nx=-Math.sin(angle)*sign,ny=Math.cos(angle)*sign;
      const required=Math.abs(nx)*widths[i]/2+Math.abs(ny)*heights[i]/2+1;
      const d=required-(nx*x[i]+ny*y[i]);if(d>0)move(i,nx*d,ny*d);
     }
    }else{
     const r=Math.hypot(x[i],y[i])||1,a=RadialLayout.angleDelta(Math.atan2(y[i],x[i]),s.center);
     const margin=Math.asin(Math.min(.99,Math.hypot(widths[i],heights[i])/2/r));
     const bound=Math.max(0,s.span/2-margin),clamped=Math.max(-bound,Math.min(bound,a));
     if(a!==clamped){x[i]=r*Math.cos(s.center+clamped);y[i]=r*Math.sin(s.center+clamped);}
    }
   };
   const projectOrder=()=>{
    for(let p=0;p<children.length;p++)if(p!==root){
     const list=children[p],s=sectors.get(owner.get(nodes[p].id));if(!s)continue;
     for(let j=1;j<list.length;j++){
      const a=list[j-1],b=list[j],aa=RadialLayout.angleDelta(Math.atan2(y[a],x[a]),s.center),ab=RadialLayout.angleDelta(Math.atan2(y[b],x[b]),s.center);
      if(aa<=ab)continue;
      const mid=s.center+(aa+ab)/2,ra=Math.hypot(x[a],y[a]),rb=Math.hypot(x[b],y[b]);
      x[a]=ra*Math.cos(mid);y[a]=ra*Math.sin(mid);x[b]=rb*Math.cos(mid);y[b]=rb*Math.sin(mid);
     }
    }
   };
   for(let iteration=0;iteration<Math.max(90,Math.min(1800,Math.floor(80000000/(nodes.length*nodes.length))));iteration++){
    const strength=iteration<600?.55:.85;
    for(const [a,b] of links){
     const dx=x[b]-x[a],dy=y[b]-y[a];
     const gx=Math.max(0,Math.abs(dx)-(widths[a]+widths[b])/2),gy=Math.max(0,Math.abs(dy)-(heights[a]+heights[b])/2),gap=Math.hypot(gx,gy);
     if(gap>limit*.88){
      const scale=(gap-limit*.88)/gap*strength,share=(a===root||b===root)?1:.5;
      const mx=Math.sign(dx)*gx*scale*share,my=Math.sign(dy)*gy*scale*share;
      move(a,mx,my);move(b,-mx,-my);
     }
    }
    for(let a=0;a<nodes.length;a++)for(let b=0;b<a;b++){
     const dx=x[a]-x[b],dy=y[a]-y[b];
     const px=(widths[a]+widths[b])/2+clearance+.1-Math.abs(dx),py=(heights[a]+heights[b])/2+clearance+.1-Math.abs(dy);
     if(px<=0||py<=0)continue;
     const share=(a===root||b===root)?1:.5;
     if(px<py){const d=(dx<0?-1:1)*px*share;move(a,d,0);move(b,-d,0);}
     else {const d=(dy<0?-1:1)*py*share;move(a,0,d);move(b,0,-d);}
    }
    for(let i=0;i<nodes.length;i++)if(i!==root){
     projectSector(i);
     const pi=parent[i];
     if(pi>=0){
      const r=Math.hypot(x[i],y[i]),minimum=Math.hypot(x[pi],y[pi])+clearance;
      if(r<minimum){const a=r?Math.atan2(y[i],x[i]):angles[i];x[i]=minimum*Math.cos(a);y[i]=minimum*Math.sin(a);}
     }
    }
    if(attempt>=3)projectOrder();
    if(iteration%30===29||iteration===1799){
     positions.clear();nodes.forEach((n,i)=>positions.set(n.id,{x:x[i],y:y[i]}));
     const audit=RadialLayout.audit({nodes:auditNodes,edges,positions,metrics,sectors,owner,baseHeight,clearance});
     const score=audit.collisions.length*10000+audit.distanceViolations.reduce((s,e)=>s+(e.gap-limit)**2,0)+
      audit.outwardViolations.length*10000+audit.sectorViolations.length*10000+audit.orderViolations.length*10000;
     if(score<bestScore){bestScore=score;best={positions:new Map(positions),audit,sectors:new Map([...sectors].map(([id,s])=>[id,{...s}]))};}
     if(audit.valid)break;
    }
   }
   if(best.audit.valid)break;
  }
  const rects=new Map([...best.positions].map(([id,p])=>{const m=metrics.get(id);return [id,{id,...p,...m,l:p.x-m.w/2,r:p.x+m.w/2,t:p.y-m.h/2,b:p.y+m.h/2}];}));
  const audit=best.audit;
  // Disconnected components cannot satisfy the requested rooted sector layout.
  const constraintsValid=audit.valid&&!disconnected.length;
  return {mode:'02',positions:best.positions,rects,levels,
   stats:{mode:'02',nodes:nodes.length,arms:roots.length,disconnected,overlaps:audit.overlaps,
    constraintsValid,radialOrder:!audit.outwardViolations.length,baseHeight,maxAllowedGap:limit,maxGap:audit.maxGap,
    distanceViolations:audit.distanceViolations,outwardViolations:audit.outwardViolations,
    sectorViolations:audit.sectorViolations,orderViolations:audit.orderViolations,collisions:audit.collisions,
    sectors:Object.fromEntries(best.sectors),owners:Object.fromEntries(owner),
    searchStatus:constraintsValid?'satisfied':'not-found',
    graphSignature:RadialLayout.signature(nodes,edges)}};
 }
}
