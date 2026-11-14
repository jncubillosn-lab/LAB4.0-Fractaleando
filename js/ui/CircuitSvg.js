import {routeCrossings} from '../geometry/CircuitGeometry.js';
import {hierarchyStrokeProfile} from './HierarchyStroke.js';

const HALO=.6,EMPHASIS=3.4;
function scaleCut(cut,scale){
 cut.setAttribute('stroke-width',Number(cut.dataset.screenStroke||cut.dataset.baseStroke)/scale);
 if(cut.dataset.overDashed==='true')cut.setAttribute('stroke-dasharray',(5/scale)+' '+(5/scale));
}
export function scaleCrossings(linesEl,scale=1){
 const safe=Math.max(.001,scale);linesEl.dataset.crossingScale=String(safe);
 for(const cut of linesEl.querySelectorAll('[data-over-edge-key]'))scaleCut(cut,safe);
}
export function emphasizeCrossings(linesEl,keys){
 for(const cut of linesEl.querySelectorAll('[data-over-edge-key]')){
  cut.dataset.screenStroke=keys.has(cut.dataset.overEdgeKey)?String(EMPHASIS):cut.dataset.baseStroke;
  scaleCut(cut,Number(linesEl.dataset.crossingScale)||1);
 }
}
export function visibleCrossings(linesEl,keys){
 for(const cut of linesEl.querySelectorAll('[data-over-edge-key]'))
  cut.style.display=keys.has(cut.dataset.overEdgeKey)?'':'none';
}

// Copy the upper stroke, including its bends and dash phase, into the lower
// route's mask. White space follows actual ink instead of a fixed screen disk.
export function drawCircuitSvg({ordered,routes,linesEl,sEl,edgeKey,mode,nodes,levels}){
 const strokeFor=hierarchyStrokeProfile({mode,nodes,levels});
 const pathData=points=>points.map((p,i)=>(i?'L ':'M ')+Number(p.x.toFixed(5))+' '+Number(p.y.toFixed(5))).join(' ');
 const entries=ordered.flatMap(e=>{const key=edgeKey(e),r=routes.get(key);return r?.points?[{e,key,r,d:pathData(r.points),cuts:[]}]:[];});
 const defs=sEl('defs'),elements=new Map(),cutsByUpper=new Map();linesEl.append(defs);
 for(let i=0;i<entries.length;i++)for(let j=0;j<i;j++){
  const events=routeCrossings(entries[i].r.points,entries[j].r.points);
  if(events.length)entries[j].cuts.push({upper:entries[i],events});
 }
 for(const [index,{e,key,r,d,cuts}] of entries.entries()){
  const group=sEl('g',{'data-edge-key':key}),points=r.points;
  const attrs={d,class:'svgline'+(e.kind==='transversal'?' transverse':''),'data-link-from':e.from,'data-link-to':e.to};
  if(mode==='02'){
   const stroke=strokeFor(e);attrs.style='--hierarchy-width:'+stroke.width;attrs['data-hierarchy-level']=stroke.depth;
  }
  if(cuts.length){
   const id='derived-crossing-'+index,mask=sEl('mask',{id,maskUnits:'userSpaceOnUse','mask-type':'luminance'});
   const l=Math.min(...points.map(p=>p.x))-128,t=Math.min(...points.map(p=>p.y))-128;
   const width=Math.max(...points.map(p=>p.x))-l+128,height=Math.max(...points.map(p=>p.y))-t+128;
   for(const [name,value] of Object.entries({x:l,y:t,width,height}))mask.setAttribute(name,value);
   mask.append(sEl('rect',{x:l,y:t,width,height,fill:'white'}));
   for(const [cutIndex,{upper,events}] of cuts.entries()){
    const clipId=id+'-window-'+cutIndex,clip=sEl('clipPath',{id:clipId,clipPathUnits:'userSpaceOnUse'});
    // Windows limit the copied stroke; the windows themselves erase nothing.
    for(const p of events)clip.append(sEl('circle',{cx:p.x,cy:p.y,r:128,'data-crossing':'true'}));
    defs.append(clip);
    const base=Number((strokeFor(upper.e).width+HALO).toFixed(3));
    const cutAttrs={d:upper.d,fill:'none',stroke:'black','stroke-width':base,'stroke-linecap':'round','stroke-linejoin':'round',
     'clip-path':'url(#'+clipId+')','data-over-edge-key':upper.key,'data-base-stroke':base};
    if(upper.e.kind==='transversal'){cutAttrs['stroke-dasharray']='5 5';cutAttrs['data-over-dashed']='true';}
    const cut=sEl('path',cutAttrs);mask.append(cut);
    if(!cutsByUpper.has(upper.key))cutsByUpper.set(upper.key,[]);cutsByUpper.get(upper.key).push(cut);
   }
   defs.append(mask);attrs.mask='url(#'+id+')';
  }
  group.append(sEl('path',attrs));linesEl.append(group);elements.set(key,group);
  const hover=active=>{for(const cut of cutsByUpper.get(key)||[]){
   cut.dataset.screenStroke=active||group.classList.contains('hierarchy-focus')?String(EMPHASIS):cut.dataset.baseStroke;
   scaleCut(cut,Number(linesEl.dataset.crossingScale)||1);
  }};
  group.addEventListener('pointerenter',()=>hover(true));
  group.addEventListener('pointerleave',()=>hover(false));
 }
 scaleCrossings(linesEl,Number(linesEl.dataset.crossingScale)||1);
 return elements;
}
