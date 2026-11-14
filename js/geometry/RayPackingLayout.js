import {orderRoots} from '../core/RootOrder.js';

const TAU=2*Math.PI,EPS=.02;
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const gap=(a,b)=>Math.hypot(Math.max(0,Math.abs(a.x-b.x)-(a.w+b.w)/2),Math.max(0,Math.abs(a.y-b.y)-(a.h+b.h)/2));
export const rayRect=(id,p,m)=>({id,...p,w:m.w,h:m.h,routingClearance:m.routingClearance,
 l:p.x-m.w/2,r:p.x+m.w/2,t:p.y-m.h/2,b:p.y+m.h/2});

// One ray is a direction, not a ring for a whole generation. Intersecting the
// ray with expanded boxes gives the nearest free radius analytically.
export function firstFreeRadius(angle,minimum,size,rects,clearance=24,except=null,origin={x:0,y:0},pairClearance=null){
 const vx=Math.cos(angle),vy=Math.sin(angle),blocked=[];
 for(const r of rects.values()){
  if(r.id===except)continue;
  let lo=minimum,hi=Infinity;
  const pad=pairClearance?pairClearance(size,r):Math.max(clearance,size.routingClearance||0,r.routingClearance||0);
  for(const [v,center,half] of [[vx,r.x-origin.x,(r.w+size.w)/2+pad],[vy,r.y-origin.y,(r.h+size.h)/2+pad]]){
   if(Math.abs(v)<1e-10){if(Math.abs(center)>=half){hi=-Infinity;break;}continue;}
   const a=(center-half)/v,b=(center+half)/v;
   lo=Math.max(lo,Math.min(a,b));hi=Math.min(hi,Math.max(a,b));
  }
  if(hi>=lo)blocked.push([lo,hi]);
 }
 blocked.sort((a,b)=>a[0]-b[0]);
 let radius=minimum;
 for(const [lo,hi] of blocked){if(radius<lo-EPS)break;if(radius<=hi+EPS)radius=hi+EPS;}
 return radius;
}

