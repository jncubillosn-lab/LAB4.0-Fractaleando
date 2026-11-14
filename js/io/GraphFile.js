import {validLinkStyle} from '../ui/LinkStyles.js';

// Validate the existing file contract before the UI replaces a document.
// Legacy files without a schema/checkpoint remain supported.
export function parseGraphFile(text) {
  const data = JSON.parse(text);
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    throw new Error('Formato de grafo no reconocido');
  }
  const byId = new Map();
  for (const node of data.nodes) {
    if (!node || typeof node.id !== 'string' || typeof node.text !== 'string' ||
        !Number.isFinite(node.width) || node.width < 90 || node.width > 500 ||
        !Number.isInteger(node.branch) || node.branch < -1 ||
        !Number.isFinite(node.x) || !Number.isFinite(node.y)) {
      throw new Error('Hay nodos, conexiones o vínculos del núcleo inválidos.');
    }
    if (byId.has(node.id)) throw new Error('Debe existir un núcleo P1 único.');
    byId.set(node.id, node);
  }
  if (!byId.has('p1')) throw new Error('Debe existir un núcleo P1 único.');
  const coreChildren = new Set();
  for (const edge of data.edges) {
    if (!edge || !byId.has(edge.from) || !byId.has(edge.to) ||
        (edge.style !== undefined && !validLinkStyle(edge.style)) ||
        edge.to === 'p1' || (edge.from === 'p1' && byId.get(edge.to).parent !== 'p1')) {
      throw new Error('Hay nodos, conexiones o vínculos del núcleo inválidos.');
    }
    if (edge.from === 'p1') coreChildren.add(edge.to);
  }
  for (const node of data.nodes) {
    if ((node.parent != null && !byId.has(node.parent)) ||
        (node.parent === 'p1' && !coreChildren.has(node.id))) {
      throw new Error('Hay nodos, conexiones o vínculos del núcleo inválidos.');
    }
  }
  return data;
}

// Optional geometry is untrusted cache data, not a reason to discard concepts.
export function checkpointHasRecords(checkpoint) {
  return Boolean(checkpoint && checkpoint.version === 1 &&
    Array.isArray(checkpoint.positions) && checkpoint.positions.every(p => p && typeof p.id === 'string') &&
    Array.isArray(checkpoint.routes) && checkpoint.routes.every(r => r && typeof r.key === 'string' &&
      (r.points === null || Array.isArray(r.points) && r.points.every(p => p && Number.isFinite(p.x) && Number.isFinite(p.y)))));
}
