// Initial Editor placement. Receives measured dimensions; no DOM, routing
// or persistent document mutation. Kept separate from edit reconciliation.
export function layoutPlane(visible,geometry){
 const byId=new Map(visible.map(n=>[n.id,n]));
 const metrics=new Map(visible.map(n=>[n.id,geometry(n)]));
 const children=new Map(visible.map(n=>[n.id,[]]));
 for(const n of visible)if(n.parent&&children.has(n.parent)&&n.id!==n.parent)children.get(n.parent).push(n);
 const topRoots=children.get('p1')||[];
 const positions=new Map();
 if(byId.has('p1'))positions.set('p1',{x:0,y:-214});
 let branchStart=0;
 for(const root of topRoots){
  // Las profundidades definen COLUMNAS, nunca órbitas: 01 sigue siendo plano.
  const bands=new Map();const walked=new Set();
  function record(node,level){if(walked.has(node.id))return;walked.add(node.id);const old=bands.get(level)||{w:0,count:0};old.w=Math.max(old.w,metrics.get(node.id).w);old.count++;bands.set(level,old);for(const c of children.get(node.id)||[])record(c,level+1);}
  record(root,0);
  const columns=[0];for(let i=1;i<bands.size;i++){
   const a=bands.get(i-1),b=bands.get(i);const channel=Math.max(104,Math.min(230,50+a.count*7));
   columns[i]=columns[i-1]+a.w/2+b.w/2+channel;
  }
  const extRight=Math.max(...[...bands].map(([j,b])=>columns[j]+b.w/2),metrics.get(root.id).w/2);
  const extLeft=-metrics.get(root.id).w/2;
  const xBase=branchStart-extLeft;
  const minLeafPitch=70;
  const heightMemo=new Map();
  function measure(n,trail=new Set()){
   if(heightMemo.has(n.id))return heightMemo.get(n.id);
   if(trail.has(n.id))return minLeafPitch;
   trail.add(n.id);const ch=children.get(n.id)||[];
   const own=Math.max(minLeafPitch,metrics.get(n.id).h+18);
   const childHeight=ch.length?ch.reduce((s,c)=>s+measure(c,trail),0)+(ch.length-1)*22:0;
   trail.delete(n.id);const out=Math.max(own,childHeight);heightMemo.set(n.id,out);return out;
  }
  // El origen de la rama queda arriba; las generaciones crecen por debajo.
  positions.set(root.id,{x:xBase,y:36});
  let cursor=270;
  const visit=new Set([root.id]);
  function put(n,level,top){
   if(visit.has(n.id))return;visit.add(n.id);
   const h=measure(n);positions.set(n.id,{x:xBase+columns[level],y:top+h/2});
   let yy=top;for(const c of children.get(n.id)||[]){const sub=measure(c);put(c,level+1,yy);yy+=sub+22;}
  }
  for(const c of children.get(root.id)||[]){const h=measure(c);put(c,1,cursor);cursor+=h+24;}
  branchStart+=extRight-extLeft+190;
 }
 // Los conceptos huérfanos se conservan sin inventar nuevas relaciones.
 const orphans=visible.filter(n=>!positions.has(n.id));
 if(orphans.length){let xx=branchStart+140,yy=36;for(const n of orphans){positions.set(n.id,{x:xx,y:yy});yy+=metrics.get(n.id).h+40;}}
 const entries=[...positions].map(([id,p])=>({id,...p,...metrics.get(id)}));
 if(!entries.length)return {positions,metrics,rects:new Map()};
 const left=Math.min(...entries.map(p=>p.x-p.w/2)),right=Math.max(...entries.map(p=>p.x+p.w/2));
 const mid=(left+right)/2;
 // Mover el núcleo a la mitad de las tres ramas (o las que existan).
 if(byId.has('p1')){const r=topRoots.length?positions.get(topRoots[Math.floor((topRoots.length-1)/2)].id).x:mid;positions.get('p1').x=r;}
 const rects=new Map();
 for(const [id,p] of positions){p.x-=mid;const m=metrics.get(id);rects.set(id,{id,x:p.x,y:p.y,w:m.w,h:m.h,l:p.x-m.w/2,r:p.x+m.w/2,t:p.y-m.h/2,b:p.y+m.h/2});}
 return {positions,metrics,rects};
}
