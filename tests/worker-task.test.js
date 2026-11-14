import {test} from 'node:test';
import assert from 'node:assert/strict';
import {WorkerTask} from '../js/core/WorkerTask.js';

function harness() {
  const workers = [], timers = new Map();
  let serial = 0;
  const task = new WorkerTask(() => {
    const worker = {stops: 0, postMessage(input) { this.input = input; }, terminate() { this.stops++; }};
    workers.push(worker);
    return worker;
  }, {setTimer(fn) { timers.set(++serial, fn); return serial; }, clearTimer(id) { timers.delete(id); }});
  return {task, workers, timers};
}

test('el cálculo comunica progreso y libera worker, eventos y temporizador al terminar', async () => {
  const {task, workers, timers} = harness(), progress = [];
  const result = task.run({nodes: 4}, {timeoutMs: 75, onProgress: p => progress.push(p)});
  const worker = workers[0], late = worker.onmessage;
  worker.onmessage({data: {progress: {pass: 1}}});
  worker.onmessage({data: {result: {routes: 3}}});
  assert.deepEqual(await result, {routes: 3});
  assert.deepEqual(progress, [{pass: 1}]);
  assert.equal(worker.stops, 1); assert.equal(worker.onmessage, null);
  assert.equal(task.running, false); assert.equal(timers.size, 0);
  late({data: {progress: {pass: 2}}});
  assert.equal(progress.length, 1);
});

test('sustituir o cancelar un cálculo resuelve su espera sin tocar el trabajo posterior', async () => {
  const {task, workers, timers} = harness();
  const first = task.run('first', {timeoutMs: 75});
  const rejected = assert.rejects(first, {name: 'AbortError'}), late = workers[0].onmessage;
  const second = task.run('second', {timeoutMs: 75});
  await rejected;
  late({data: {result: 'obsolete'}});
  assert.equal(task.running, true); assert.equal(timers.size, 1);
  workers[1].onmessage({data: {result: 'current'}});
  assert.equal(await second, 'current');
  const third = task.run('third', {timeoutMs: 75});
  const cancelled = assert.rejects(third, {name: 'AbortError'});
  task.cancel(); task.cancel(); await cancelled;
  assert.equal(timers.size, 0); assert.equal(workers[2].stops, 1);
});

test('timeout, errores y mensajes ilegibles liberan el cálculo una sola vez', async () => {
  for (const failure of ['timeout', 'error', 'messageerror', 'payload']) {
    const {task, workers, timers} = harness();
    const result = task.run({}, {timeoutMs: 75, timeoutMessage: 'Tiempo agotado'});
    const rejected = assert.rejects(result);
    if (failure === 'timeout') [...timers.values()][0]();
    if (failure === 'error') workers[0].onerror({message: 'Error del worker'});
    if (failure === 'messageerror') workers[0].onmessageerror();
    if (failure === 'payload') workers[0].onmessage({data: {unknown: true}});
    await rejected;
    assert.equal(workers[0].stops, 1); assert.equal(timers.size, 0); assert.equal(task.running, false);
  }
});

test('fallos al crear o enviar al worker también cierran el trabajo', async () => {
  const creation = new WorkerTask(() => { throw new Error('No disponible'); });
  await assert.rejects(creation.run({}), /No disponible/);
  assert.equal(creation.running, false);
  const {task, workers, timers} = harness();
  const factory = task.createWorker;
  task.createWorker = () => { const w = factory(); w.postMessage = () => { throw new Error('No serializable'); }; return w; };
  await assert.rejects(task.run({}, {timeoutMs: 75}), /No serializable/);
  assert.equal(workers[0].stops, 1); assert.equal(timers.size, 0);
});
