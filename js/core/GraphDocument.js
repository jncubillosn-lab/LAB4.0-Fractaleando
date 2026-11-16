/**
 * Modelo de lectura del documento compartido por las tres representaciones.
 * parent define la jerarquía; una conexión transversal no cambia el parentesco.
 * Los índices se obtienen del estado actual para que editar, importar o deshacer
 * no reutilice una jerarquía obsoleta. Los huérfanos y ciclos heredados se muestran
 * sin inventar relaciones para hacerlos encajar en un árbol.
 */
// J0/Jn domain, independent from SVG and routing. Build each traversal's
// index from current data; mutable document arrays must never leave stale caches.
export class GraphDocument {
  constructor(state) { this.state = state; }
  nodeById(id) { return this.state.nodes.find(node => node.id === id); }
  linksOf(id) { return this.state.edges.filter(edge => edge.from === id || edge.to === id); }
  treeChildren(id, branch) {
    return this.state.nodes.filter(node => node.parent === id && (branch === undefined || node.branch === branch));
  }
  index() {
    const byId = new Map(), children = new Map();
    for (const node of this.state.nodes) {
      byId.set(node.id, node);
      if (!children.has(node.parent)) children.set(node.parent, []);
      children.get(node.parent).push(node);
    }
    return {byId, children};
  }
  depthMap() {
    const {byId} = this.index(), levels = Object.create(null);
    for (const node of this.state.nodes) {
      if (Object.hasOwn(levels, node.id)) continue;
      const trail = [], seen = new Set();
      let id = node.id, value;
      while (true) {
        if (Object.hasOwn(levels, id)) { value = levels[id]; break; }
        if (seen.has(id) || !byId.has(id)) { value = Infinity; break; }
        const current = byId.get(id);
        if (id === 'p1' || !current.parent) {
          value = id === 'p1' ? 0 : 2; levels[id] = value; break;
        }
        seen.add(id); trail.push(id); id = current.parent;
      }
      for (let i = trail.length - 1; i >= 0; i--) levels[trail[i]] = ++value;
    }
    return levels;
  }
  // Orphans and legacy cycles remain data, without invented parent links.
  readDepthMap() {
    const {byId, children} = this.index();
    const root = byId.has(this.state.focusRoot) ? this.state.focusRoot : 'p1';
    const levels = Object.create(null), queue = [root];
    let head = 0;
    levels[root] = 0;
    const visit = () => {
      while (head < queue.length) {
        const id = queue[head++];
        for (const child of children.get(id) || []) if (!Object.hasOwn(levels, child.id)) {
          levels[child.id] = levels[id] + 1; queue.push(child.id);
        }
      }
    };
    visit();
    if (root === 'p1') {
      for (const node of this.state.nodes) {
        if (!Object.hasOwn(levels, node.id) && (!node.parent || !byId.has(node.parent))) {
          levels[node.id] = 2; queue.push(node.id);
        }
      }
      visit();
      for (const node of this.state.nodes) if (!Object.hasOwn(levels, node.id)) {
        levels[node.id] = 2; queue.push(node.id); visit();
      }
    }
    return levels;
  }
  maximumDepth() {
    const levels = this.readDepthMap();
    let maximum = 0;
    for (const node of this.state.nodes) if (Number.isFinite(levels[node.id])) maximum = Math.max(maximum, levels[node.id]);
    return maximum;
  }
  rawVisibleNodes() {
    const levels = this.readDepthMap();
    return this.state.nodes.filter(node => Number.isFinite(levels[node.id]) && levels[node.id] <= this.state.depth);
  }
  currentNodes() { this.state.contextActive = false; return this.rawVisibleNodes(); }
}
