import {drawCircuitSvg} from './CircuitSvg.js';
// Every view uses the same paths, proportional crossing masks and line styles.
// SVG is presentation only: it never requests routes or changes checkpoints.
export class SvgRenderer {
 constructor({linesEl,sEl,router,edgeKey}){Object.assign(this,{linesEl,sEl,router,edgeKey});}
 draw(ordered,routes,styleContext={}){
  this.linesEl.replaceChildren();
  return drawCircuitSvg({...this,...styleContext,ordered,routes});
 }
}
