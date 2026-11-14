import {routeCrossings} from '../geometry/CircuitGeometry.js';

// A crossing cuts only the lower route's own mask. It works at a vertex or
// beside a bevel without a minimum distance to either, and erases no neighbour.
export function drawCircuitSvg({ordered,routes,linesEl,sEl,edgeKey}){
 const entries=ordered.flatMap(e=>{const key=edgeKey(e),r=routes.get(key);return r?.points?[{e,key,r,cuts:[]}]:[];});
 const defs=sEl('defs'),elements=new Map();linesEl.append(defs);
 for(let i=0;i<entries.length;i++)for(let j=0;j<i;j++)
  entries[j].cuts.push(...routeCrossings(entries[i].r.points,entries[j].r.points));
 for(const [index,{e,key,r,cuts}] of entries.entries()){
  const group=sEl('g',{'data-edge-key':key}),points=r.points;
  const d=points.map((p,i)=>(i?'L ':'M ')+Number(p.x.toFixed(5))+' '+Number(p.y.toFixed(5))).join(' ');
  const attrs={d,class:'svgline'+(e.kind==='transversal'?' transverse':''),'data-link-from':e.from,'data-link-to':e.to};
  if(cuts.length){
   const id='derived-crossing-'+index,mask=sEl('mask',{id,maskUnits:'userSpaceOnUse','mask-type':'luminance'});
   const l=Math.min(...points.map(p=>p.x))-10,t=Math.min(...points.map(p=>p.y))-10;
   const width=Math.max(...points.map(p=>p.x))-l+10,height=Math.max(...points.map(p=>p.y))-t+10;
   for(const [name,value] of Object.entries({x:l,y:t,width,height}))mask.setAttribute(name,value);
   mask.append(sEl('rect',{x:l,y:t,width,height,fill:'white'}));
   for(const p of cuts)mask.append(sEl('circle',{cx:p.x,cy:p.y,r:.01,fill:'black',stroke:'black','stroke-width':7.2,
    'vector-effect':'non-scaling-stroke','data-crossing':'true'}));
   defs.append(mask);attrs.mask='url(#'+id+')';
  }
  group.append(sEl('path',attrs));linesEl.append(group);elements.set(key,group);
 }
 return elements;
}
