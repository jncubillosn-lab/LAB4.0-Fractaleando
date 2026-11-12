// Simplificación geométrica ACOTADA de polilíneas transportadas.
// No es un reenrutador y no decide validez: la ruta simplificada debe pasar
// auditoría independiente de cajas, puertos y sucesión de cruces.
export function simplifyTransferredPolyline(points,epsilon=.25){
 if(!Array.isArray(points)||points.length<3)return points;
 const square=epsilon*epsilon,kept=new Uint8Array(points.length);
 kept[0]=1;kept[points.length-1]=1;
 const stack=[[0,points.length-1]];
 while(stack.length){
  const [a,b]=stack.pop(),p=points[a],q=points[b],
   dx=q.x-p.x,dy=q.y-p.y,len2=dx*dx+dy*dy;
  let max=0,where=-1;
  for(let i=a+1;i<b;i++){
   const r=points[i],t=len2>1e-12?
    Math.max(0,Math.min(1,((r.x-p.x)*dx+(r.y-p.y)*dy)/len2)):0;
   const x=p.x+t*dx,y=p.y+t*dy,
    d=(r.x-x)**2+(r.y-y)**2;
   if(d>max){max=d;where=i;}
  }
  if(max>square&&where>a&&where<b){
   kept[where]=1;stack.push([a,where],[where,b]);
  }
 }
 return points.filter((p,i)=>kept[i]);
}
