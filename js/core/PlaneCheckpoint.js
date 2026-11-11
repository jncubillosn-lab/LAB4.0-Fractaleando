// Mutable, revisioned geometry of the active diagram, independent of UI DOM.
export class PlaneCheckpoint {
 constructor(){this.reset();}
 reset(){
  this.positions=new Map();this.metrics=new Map();this.rects=new Map();
  this.routes=new Map();this.nodeEls=new Map();this.routeEls=new Map();
  this.retired=new Map();this.revision=0;this.ready=false;
 }
 snapshot(){
  if(!this.ready)return null;
  return {version:1,
   positions:[...this.positions].map(([id,p])=>({id,x:p.x,y:p.y})),
   routes:[...this.routes].map(([key,r])=>({key,points:r.points,fromPort:r.fromPort||null,toPort:r.toPort||null}))};
 }
}
