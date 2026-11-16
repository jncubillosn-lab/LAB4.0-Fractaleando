/**
 * Fuente fija y cuadros adaptables: las palabras se mantienen completas.
 * Se miden ambos pesos de Rajdhani para que seleccionar no corte el texto.
 * La caché pertenece al contexto de medición y tiene un límite de tamaño.
 * Al cargar la fuente real se eliminan las medidas del tipo de respaldo.
 * Los mismos bytes de fuente se incorporan a los archivos exportados.
 */
export const NODE_FONT='Rajdhani';
export const NODE_FONT_SIZE=24;
let embeddedCss='';
let fontReady;
let measurementCaches=new WeakMap();
const MEASUREMENT_LIMIT=2048;

function measurementsFor(ctx){
 // Include settings that can affect Canvas metrics, rather than reusing a
 // measurement after a caller changes its text context.
 const settings=[ctx.direction,ctx.fontKerning,ctx.fontStretch,ctx.fontVariantCaps,
  ctx.letterSpacing,ctx.wordSpacing,ctx.textRendering,ctx.textBaseline,ctx.textAlign,ctx.lang].join('|');
 let entry=measurementCaches.get(ctx);
 if(!entry||entry.settings!==settings){entry={settings,values:new Map()};measurementCaches.set(ctx,entry);}
 return (text,size)=>{
  const key=size+'\0'+text,cached=entry.values.get(key);if(cached)return cached;
  const both=['600','700'].map(weight=>{ctx.font=`${weight} ${size}px ${NODE_FONT},Arial,sans-serif`;return ctx.measureText(text);});
  const value={width:Math.max(...both.map(m=>m.width)),ascent:Math.max(...both.map(m=>m.actualBoundingBoxAscent)),
   descent:Math.max(...both.map(m=>m.actualBoundingBoxDescent))};
  // Bound memory during long editing sessions; oversized text is measured
  // normally without retaining its intermediate strings.
  if(text.length<=512){if(entry.values.size>=MEASUREMENT_LIMIT)entry.values.delete(entry.values.keys().next().value);entry.values.set(key,value);}
  return value;
 };
}

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
  measurementCaches=new WeakMap(); // Drop any fallback-font measurements.
  const base64=buffer=>{const bytes=new Uint8Array(buffer);let text='';
   for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text);};
  embeddedCss='/* Rajdhani — fuente local.\n'+license.replaceAll('*/','* /')+'\n*/\n'+
   assets.map(([weight],i)=>`@font-face{font-family:Rajdhani;font-style:normal;font-weight:${weight};src:url(data:font/ttf;base64,${base64(buffers[i])}) format('truetype')}`).join('\n');
 })();
 return fontReady;
}
export const exportedNodeFonts=()=>embeddedCss;

export function fitNodeLabel(text,{w,h=53},measure,{paddingX=14,paddingY=9,growToWords=true,verticalMetrics=(s,size)=>({ascent:size*.8,descent:size*.2})}={}){
 const size=NODE_FONT_SIZE;
 // A word defines the minimum box width. Keep the requested width for
 // wrapping phrases, but never split a word to satisfy that preference.
 if(growToWords)w=Math.ceil(Math.max(w,2*paddingX,...String(text||' ').split(/\s+/).map(word=>measure(word,size)+2*paddingX)));
 const width=Math.max(1,w-2*paddingX);
 const wrap=size=>{
  const lines=[];
  for(const paragraph of String(text||' ').split(/\r?\n/)){
   let line='';
   for(const word of (paragraph.trim()||' ').split(/\s+/)){
    // The old character wrapping is used only to read earlier checkpoints.
    if(!growToWords&&measure(word,size)>width){
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
 const wrapped=wrap(size),metrics=wrapped.map(s=>verticalMetrics(s,size));
 const ascent=Math.max(...metrics.map(m=>m.ascent)),descent=Math.max(...metrics.map(m=>m.descent));
 const lineheight=Math.max(size*1.12,ascent+descent+2),blockHeight=(wrapped.length-1)*lineheight+ascent+descent;
 return {w,h:Math.ceil(Math.max(h,blockHeight+2*paddingY)),size,lineheight,wrapped,paddingX,paddingY,
  baseline:ascent-blockHeight/2,fits:wrapped.every(s=>measure(s,size)<=width+.001)};
}

export function nodeGeometry(node,ctx,box={w:node.width,h:node.id==='p1'?67:53},{growToWords=true}={}){
 const metrics=measurementsFor(ctx),measure=(text,size)=>metrics(text,size).width;
 const verticalMetrics=(text,size)=>metrics(text,size);
 return fitNodeLabel(node.text,box,measure,{verticalMetrics,growToWords});
}
export function paintNodeLabel(textEl,node,box,ctx){
 const fit=nodeGeometry(node,ctx,box);
 textEl.replaceChildren();textEl.style.setProperty('--node-font-size',fit.size+'px');
 textEl.setAttribute('data-font-size',fit.size);textEl.setAttribute('data-padding-x',fit.paddingX);textEl.setAttribute('data-padding-y',fit.paddingY);
 for(const [i,line] of fit.wrapped.entries()){
  const t=textEl.ownerDocument.createElementNS('http://www.w3.org/2000/svg','tspan');
  t.setAttribute('x',0);t.setAttribute('y',fit.baseline+i*fit.lineheight);
  t.textContent=line;textEl.append(t);
 }
 return fit;
}
