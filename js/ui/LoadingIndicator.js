// Each operation owns its handle. A cancelled/late calculation cannot hide
// another operation's indicator. The bar is indeterminate: no guessed percent.
export function createLoadingIndicator({panel,stage,requestFrame=fn=>requestAnimationFrame(fn)}) {
 const jobs=new Map();
 const title=panel.querySelector('[data-loading-title]');
 const detail=panel.querySelector('[data-loading-detail]');
 const bar=panel.querySelector('[role="progressbar"]');
 const render=()=>{
  const current=[...jobs.values()].at(-1);
  panel.hidden=!current;
  stage.setAttribute('aria-busy',String(Boolean(current)));
  if(current){title.textContent=current.title;detail.textContent=current.detail;bar.setAttribute('aria-valuetext',current.detail);}
 };
 return {
  begin(label,message='Calculando el diagrama…') {
   const key=Symbol(),job={title:label,detail:message};jobs.set(key,job);render();
   return {
    update(message){if(jobs.has(key)){job.detail=message;render();}},
    finish(){jobs.delete(key);render();},
    paint(){return new Promise(resolve=>requestFrame(()=>requestFrame(resolve)));}
   };
  }
 };
}
