import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allocateNodeId,nodeSerial} from '../js/core/GraphIdentity.js';
import {captureEditorState,restoreEditorState} from '../js/core/EditorHistory.js';

test('importar, deshacer y crear repetidamente conserva IDs únicos y el contexto de edición',()=>{
 const state={nodes:[{id:'p1'},{id:'n1'}],edges:[],selected:'n1',idSerial:1,depth:5,focusRoot:'p1',linkStyle:'dotted'};
 for(let i=0;i<4;i++){
  const frame=JSON.parse(captureEditorState(state,{planeCheckpoint:{version:1,positions:[{id:'p1',x:80,y:900}]}}));
  state.nodes=[{id:'p1'}];state.idSerial=0;state.depth=0;state.selected='p1';state.linkStyle='solid';
  restoreEditorState(state,frame);
  assert.equal(state.depth,5);assert.equal(state.linkStyle,'dotted');
  assert.equal(frame.planeCheckpoint.positions[0].y,900);
  const id=allocateNodeId(state);assert.ok(!state.nodes.some(node=>node.id===id));state.nodes.push({id});
  assert.equal(new Set(state.nodes.map(n=>n.id)).size,state.nodes.length);
 }
});
test('el asignador resiste contadores atrasados, IDs numéricos extremos y snapshots heredados',()=>{
 const state={nodes:[{id:'p1'},{id:'n1'},{id:'n9'}],edges:[],idSerial:0};
 assert.equal(allocateNodeId(state),'n10');
 restoreEditorState(state,{nodes:[{id:'p1'},{id:'n20'}],edges:[],selected:'n20'});
 assert.equal(allocateNodeId(state),'n21');
 state.nodes.push({id:'n'+Number.MAX_SAFE_INTEGER},{id:'n1'},{id:'n9007199254740992'});
 state.idSerial=Number.MAX_SAFE_INTEGER;
 assert.equal(allocateNodeId(state),'n2');
 assert.equal(nodeSerial([{id:'n9007199254740992'}]),0);
});
