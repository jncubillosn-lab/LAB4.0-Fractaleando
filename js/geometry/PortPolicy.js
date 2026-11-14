// Reserve the rounded corners and favour the useful middle of each face.
export function portInset(rect,side){
 const length=side==='top'||side==='bottom'?rect.w:rect.h;
 return Math.min(length/2-5,Math.max(18,Math.min(36,length*.2)));
}
export function portClearOfCorners(port,rect){
 const inset=portInset(rect,port.side)-.001;
 return port.side==='top'||port.side==='bottom'?port.x>=rect.l+inset&&port.x<=rect.r-inset:
  port.y>=rect.t+inset&&port.y<=rect.b-inset;
}