export class RayPackingLayout {
 static VERSION='ray-packing-v2';
 compute({nodes,edges,metrics,sourcePositions,topologyReference,clearance=24,nodeClearances={},coreClearances=nodeClearances,coreGapFactor=.5,refinementPasses=3}){
  if(!Number.isFinite(coreGapFactor)||coreGapFactor<=0||coreGapFactor>1)throw Error('Factor de separación del núcleo inválido.');
  metrics=new Map([...(metrics instanceof Map?metrics:new Map(metrics))].map(([id,m])=>
   [id,{...m,id,routingClearance:Math.max(clearance,nodeClearances[id]||0)}]));
  const source=sourcePositions instanceof Map?sourcePositions:new Map(sourcePositions||[]);
  const byId=new Map(nodes.map(n=>[n.id,n]));
  if(byId.size!==nodes.length||!byId.has('p1'))throw Error('Se requiere un núcleo p1 y conceptos únicos.');
  if(byId.get('p1').parent)throw Error('El núcleo p1 no puede tener padre.');
  for(const n of nodes){const m=metrics.get(n.id);if(!m||![m.w,m.h].every(v=>Number.isFinite(v)&&v>0))throw Error('Dimensiones inválidas: '+n.id);}
  for(const e of edges)if(!byId.has(e.from)||!byId.has(e.to))throw Error('Vínculo con extremo inexistente.');
  const key=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
  const children=new Map(nodes.map(n=>[n.id,[]])),adj=new Map(nodes.map(n=>[n.id,[]]));
  for(const n of nodes)if(n.id!=='p1'&&children.has(n.parent))children.get(n.parent).push(n);
  for(const e of edges){adj.get(e.from).push(e.to);adj.get(e.to).push(e.from);}
  const fallback=(a,b)=>(source.get(a.id)?.y??0)-(source.get(b.id)?.y??0)||a.id.localeCompare(b.id);
  for(const n of nodes){
   let ring=topologyReference?.ports?.[n.id]||[];
   const incoming=n.parent&&key({from:n.parent,to:n.id}),at=ring.findIndex(p=>p.edge===incoming);
   if(at>=0)ring=[...ring.slice(at+1),...ring.slice(0,at+1)];
   const rank=new Map(ring.map((p,i)=>[p.edge,i]));
   children.get(n.id).sort((a,b)=>(rank.get(key({from:n.id,to:a.id}))??Infinity)-
    (rank.get(key({from:n.id,to:b.id}))??Infinity)||fallback(a,b));
  }
  const roots=orderRoots(children.get('p1'),topologyReference);
  children.set('p1',roots);
  const pairClearance=(size,r)=>{
   const rootChild=byId.get(size.id)?.parent==='p1';
   if(rootChild&&r.id==='p1')return 0;
   // J1 heads share the core region; their outward fan capacity must not
   // inflate the empty space between heads. Routes still pass full DRC.
   if(rootChild&&byId.get(r.id)?.parent==='p1')return clearance;
   return Math.max(clearance,size.routingClearance||0,r.routingClearance||0);
  };
  // Halve the actual free gap between borders, not the box dimensions or
  // centre-to-centre radius. Freeze the reference capacity across route retries.
  const coreTarget=(id,angle)=>{
   const a=rayRect('p1',{x:0,y:0},{...metrics.get('p1'),routingClearance:Math.max(clearance,coreClearances.p1||0)});
   const b={...metrics.get(id),routingClearance:Math.max(clearance,coreClearances[id]||0)};
   const referenceRadius=firstFreeRadius(angle,1,b,new Map([['p1',a]]),clearance);
   const at=radius=>rayRect(id,{x:Math.cos(angle)*radius,y:Math.sin(angle)*radius},b);
   const referenceGap=gap(a,at(referenceRadius)),requestedGap=Math.max(clearance,referenceGap*coreGapFactor);
   let lo=0,hi=Math.max(referenceRadius,requestedGap+a.w+a.h+b.w+b.h);
   for(let i=0;i<40;i++){const mid=(lo+hi)/2;if(gap(a,at(mid))<requestedGap)lo=mid;else hi=mid;}
   return {referenceGap,requestedGap,radius:hi+EPS};
  };
  const levels={p1:0},owner=new Map(),area=new Map(),seen=new Set(),ordered=[];
  const visit=(n,level,branch)=>{
   if(seen.has(n.id))return 0;
   seen.add(n.id);ordered.push(n);levels[n.id]=level;if(branch)owner.set(n.id,branch);
   const m=metrics.get(n.id);let mass=m.w*m.h;
   for(const c of children.get(n.id))mass+=visit(c,level+1,branch||c.id);
   area.set(n.id,mass);return mass;
  };
  visit(byId.get('p1'),0,null);
  const disconnected=nodes.filter(n=>!seen.has(n.id)).map(n=>n.id);
  const orphanRoots=[];
  for(const n of nodes.filter(n=>!seen.has(n.id)).sort(fallback))if(!seen.has(n.id)){
   orphanRoots.push(n);visit(n,1,'disconnected');
  }
  const groups=[...roots.map(n=>({id:n.id,nodes:[n],area:area.get(n.id)}))];
  if(orphanRoots.length)groups.push({id:'disconnected',nodes:orphanRoots,area:orphanRoots.reduce((s,n)=>s+area.get(n.id),0)});
  const packingRank=new Map();
  for(const list of children.values())[...list].sort((a,b)=>Math.abs(list.indexOf(a)-(list.length-1)/2)-
   Math.abs(list.indexOf(b)-(list.length-1)/2)||list.indexOf(a)-list.indexOf(b)).forEach((n,i)=>packingRank.set(n.id,i));
  const packing=[byId.get('p1'),...roots,...orphanRoots],packed=new Set(packing.map(n=>n.id));
  const descend=n=>{for(const c of [...children.get(n.id)].sort((a,b)=>area.get(b.id)-area.get(a.id)||packingRank.get(a.id)-packingRank.get(b.id))){
   if(packed.has(c.id))continue;packed.add(c.id);packing.push(c);descend(c);
  }};
  for(const n of [...roots,...orphanRoots])descend(n);
  const makeIntervals=rotation=>{
   const sectors=new Map(),intervals=new Map();
   const sum=groups.reduce((s,g)=>s+Math.sqrt(g.area),0);let cursor=rotation;
   const assign=(n,lo,hi)=>{
    if(intervals.has(n.id))return;
    intervals.set(n.id,{lo,hi,center:(lo+hi)/2});
    const list=children.get(n.id).filter(c=>owner.get(c.id)===owner.get(n.id));
    const mass=list.reduce((s,c)=>s+Math.pow(area.get(c.id)||1,.65),0);let a=lo;
    for(const c of list){const end=a+(hi-lo)*Math.pow(area.get(c.id)||1,.65)/mass;assign(c,a,end);a=end;}
   };
   for(const g of groups){
    const span=TAU*Math.sqrt(g.area)/sum,lo=cursor,hi=cursor+span;
    sectors.set(g.id,{center:(lo+hi)/2,span});
    let a=lo;const mass=g.nodes.reduce((s,n)=>s+area.get(n.id),0);
    for(const n of g.nodes){const end=a+span*area.get(n.id)/mass;assign(n,a,end);a=end;}
    cursor=hi;
   }
   return {sectors,intervals};
  };
  const extent=rects=>{
   const all=[...rects.values()],l=Math.min(...all.map(r=>r.l)),r=Math.max(...all.map(r=>r.r)),
    t=Math.min(...all.map(r=>r.t)),b=Math.max(...all.map(r=>r.b));
   return {l,r,t,b,width:r-l,height:b-t,area:(r-l)*(b-t)};
  };
  let best=null;
  for(const rotation of [0,1,2,3,4,5].map(i=>i*Math.PI/6)){
   const {sectors,intervals}=makeIntervals(rotation),positions=new Map([['p1',{x:0,y:0}]]),rects=new Map(),fallbacks=[];
   rects.set('p1',rayRect('p1',positions.get('p1'),metrics.get('p1')));
   const place=(n,refine=false)=>{
    const m=metrics.get(n.id),parent=rects.get(n.parent)||rects.get('p1');
    const sector=sectors.get(owner.get(n.id));
    const siblings=children.get(n.parent)||[],index=siblings.findIndex(c=>c.id===n.id);
    const masses=siblings.map(c=>Math.pow(area.get(c.id)||1,.65)),mass=masses.reduce((s,v)=>s+v,0);
    const bearing=sector.center+delta(Math.atan2(parent.y,parent.x),sector.center);
    const start=Math.max(sector.center-sector.span/2,bearing-Math.PI/2+.01);
    const end=Math.min(sector.center+sector.span/2,bearing+Math.PI/2-.01),fan=end-start;
    const lo=start+fan*masses.slice(0,Math.max(0,index)).reduce((s,v)=>s+v,0)/Math.max(1,mass);
    const hi=lo+fan*(masses[index]||mass)/Math.max(1,mass);
    const range=n.parent==='p1'?intervals.get(n.id):{lo,hi,center:(lo+hi)/2};
    const preferred=range,heading=sector.center;
    const parentRadius=Math.hypot(parent.x,parent.y);
    const maximum=refine?Math.min(Infinity,...children.get(n.id).map(c=>positions.get(c.id)).filter(Boolean).map(p=>Math.hypot(p.x,p.y)-1)):Infinity;
    const old=positions.get(n.id),unwrapped=a=>heading+delta(a,heading);
    const clamp=a=>Math.max(range.lo+1e-7,Math.min(range.hi-1e-7,unwrapped(a)));
    const angles=n.parent==='p1'?[preferred.center]:[clamp(heading),clamp(preferred.center),clamp(Math.atan2(parent.y,parent.x))];
    if(old)angles.push(clamp(Math.atan2(old.y-parent.y,old.x-parent.x)));
    if(n.parent!=='p1')for(const fraction of [.04,.18,.35,.65,.82,.96])angles.push(range.lo+(range.hi-range.lo)*fraction);
    // Tangencies provide contacts against actual rectangles, rather than
    // summing every sibling's diagonal into one enormous radius.
    if(n.parent!=='p1')for(const r of [...rects.values()].sort((a,b)=>gap(a,parent)-gap(b,parent)).slice(0,12)){
     if(r.id===n.id)continue;
     const pad=Math.max(clearance,m.routingClearance,r.routingClearance);
     for(const x of [r.l-m.w/2-pad-EPS,r.r+m.w/2+pad+EPS])
      for(const y of [r.t-m.h/2-pad-EPS,r.b+m.h/2+pad+EPS]){
       const a=unwrapped(Math.atan2(y-parent.y,x-parent.x));if(a>range.lo&&a<range.hi)angles.push(a);
      }
    }
    const scoreAt=(p,r)=>{
     let linked=gap(r,parent),count=1;
     if(refine)for(const id of adj.get(n.id)){const other=rects.get(id);if(other&&id!==n.parent){linked+=gap(r,other);count++;}}
     return linked/count+Math.hypot(p.x-parent.x,p.y-parent.y)*.08+Math.hypot(p.x,p.y)*.025+
      Math.abs(delta(Math.atan2(p.y-parent.y,p.x-parent.x),heading))*2;
    };
    let choice=old?{p:old,r:rects.get(n.id),score:scoreAt(old,rects.get(n.id))}:null;
    for(const angle of [...new Set(angles.map(a=>Math.round(a*1e8)/1e8))]){
     const vx=Math.cos(angle),vy=Math.sin(angle),dot=parent.x*vx+parent.y*vy;
     const minimum=Math.max(-dot+Math.sqrt(dot*dot+2*parentRadius+1),n.parent==='p1'?coreTarget(n.id,angle).radius:0);
     const distance=firstFreeRadius(angle,minimum,m,rects,clearance,n.id,parent,pairClearance);
     const p={x:parent.x+vx*distance,y:parent.y+vy*distance},radius=Math.hypot(p.x,p.y),r=rayRect(n.id,p,m);
     if(radius>maximum||sector&&Math.abs(delta(Math.atan2(p.y,p.x),sector.center))>sector.span/2+1e-6)continue;
     if(refine){
      const out=Math.atan2(p.y-parent.y,p.x-parent.x);let last=-Infinity,ok=true;
      for(const c of children.get(n.id)){const at=positions.get(c.id);if(!at)continue;
       const a=delta(Math.atan2(at.y-p.y,at.x-p.x),out);if(a<last-1e-6){ok=false;break;}last=a;
      }
      if(!ok)continue;
     }
     const score=scoreAt(p,r);
     if(!choice||score<choice.score)choice={p,r,score};
    }
    if(choice){positions.set(n.id,choice.p);rects.set(n.id,choice.r);}
    else if(!old){
     fallbacks.push(n.id);
     const angle=preferred.center,radius=firstFreeRadius(angle,parentRadius+1,m,rects,clearance,n.id);
     const p={x:Math.cos(angle)*radius,y:Math.sin(angle)*radius};positions.set(n.id,p);rects.set(n.id,rayRect(n.id,p,m));
    }
   };
   for(const n of packing)if(n.id!=='p1')place(n);
   for(let pass=0;pass<refinementPasses;pass++)for(const n of [...packing].reverse())if(n.id!=='p1')place(n,true);
   const bounds=extent(rects),gaps=edges.map(e=>gap(rects.get(e.from),rects.get(e.to)));
   const score=gaps.reduce((s,v)=>s+v,0)+Math.sqrt(bounds.area)*.5;
   if(!best||score<best.score)best={positions,rects,sectors,intervals,bounds,score,gaps,fallbacks};
  }
  return {...best,levels,owner,ordered,disconnected,roots,clearance,
   stats:{engine:RayPackingLayout.VERSION,arms:roots.length,meanGap:best.gaps.reduce((s,v)=>s+v,0)/Math.max(1,edges.length),
    maxGap:Math.max(0,...best.gaps),bounds:best.bounds,clearance,nodeClearances,coreClearances,coreGapFactor,
    coreSpacing:{view:'02',factor:coreGapFactor,minimumGap:clearance,links:roots.map(n=>{
     const p=best.positions.get(n.id),target=coreTarget(n.id,Math.atan2(p.y,p.x));
     const actualGap=gap(best.rects.get('p1'),best.rects.get(n.id));
     return {id:n.id,referenceGap:target.referenceGap,requestedGap:target.requestedGap,actualGap,
      ratio:actualGap/target.referenceGap,constrained:actualGap>target.requestedGap+.1};
    })},fallbacks:best.fallbacks}};
 }
}
