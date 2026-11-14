import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {dirname,resolve} from 'node:path';
import ELK from 'elkjs/lib/elk.bundled.js';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';
import {ViewLayouts} from '../js/geometry/ViewLayouts.js';
import {TopologyRegister} from '../js/core/TopologyRegister.js';
import {checkDerivedTopology} from '../js/core/DerivedTopology.js';
import {computeInitialRoutes} from '../js/workers/initial-route.worker.js';

// Experimental adapters, not a production engine switch. All candidates use
// the same 210 boxes, original sizes, 217 edges, and the frozen 01 reference.
const fixture=JSON.parse(readFileSync(new URL('../tests/route-fixture.json',import.meta.url)));
const edgeKey=e=>[e.from,e.to].sort().map(encodeURIComponent).join('|');
const byId=new Map(fixture.nodes.map(n=>[n.id,n]));
const originalRects=new Map(fixture.rects),sourcePositions=new Map(fixture.positions);
const metrics=new Map([...originalRects].map(([id,r])=>[id,{w:r.w,h:r.h}]));
const overlap=(a,b,pad=0)=>a.l<b.r+pad&&a.r>b.l-pad&&a.t<b.b+pad&&a.b>b.t-pad;
const router=new PcbRouter({state:fixture,nodeById:id=>byId.get(id),clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
const validator=new GeometryValidator({router,rectOverlap:overlap});
const initial=computeInitialRoutes(fixture),initialRoutes=new Map(initial.routes);
const ordered=initial.routes.map(([,r])=>r.edge);
const reference=new TopologyRegister({edgeKey}).capture({positions:sourcePositions,rects:originalRects,
 routes:initialRoutes,edges:ordered});
const elk=new ELK();
const out=resolve(process.argv[2]||'artifacts/layout-benchmark.json');
mkdirSync(dirname(out),{recursive:true});
const results={schema:'p1.layout-benchmark.v1',engine:'elkjs@0.12.1',fixture:{nodes:210,edges:217},
 normativeStatus:'pending-definition',pendingDefinitions:['D1','D2','D3','D4'],
 diagnosticDistance:{pairs:'all original edges including transversals',measure:'minimum rectangle separation',
  H:53,limit:106,approved:false},candidates:[]};
function measure(name,layout,routes,ms,extra={}){
 const rects=[...layout.rects.values()];
 let overlaps=0,marginOverlaps=0,distanceViolations=0,maxGap=0,outwardViolations=0;
 for(let i=0;i<rects.length;i++)for(let j=0;j<i;j++){
  if(overlap(rects[i],rects[j]))overlaps++;
  if(overlap(rects[i],rects[j],14))marginOverlaps++;
 }
 for(const e of fixture.edges){
  const a=layout.rects.get(e.from),b=layout.rects.get(e.to);
  const gap=Math.hypot(Math.max(0,a.l-b.r,b.l-a.r),Math.max(0,a.t-b.b,b.t-a.b));
  maxGap=Math.max(maxGap,gap);if(gap>106+.01)distanceViolations++;
 }
 const center=layout.positions.get('p1');
 for(const n of fixture.nodes)if(n.parent&&layout.positions.has(n.parent)){
  const p=layout.positions.get(n.id),q=layout.positions.get(n.parent);
  if(Math.hypot(p.x-center.x,p.y-center.y)<=Math.hypot(q.x-center.x,q.y-center.y))outwardViolations++;
 }
 const audit=routes?validator.audit(rects,[...routes.values()]):null;
 const topology=routes?checkDerivedTopology({reference,edgeKey,positions:layout.positions,rects:layout.rects,
  routes,edges:ordered}):null;
 const oldPairs=new Set(reference.crossings.map(c=>JSON.stringify([c.a,c.b])));
 const newCrossingPairs=topology?.signature?.crossings.filter(c=>!oldPairs.has(JSON.stringify([c.a,c.b]))).length??null;
 const result={name,ms:Math.round(ms),nodes:layout.positions.size,edges:fixture.edges.length,
  overlaps,marginOverlaps,distanceViolations,maxGap:Math.round(maxGap*100)/100,
  parentRadialViolations:outwardViolations,regions:'not evaluated: D4 pending',
  routes:routes?[...routes.values()].filter(r=>r.points).length:null,
  routeAudit:audit&&{boxes:audit.boxes,invalid:audit.invalid,portsCloserThan8:audit.portsRepeated,crossings:audit.crossings},
  commonReference:topology?.report??null,newCrossingPairs,approved:false,...extra};
 results.candidates.push(result);
 writeFileSync(out,JSON.stringify(results,null,2)+'\n');
 console.log(JSON.stringify({...result,commonReference:result.commonReference&&{
  valid:result.commonReference.valid,compared:result.commonReference.compared,counts:result.commonReference.counts}}));
 return result;
}
function draw(name,layout,routes){
 const rects=[...layout.rects.values()],pad=40;
 const l=Math.min(...rects.map(r=>r.l))-pad,t=Math.min(...rects.map(r=>r.t))-pad;
 const r=Math.max(...rects.map(r=>r.r))+pad,b=Math.max(...rects.map(r=>r.b))+pad;
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
 const pieces=[`<svg xmlns="http://www.w3.org/2000/svg" viewBox="${l} ${t} ${r-l} ${b-t}">`,
  `<title>${esc(name)} — experimento sin aprobación normativa</title>`,
  '<style>path{fill:none;stroke:#77899b;stroke-width:1.5}rect{fill:#fff;stroke:#264b64}text{font:12px sans-serif;fill:#153446}</style>'];
 for(const rt of routes?.values()||[])if(rt.points)pieces.push(`<path d="${router.linePath(rt.points)}"/>`);
 for(const rect of rects)pieces.push(`<rect x="${rect.l}" y="${rect.t}" width="${rect.w}" height="${rect.h}" rx="8"/><text x="${rect.x}" y="${rect.y}" text-anchor="middle">${esc(rect.id)}</text>`);
 pieces.push('</svg>');writeFileSync(out.replace(/\.json$/,'')+'-'+name+'.svg',pieces.join('\n'));
}
measure('01-reference',{positions:sourcePositions,rects:originalRects},initialRoutes,0,{role:'fixed baseline; radial/distance metrics are diagnostic only'});
let start=performance.now();
const radial=new ViewLayouts().compute({mode:'02',nodes:fixture.nodes,edges:fixture.edges,metrics,sourcePositions});
measure('current-radial',radial,null,performance.now()-start,{searchStatus:radial.stats.searchStatus,
 orderViolations:radial.stats.orderViolations.length});
draw('current-radial',radial,null);
start=performance.now();
const seeded=new ViewLayouts().compute({mode:'02',nodes:fixture.nodes,edges:fixture.edges,metrics,sourcePositions,topologyReference:reference});
measure('radial-seeded-from-01',seeded,null,performance.now()-start,{searchStatus:seeded.stats.searchStatus,
 orderViolations:seeded.stats.orderViolations.length});
draw('radial-seeded-from-01',seeded,null);

for(const policy of ['FREE','FIXED_ORDER','FIXED_POS']){
 start=performance.now();
 const fixed=policy!=='FREE',sides={top:'NORTH',right:'EAST',bottom:'SOUTH',left:'WEST'};
 const children=fixture.nodes.map(n=>{
  const r=originalRects.get(n.id),ring=reference.ports[n.id]||[];
  return {id:n.id,width:r.w,height:r.h,layoutOptions:{'elk.portConstraints':policy},
   ports:ring.map((p,index)=>{
    const rt=initialRoutes.get(p.edge),old=rt.edge.from===n.id?rt.fromPort:rt.toPort;
    return {id:p.edge+'@'+n.id,width:0,height:0,
     ...(policy==='FIXED_POS'?{x:old.x-r.l,y:old.y-r.t}:{}),layoutOptions:fixed?
     {'elk.port.side':sides[p.side],'elk.port.index':String(index)}:{}};
   })};
 });
 const output=await elk.layout({id:'root',children,edges:fixture.edges.map(e=>({id:edgeKey(e),
  sources:[edgeKey(e)+'@'+e.from],targets:[edgeKey(e)+'@'+e.to]})),layoutOptions:{
  'elk.algorithm':'layered','elk.direction':'RIGHT','elk.edgeRouting':'ORTHOGONAL',
  'elk.layered.mergeEdges':'false','elk.spacing.nodeNode':'28','elk.spacing.edgeNode':'18',
  'elk.spacing.edgeEdge':'12','elk.spacing.portPort':'12','elk.layered.spacing.nodeNodeBetweenLayers':'48'}});
 const root=output.children.find(n=>n.id==='p1'),dx=root.x+root.width/2,dy=root.y+root.height/2;
 const positions=new Map(),rects=new Map();let resized=0;
 for(const n of output.children){
  const p={x:n.x+n.width/2-dx,y:n.y+n.height/2-dy};positions.set(n.id,p);
  rects.set(n.id,ViewLayouts.rect(n.id,p,{w:n.width,h:n.height}));
  const m=metrics.get(n.id);if(Math.abs(n.width-m.w)>.01||Math.abs(n.height-m.h)>.01)resized++;
 }
 const edges=new Map(fixture.edges.map(e=>[edgeKey(e),e]));
 const makePort=(p,r)=>{
  const side=[['left',Math.abs(p.x-r.l)],['right',Math.abs(p.x-r.r)],['top',Math.abs(p.y-r.t)],['bottom',Math.abs(p.y-r.b)]]
   .sort((a,b)=>a[1]-b[1])[0][0];
  return {...p,side,sx:p.x+(side==='left'?-19:side==='right'?19:0),sy:p.y+(side==='top'?-19:side==='bottom'?19:0)};
 };
 const routes=new Map(output.edges.map(e=>{
  const edge=edges.get(e.id),sections=e.sections||[];
  if(sections.length!==1)return [e.id,{edge,points:null}];
  const s=sections[0],points=[s.startPoint,...s.bendPoints||[],s.endPoint].map(p=>({x:p.x-dx,y:p.y-dy}));
  return [e.id,{edge,points,fromPort:makePort(points[0],rects.get(edge.from)),toPort:makePort(points.at(-1),rects.get(edge.to))}];
 }));
 const name='elk-layered-'+policy.toLowerCase().replace('_','-');
 measure(name,{positions,rects},routes,performance.now()-start,{resizedNodes:resized,
  portPolicy:policy,extraConstraint:fixed?'reference sides/positions are stronger than N1.2':'none'});
 draw(name,{positions,rects},routes);
}
start=performance.now();
// Use the declared parent tree ONLY for placement; route ALL original edges
// afterwards. This keeps ELK's tree input explicit, without dropping transversals.
const tree=fixture.nodes.filter(n=>n.parent).map(n=>({id:'parent:'+n.id,sources:[n.parent],targets:[n.id]}));
const output=await elk.layout({id:'root',children:fixture.nodes.map(n=>({id:n.id,width:metrics.get(n.id).w,height:metrics.get(n.id).h})),
 edges:tree,layoutOptions:{'elk.algorithm':'radial','elk.radial.centerOnRoot':'true'}});
const root=output.children.find(n=>n.id==='p1'),dx=root.x+root.width/2,dy=root.y+root.height/2;
const positions=new Map(output.children.map(n=>[n.id,{x:n.x+n.width/2-dx,y:n.y+n.height/2-dy}]));
const rects=new Map([...positions].map(([id,p])=>[id,ViewLayouts.rect(id,p,metrics.get(id))]));
const layoutMs=performance.now()-start;
const routed=computeInitialRoutes({...fixture,mode:'02',nodes:fixture.nodes.map(n=>({...n,...positions.get(n.id)})),
 positions:[...positions],rects:[...rects]});
const routes=new Map(routed.routes);
measure('elk-radial-plus-current-router',{positions,rects},routes,performance.now()-start,
 {layoutMs:Math.round(layoutMs),placementEdges:tree.length,routedInputEdges:fixture.edges.length,
  rootSelection:'ELK default; radial does not expose processingOrder.preferredRoot in knownOptions'});
draw('elk-radial-plus-current-router',{positions,rects},routes);
