import {test} from 'node:test';
import assert from 'node:assert/strict';
import {PcbRouter} from '../js/geometry/PcbRouter.js';
import {GeometryValidator} from '../js/geometry/GeometryValidator.js';
const state={nodes:[],edges:[]};
const router=new PcbRouter({state,nodeById:id=>state.nodes.find(n=>n.id===id),clamp:(v,a,b)=>Math.max(a,Math.min(b,v))});
const overlap=(a,b,g=16)=>a.l<b.r+g&&a.r>b.l-g&&a.t<b.b+g&&a.b>b.t-g;
const validator=new GeometryValidator({router,rectOverlap:overlap});
const rects=[{id:'a',x:0,y:0,w:60,h:50,l:-30,r:30,t:-25,b:25},
 {id:'b',x:200,y:0,w:60,h:50,l:170,r:230,t:-25,b:25}];
const a=router.portStub;
const fromPort={side:'right',x:30,y:0,sx:30+a,sy:0},toPort={side:'left',x:170,y:0,sx:170-a,sy:0};
const route={edge:{from:'a',to:'b'},fromPort,toPort,points:[{x:30,y:0},{x:170,y:0}]};
test('DRC: validates continuous path and its actual terminal ports',()=>{
 assert.equal(validator.validateRoute(route,rects).ok,true);
});
test('H02: catches disconnected first point even when segments avoid boxes',()=>{
 assert.equal(validator.validateRoute({...route,points:[{x:70,y:0},{x:170,y:0}]},rects).ok,false);
});
test('H02: rejects ports that do not belong to their node perimeter',()=>{
 assert.equal(validator.validateRoute({...route,fromPort:{...fromPort,x:75,sx:94}},rects).ok,false);
});
test('R04: repeated ports are rejected',()=>{
 assert.equal(validator.validateRoute(route,rects,[],new Map([['a',[fromPort]]])).ok,false);
});
