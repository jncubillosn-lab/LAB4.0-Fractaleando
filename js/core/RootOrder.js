// The order of branch labels is data, not a clockwise embedding. Seed the
// sectors from the actual 01 ports, retaining node/parent/branch identities.
export function orderRoots(roots,reference){
 const rank=new Map();
 for(const port of reference?.ports?.p1||[])rank.set(port.edge,rank.size);
 const key=id=>['p1',id].sort().map(encodeURIComponent).join('|');
 return [...roots].sort((a,b)=>(rank.get(key(a.id))??Infinity)-(rank.get(key(b.id))??Infinity)||
  (a.branch??0)-(b.branch??0)||a.id.localeCompare(b.id));
}
