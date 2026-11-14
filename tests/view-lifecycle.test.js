import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DerivedViews} from '../js/views/DerivedViews.js';
import {RadialLayout} from '../js/geometry/RadialLayout.js';

test('reiniciar desde una derivada restablece también el modo interno del Editor', () => {
  const view = Object.create(DerivedViews.prototype), events = [];
  Object.assign(view, {mode: '04', version: 2, workerTask: {cancel: () => events.push('cancel')},
    cache: new Map([['02', {}]]), current: {}, staged: {}, graphIdentity: 'old', rejected: {},
    derivedLines: {replaceChildren() {}}, derivedNodes: {replaceChildren() {}},
    switchVisibility: mode => events.push(mode), updateLabels() {}, status() {}});
  view.reset();
  assert.equal(view.mode, '01'); assert.equal(view.version, 3);
  assert.equal(view.current, null); assert.equal(view.cache.size, 0);
  assert.deepEqual(events, ['cancel', '01']);
});
test('una caché derivada ilegible se descarta y permite calcular la vista', async () => {
  const view = Object.create(DerivedViews.prototype), nodes = [{id: 'p1'}], edges = [];
  let computations = 0, draws = 0;
  Object.assign(view, {version: 0, mode: '01', state: {nodes, edges}, plane: {ready: true, positions: new Map()},
    workerTask: {cancel() {}}, cache: new Map(), staged: {'02': {}},
    graphKey: () => 'graph', sourceKey: () => 'source', referenceKey: () => 'reference',
    switchVisibility() {}, updateLabels() {}, status() {}, metrics: () => new Map(),
    tryRestore() { throw new Error('Incomplete cache'); },
    async computeScene() { computations++; return {layout: {stats: {graphSignature: RadialLayout.signature(nodes, edges)}}}; },
    snapshot: () => ({valid: true}), draw() { draws++; }, fit() {}});
  await view.select('02');
  assert.equal(computations, 1); assert.equal(draws, 1); assert.equal(view.current.valid, true);
  assert.equal(view.staged['02'], undefined);
});
