// Identity is independent of labels, geometry and direction of an edge.
export const edgeKey = edge => [edge.from, edge.to].sort().map(encodeURIComponent).join('|');

export function ownValue(record, key, fallback) {
  return record && Object.hasOwn(record, key) ? record[key] : fallback;
}

export function nodeSerial(nodes, suggested = 0) {
  let serial = Number.isSafeInteger(suggested) && suggested >= 0 ? suggested : 0;
  for (const node of nodes) {
    const match = /^n([0-9]+)$/.exec(node.id);
    const value = match ? Number(match[1]) : 0;
    if (Number.isSafeInteger(value)) serial = Math.max(serial, value);
  }
  return serial;
}

export function allocateNodeId(state) {
  const used = new Set(state.nodes.map(node => node.id));
  let serial = nodeSerial(state.nodes, state.idSerial);
  do {
    serial = serial >= Number.MAX_SAFE_INTEGER ? 1 : serial + 1;
  } while (used.has('n' + serial));
  state.idSerial = serial;
  return 'n' + serial;
}
