export const NODE_FONT='Rajdhani';
let embeddedCss='';
let fontReady;

// Font bytes are local assets, also embedded in standalone SVG/PNG exports.
export function loadNodeTypography(){
 if(!fontReady)fontReady=(async()=>{
  const assets=[['600',new URL('../../css/fonts/Rajdhani-SemiBold.ttf',import.meta.url)],
   ['700',new URL('../../css/fonts/Rajdhani-Bold.ttf',import.meta.url)]];
  const licenseUrl=new URL('../../css/fonts/OFL-Rajdhani.txt',import.meta.url);
  const read=async(url,binary)=>{const r=await fetch(url);if(!r.ok)throw Error('Tipografía no disponible: '+r.status);return binary?r.arrayBuffer():r.text();};
  const [buffers,license]=await Promise.all([Promise.all(assets.map(([,url])=>read(url,true))),read(licenseUrl,false)]);
  const faces=await Promise.all(assets.map(([weight],i)=>new FontFace(NODE_FONT,buffers[i],{weight}).load()));
  faces.forEach(face=>document.fonts.add(face));
  const base64=buffer=>{const bytes=new Uint8Array(buffer);let text='';
   for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);};
  embeddedCss='/* Rajdhani — fuente local.\n'+license.replaceAll('*/','* /')+'\n*/\n'+
   assets.map(([weight],i)=>`@font-face{font-family:Rajdhani;font-style:normal;font-weight:${weight};src:url(data:font/ttf;base64,${base64(buffers[i])}) format('truetype')}`).join('\n');
 })();
 return fontReady;
}
export const exportedNodeFonts=()=>embeddedCss;

export function fitNodeLabel(text,{w,h},measure,{preferred=24,paddingX=14,paddingY=9,verticalMetrics=(s,size)=>({ascent:size*.8,descent:size*.2})}={}){
 const width=Math.max(1,w-2*paddingX),height=Math.max(1,h-2*paddingY);
 const wrap=size=>{
  const lines=[];
  for(const paragraph of String(text||' ').split(/\r?\n/)){
   let line='';
   for(const word of (paragraph.trim()||' ').split(/\s+/)){
    if(measure(word,size)>width){
     if(line){lines.push(line);line='';}
     for(const char of word){if(line&&measure(line+char,size)>width){lines.push(line);line='';}line+=char;}
    }else{
     const next=line?line+' '+word:word;
     if(line&&measure(next,size)>width){lines.push(line);line=word;}else line=next;
    }
   }
   lines.push(line||' ');
  }
  return lines;
 };
 const evaluate=size=>{const wrapped=wrap(size),metrics=wrapped.map(s=>verticalMetrics(s,size));
  const ascent=Math.max(...metrics.map(m=>m.ascent)),descent=Math.max(...metrics.map(m=>m.descent));
  const lineheight=Math.max(size*1.12,ascent+descent+2),blockHeight=(wrapped.length-1)*lineheight+ascent+descent;
  return {size,lineheight,wrapped,paddingX,paddingY,baseline:ascent-blockHeight/2,
   fits:blockHeight<=height+.001&&wrapped.every(s=>measure(s,size)<=width+.001)};};
 if(evaluate(preferred).fits)return evaluate(preferred);
 let lo=10,hi=preferred;
 for(let i=0;i<18;i++){const mid=(lo+hi)/2;if(evaluate(mid).fits)lo=mid;else hi=mid;}
 return evaluate(Math.floor(lo*10)/10);
}

export function paintNodeLabel(textEl,node,box,ctx){
 const preferred=node.id==='p1'?30:node.parent==='p1'?25:24;
 const measure=(text,size)=>{ctx.font=`700 ${size}px ${NODE_FONT},Arial,sans-serif`;return ctx.measureText(text).width;};
 const verticalMetrics=(text,size)=>{ctx.font=`700 ${size}px ${NODE_FONT},Arial,sans-serif`;const m=ctx.measureText(text);
  return {ascent:m.actualBoundingBoxAscent,descent:m.actualBoundingBoxDescent};};
 const fit=fitNodeLabel(node.text,box,measure,{preferred,verticalMetrics});
 textEl.replaceChildren();textEl.style.setProperty('--node-font-size',fit.size+'px');
 textEl.setAttribute('data-font-size',fit.size);textEl.setAttribute('data-padding-x',fit.paddingX);textEl.setAttribute('data-padding-y',fit.paddingY);
 for(const [i,line] of fit.wrapped.entries()){
  const t=textEl.ownerDocument.createElementNS('http://www.w3.org/2000/svg','tspan');
  t.setAttribute('x',0);t.setAttribute('y',fit.baseline+i*fit.lineheight);
  t.textContent=line;textEl.append(t);
 }
 return fit;
}
