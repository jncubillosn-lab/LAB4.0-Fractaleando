import {nodeSerial} from './GraphIdentity.js';

export function captureEditorState(state, geometry = {}) {
  return JSON.stringify({nodes: state.nodes, edges: state.edges, selected: state.selected,
    idSerial: state.idSerial, depth: state.depth, focusRoot: state.focusRoot,
    linkStyle: state.linkStyle, ...geometry});
}

export function restoreEditorState(state, snapshot) {
  state.nodes = snapshot.nodes;
  state.edges = snapshot.edges;
  const ids = new Set(state.nodes.map(node => node.id));
  state.selected = ids.has(snapshot.selected) ? snapshot.selected : 'p1';
  state.focusRoot = ids.has(snapshot.focusRoot) ? snapshot.focusRoot : 'p1';
  const currentSerial = Number.isSafeInteger(state.idSerial) ? state.idSerial : 0;
  state.idSerial = nodeSerial(state.nodes, Math.max(currentSerial, snapshot.idSerial || 0));
  if (Number.isFinite(snapshot.depth)) state.depth = snapshot.depth;
  state.linkStyle = snapshot.linkStyle ?? 'solid';
  state.linkFrom = null;
  state.unlinkFrom = null;
}
