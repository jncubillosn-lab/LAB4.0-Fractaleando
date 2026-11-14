import {drawCircuitSvg} from './CircuitSvg.js';
import {hierarchyStrokeProfile} from './HierarchyStroke.js';
// SVG is presentation only: it never requests new routes or layouts.
export class SvgRenderer {
 constructor({linesEl,sEl,router,edgeKey}){Object.assign(this,{linesEl,sEl,router,edgeKey});}
 draw(ordered,routes,styleContext={}){
  this.linesEl.replaceChildren();const elements=new Map(),occupied=[];
  if(this.router.circuit45)return drawCircuitSvg({...this,...styleContext,ordered,routes});
  const strokeFor=hierarchyStrokeProfile(styleContext);
  for(const e of ordered){
   const key=this.edgeKey(e),rt=routes.get(key);if(!rt?.points)continue;
   const group=this.sEl('g',{'data-edge-key':key});
   const jumps=this.router.intersections(rt.points,occupied);
   const d=this.router.linePath(rt.points,jumps); // computes individual jump radii
   for(const point of jumps)group.append(this.sEl('circle',{cx:point.x,cy:point.y,
    r:Math.max(1.2,(point.radius||7)*.78),fill:'var(--paper)','pointer-events':'none'}));
   group.append(this.sEl('path',{d,class:'svgline'+(e.kind==='transversal'?' transverse':''),
    style:'--hierarchy-width:'+strokeFor(e).width,'data-hierarchy-level':strokeFor(e).depth,
    'data-link-from':e.from,'data-link-to':e.to}));
   this.linesEl.append(group);elements.set(key,group);
   occupied.push(...this.router.allSegments(rt.points));
  }
  return elements;
 }
}
