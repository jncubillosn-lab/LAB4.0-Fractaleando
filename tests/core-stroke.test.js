import {test} from 'node:test';
import assert from 'node:assert/strict';
import {RayPackingLayout} from '../js/geometry/RayPackingLayout.js';
import {hierarchyStrokeProfile} from '../js/ui/HierarchyStroke.js';

test('J0–J1 reduce a la mitad el hueco entre bordes, conservando medidas y margen físico',()=>{
 const nodes=[{id:'p1'},{id:'a',parent:'p1',branch:0}],edges=[{from:'p1',to:'a'}];
 const metrics=new Map([['p1',{w:108,h:53}],['a',{w:190,h:70}]]);
 const input={nodes,edges,metrics,nodeClearances:{p1:36,a:120},coreClearances:{p1:36,a:120}};
 const old=new RayPackingLayout().compute({...input,coreGapFactor:1});
 const packed=new RayPackingLayout().compute({...input,coreGapFactor:.5});
 const link=packed.stats.coreSpacing.links[0],previous=old.stats.coreSpacing.links[0];
 assert.ok(Math.abs(link.actualGap-previous.actualGap*.5)<.1);
 assert.equal(packed.positions.get('p1').x,0);assert.equal(packed.positions.get('p1').y,0);
 assert.equal(packed.rects.get('a').w,190);assert.equal(packed.rects.get('a').h,70);
 assert.deepEqual(metrics.get('a'),{w:190,h:70});
 const narrow=new RayPackingLayout().compute({nodes,edges,metrics});
 assert.ok(narrow.stats.coreSpacing.links[0].actualGap>=24);
});
test('el grosor aumenta suavemente hacia J0, conserva el mínimo y tiene un techo para jerarquías largas',()=>{
 const nodes=Array.from({length:6},(_,i)=>({id:'j'+i,parent:i?'j'+(i-1):null}));
 const levels=Object.fromEntries(nodes.map((n,i)=>[n.id,i]));
 const profile=hierarchyStrokeProfile({mode:'02',nodes,levels});
 const widths=nodes.slice(1).map(n=>profile({from:n.parent,to:n.id}).width);
 assert.deepEqual(widths,[2.05,1.875,1.7,1.525,1.35]);
 const deep=hierarchyStrokeProfile({mode:'02',nodes,levels:{...levels,remote:1000}});
 assert.equal(deep({from:'j0',to:'j1'}).width,2.05);
 assert.equal(profile({from:'j1',to:'j5',kind:'transversal'}).width,1.35);
 for(const mode of ['01','04'])assert.equal(hierarchyStrokeProfile({mode,nodes,levels})({from:'j0',to:'j1'}).width,2.05);
 assert.equal(hierarchyStrokeProfile({mode:'02',nodes:nodes.slice(0,2),levels:{j0:0,j1:1}})({from:'j0',to:'j1'}).width,1.35);
});
