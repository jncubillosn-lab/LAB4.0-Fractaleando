import {test} from 'node:test';
import assert from 'node:assert/strict';
import {reflectedEntry,routeFacingLink} from '../js/geometry/FacingPorts.js';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';

const box=(id,x,y,w=180,h=53)=>({id,x,y,w,h,l:x-w/2,r:x+w/2,t:y-h/2,b:y+h/2});
function port(r,side,fraction){
 const f=Math.max(.08,Math.min(.92,fraction)),p={side};
 if(side==='top'||side==='bottom'){p.x=r.l+f*r.w;p.y=side==='top'?r.t:r.b;p.sx=p.x;p.sy=p.y+(side==='top'?-19:19);}
 else{p.x=side==='left'?r.l:r.r;p.y=r.t+f*r.h;p.sx=p.x+(side==='left'?-19:19);p.sy=p.y;}
 return p;
}
const ports=r=>['top','right','bottom','left'].flatMap(side=>[.5,.34,.66,.22,.78,.12,.88,.42,.58].map(f=>port(r,side,f)));
const opposite={top:'bottom',bottom:'top',left:'right',right:'left'};
const length=points=>points.slice(1).reduce((sum,p,i)=>sum+Math.abs(p.x-points[i].x)+Math.abs(p.y-points[i].y),0);
function context(hour){
 const a=box('parent',0,0,190),angle=hour*Math.PI/6-Math.PI/2;
 const b=box('child',450*Math.cos(angle),450*Math.sin(angle)),nodes=[{id:a.id,x:a.x,y:a.y},{id:b.id,parent:a.id,x:b.x,y:b.y}];
 const edge={from:a.id,to:b.id};
 const router=new PcbRouter({state:{nodes,edges:[edge]},nodeById:id=>nodes.find(n=>n.id===id),clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
 const options={edge,a,b,fromPorts:ports(a),toPorts:ports(b),makePort:port,router,obstacles:[a,b],occupied:[]};
 return {a,b,edge,router,options};
}
test('la reflexión cambia cara y posición relativa: salida a las 2, entrada a las 8',()=>{
 const a=box('a',0,0,190),b=box('b',300,-150,225);
 const input=reflectedEntry(port(a,'right',.25),a,b,port);
 assert.equal(input.side,'left');assert.ok(Math.abs((input.y-b.t)/b.h-.75)<1e-9);
 const top=reflectedEntry(port(a,'top',.8),a,b,port);
 assert.equal(top.side,'bottom');assert.ok(Math.abs((top.x-b.l)/b.w-.2)<1e-9);
});
test('doce direcciones eligen entradas enfrentadas y rutas cortas auditadas',()=>{
 const sides=new Set();
 for(let hour=0;hour<12;hour++){
  const {a,b,edge,router,options}=context(hour),r=routeFacingLink(options);
  assert.ok(r,'hora '+hour);assert.equal(r.toPort.side,opposite[r.fromPort.side],'hora '+hour);sides.add(r.toPort.side);
  assert.ok(r.points.length<=4,'hora '+hour+': '+JSON.stringify(r.points));
  assert.ok(length(r.points)<=Math.abs(b.x-a.x)+Math.abs(b.y-a.y)+.01);
  const validator=new GeometryValidator({router,rectOverlap:()=>false});
  assert.equal(validator.validateRoute({...r,edge},[a,b]).ok,true,'hora '+hour);
  if(hour%3===0)assert.equal(r.points.length,2,'hora cardinal '+hour);
 }
 assert.equal(sides.size,4);
});
test('un hijo debajo recibe por arriba y elimina el rodeo de la entrada izquierda',()=>{
 const {b,router,options}=context(6),r=routeFacingLink(options);
 const old=router.routeEdge({...r.fromPort,id:'parent'},{...port(b,'left',.5),id:'child'},options.obstacles,[]);
 assert.equal(r.fromPort.side,'bottom');assert.equal(r.toPort.side,'top');
 assert.equal(r.points.length,2);assert.ok(old&&length(r.points)<length(old.points));
});
test('una entrada reflejada ocupada no se reutiliza ni fija las siguientes a la izquierda',()=>{
 const {a,b,options}=context(0),usedFrom=[port(a,'top',.5)],usedTo=[port(b,'bottom',.5)];
 const r=routeFacingLink({...options,usedFrom,usedTo});
 assert.ok(r);assert.equal(r.fromPort.side,'top');assert.equal(r.toPort.side,'bottom');
 assert.ok(Math.hypot(r.toPort.x-usedTo[0].x,r.toPort.y-usedTo[0].y)>=11);
 assert.ok(Math.hypot(r.fromPort.x-usedFrom[0].x,r.fromPort.y-usedFrom[0].y)>=11);
});
