// SVG is presentation only: it never requests new routes or layouts.
export class SvgRenderer {
 constructor({linesEl,sEl,router,edgeKey}){Object.assign(this,{linesEl,sEl,router,edgeKey});}
 draw(ordered,routes){
  this.linesEl.replaceChildren();const elements=new Map(),occupied=[];
  const compact=this.router.separation===3;
  const all=compact?[...routes.values()].flatMap(r=>r.points?this.router.allSegments(r.points):[]):[];
  for(const e of ordered){
   const key=this.edgeKey(e),rt=routes.get(key);if(!rt?.points)continue;
   const group=this.sEl('g',{'data-edge-key':key});
   const jumps=this.router.intersections(rt.points,occupied);
   if(compact)for(const p of jumps){
    let distance=Infinity;
    for(const s of all){
     const dx=Math.max(0,Math.min(s.a.x,s.b.x)-p.x,p.x-Math.max(s.a.x,s.b.x));
     const dy=Math.max(0,Math.min(s.a.y,s.b.y)-p.y,p.y-Math.max(s.a.y,s.b.y));
     const d=Math.hypot(dx,dy);if(d>.05)distance=Math.min(distance,d);
    }
    // Reserve the maximum hover stroke as well as the paper mask. A bridge
    // may shrink in a local corridor; it must not erase an adjacent route.
    p.maxRadius=Math.max(1.25,(distance-1.5)/.9);
   }
   const d=this.router.linePath(rt.points,jumps); // computes individual jump radii
   for(const point of jumps)group.append(this.sEl('circle',{cx:point.x,cy:point.y,
    r:Math.max(1.2,(point.radius||7)*.78),fill:'var(--paper)','pointer-events':'none'}));
   group.append(this.sEl('path',{d,class:'svgline'+(e.kind==='transversal'?' transverse':''),
    'data-link-from':e.from,'data-link-to':e.to}));
   this.linesEl.append(group);elements.set(key,group);
   occupied.push(...this.router.allSegments(rt.points));
  }
  return elements;
 }
}
