import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseGraphFile, checkpointHasRecords} from '../js/io/GraphFile.js';
import {bindGraphFiles} from '../js/ui/GraphFiles.js';

const fixture = JSON.parse(readFileSync(new URL('./fixtures/word-wrap-0.2.10.json', import.meta.url)));
test('el formato de archivo conserva los datos actuales y los JSON heredados', () => {
  assert.deepEqual(parseGraphFile(JSON.stringify(fixture)), fixture);
  const legacy = {nodes: fixture.nodes, edges: fixture.edges};
  assert.deepEqual(parseGraphFile(JSON.stringify(legacy)), legacy);
  assert.equal(checkpointHasRecords(fixture.planeCheckpoint), true);
});
test('una entrada conceptual inválida se rechaza antes de aplicarla', () => {
  for (const change of [
    d => { d.nodes[0] = null; }, d => { d.nodes.push(d.nodes[0]); },
    d => { d.edges[0].to = 'missing'; }, d => { d.edges[0].style = 'unknown'; },
    d => { d.nodes[1].parent = 'missing'; }, d => { d.edges[0].to = 'p1'; }
  ]) {
    const data = structuredClone(fixture); change(data);
    assert.throws(() => parseGraphFile(JSON.stringify(data)));
  }
  for (const data of [null, {}, {nodes: [], edges: []}]) assert.throws(() => parseGraphFile(JSON.stringify(data)));
});
test('los registros de geometría incompletos se identifican como caché no recuperable', () => {
  for (const data of [null, {}, {version: 1, positions: [null], routes: []},
    {version: 1, positions: [], routes: [null]},
    {version: 1, positions: [], routes: [{key: 'a|b', points: [null]}]}]) {
    assert.equal(checkpointHasRecords(data), false);
  }
});
function fileController() {
  const handlers = {}, imports = [], notices = [];
  const input = {value: '', files: [], addEventListener: (name, fn) => { handlers[name] = fn; }};
  const controller = bindGraphFiles({fileInput: input, loadButton: {}, saveButton: {}, snapshot() {},
    onImport: data => imports.push(data), toast: text => notices.push(text)});
  const start = text => { input.files = [{text: () => text}]; return handlers.change(); };
  return {controller, imports, notices, start};
}
test('la última carga elegida gana y una carga cancelada no sustituye el diagrama', async () => {
  const {controller, imports, notices, start} = fileController();
  let resolveOld;
  const old = start(new Promise(resolve => { resolveOld = resolve; }));
  const current = structuredClone(fixture); current.nodes[0].text = 'Current';
  await start(Promise.resolve(JSON.stringify(current)));
  resolveOld(JSON.stringify(fixture)); await old;
  assert.deepEqual(imports, [current]); assert.equal(notices.length, 1);
  let resolveCancelled;
  const cancelled = start(new Promise(resolve => { resolveCancelled = resolve; }));
  controller.cancel(); resolveCancelled(JSON.stringify(fixture)); await cancelled;
  assert.equal(imports.length, 1);
  await start(Promise.resolve('null'));
  assert.equal(imports.length, 1); assert.match(notices.at(-1), /No se pudo importar/);
});
