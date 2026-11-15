import {poetryQuotes} from '../data/PoetryQuotes.js';

export function bindPoetryCarousel(root,{quotes=poetryQuotes,intervalMs=24000,random=Math.random,
 setTimer=(fn,ms)=>setTimeout(fn,ms),clearTimer=id=>clearTimeout(id)}={}) {
 const doc=root.ownerDocument,motion=doc.defaultView.matchMedia('(prefers-reduced-motion: reduce)');
 const original=root.querySelector('[data-poem-original]'),translation=root.querySelector('[data-poem-translation]');
 const translated=root.querySelector('[data-poem-translated]'),author=root.querySelector('[data-poem-author]');
 const source=root.querySelector('[data-poem-source]'),count=root.querySelector('[data-poem-count]');
 const slide=root.querySelector('[data-poem-slide]'),pause=root.querySelector('[data-poem-pause]');
 let index=Math.floor(random()*quotes.length),paused=motion.matches,hovered=false,focused=false,timer=null,disposed=false;
 const events=[];
 const listen=(target,name,fn)=>{target.addEventListener(name,fn);events.push([target,name,fn]);};
 function schedule(){
  if(timer!==null)clearTimer(timer);timer=null;
  if(!disposed&&!paused&&!hovered&&!focused&&!doc.hidden)
   timer=setTimer(()=>{index=(index+1)%quotes.length;draw();},intervalMs);
 }
 function draw(){
  const q=quotes[index];
  original.textContent=q.original;original.lang=q.lang;original.setAttribute('cite',q.source);
  translation.textContent=q.translation||'';translated.hidden=!q.translation;
  author.textContent=q.author+' · '+q.title;source.href=q.source;
  source.setAttribute('aria-label','Leer '+q.title+' de '+q.author+' en su fuente');
  count.textContent=(index+1)+' / '+quotes.length;slide.setAttribute('aria-label','Cita '+(index+1)+' de '+quotes.length);
  pause.textContent=paused?'Reproducir':'Pausar';pause.setAttribute('aria-pressed',String(paused));
  schedule();
 }
 listen(root.querySelector('[data-poem-prev]'),'click',()=>{index=(index+quotes.length-1)%quotes.length;draw();});
 listen(root.querySelector('[data-poem-next]'),'click',()=>{index=(index+1)%quotes.length;draw();});
 listen(pause,'click',()=>{paused=!paused;draw();});
 listen(root,'mouseenter',()=>{hovered=true;schedule();});
 listen(root,'mouseleave',()=>{hovered=false;schedule();});
 listen(root,'focusin',()=>{focused=true;schedule();});
 listen(root,'focusout',event=>{if(!root.contains(event.relatedTarget)){focused=false;schedule();}});
 listen(doc,'visibilitychange',schedule);
 listen(motion,'change',event=>{if(event.matches){paused=true;draw();}});
 draw();
 return {dispose(){disposed=true;schedule();for(const [target,name,fn] of events)target.removeEventListener(name,fn);}};
}
