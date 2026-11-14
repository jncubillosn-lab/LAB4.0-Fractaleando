export const LINK_PATTERNS={solid:null,dotted:'0 5',dashed:'7 5'};
export const validLinkStyle=style=>Object.hasOwn(LINK_PATTERNS,style);
export function linkStyle(edge){
 return validLinkStyle(edge.style)?edge.style:edge.kind==='transversal'?'dashed':'solid';
}
export const linkPattern=edge=>LINK_PATTERNS[linkStyle(edge)];
