import {test} from 'node:test';
import assert from 'node:assert/strict';
import {GraphDocument} from '../js/core/GraphDocument.js';
function nodes(){return [
 {id:'p1',parent:null,branch:-1},{id:'a',parent:'p1',branch:0},{id:'b',parent:'p1',branch:1},
 {id:'c',parent:'p1',branch:2},{id:'d',parent:'p1',branch:3},
 {id:'a1',parent:'a',branch:0},{id:'a2',parent:'a1',branch:0}
]}
test('R01: four independent J1 branches are counted from J0',()=>{
 const state={nodes:nodes(),edges:[],focusRoot:'p1',depth:1};const g=new GraphDocument(state);
 assert.equal(g.treeChildren('p1').length,4);
 assert.deepEqual(g.treeChildren('p1').map(n=>g.readDepthMap()[n.id]),[1,1,1,1]);
});
test('H03: deep descendants of disconnected parents remain visible without invented links',()=>{
 const data=nodes().filter(n=>n.id!=='a');const state={nodes:data,edges:[],focusRoot:'p1',depth:4};
 data.find(n=>n.id==='a1').parent=null;
 const g=new GraphDocument(state),depth=g.readDepthMap();
 assert.equal(depth.a1,2);assert.equal(depth.a2,3);
 assert.ok(g.rawVisibleNodes().some(n=>n.id==='a2'));
 assert.equal(data.find(n=>n.id==='a2').parent,'a1');
});
