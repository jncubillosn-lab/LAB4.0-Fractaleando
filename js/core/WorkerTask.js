function cancelledError() {
  const error = new Error('Cálculo cancelado.');
  error.name = 'AbortError';
  return error;
}

// Own one worker, one completion and one optional timer. Replacing a task
// settles its promise immediately; late events cannot update the new task.
export class WorkerTask {
  constructor(createWorker, {setTimer = setTimeout, clearTimer = clearTimeout} = {}) {
    this.createWorker = createWorker;
    this.setTimer = setTimer;
    this.clearTimer = clearTimer;
    this.current = null;
  }

  get running() {
    return this.current !== null;
  }

  cancel() {
    this.current?.finish(cancelledError());
  }

  run(input, {timeoutMs = 0, timeoutMessage = 'Límite de cálculo.', onProgress = () => {}} = {}) {
    this.cancel();
    return new Promise((resolve, reject) => {
      const task = {worker: null, timer: null, settled: false};
      task.finish = (error, result) => {
        if (task.settled) return;
        task.settled = true;
        if (task.timer !== null) this.clearTimer(task.timer);
        if (task.worker) {
          task.worker.onmessage = null;
          task.worker.onerror = null;
          task.worker.onmessageerror = null;
          task.worker.terminate();
        }
        if (this.current === task) this.current = null;
        if (error) reject(error);
        else resolve(result);
      };
      this.current = task;
      try {
        task.worker = this.createWorker();
        task.worker.onmessage = ({data}) => {
          if (task.settled) return;
          try {
            if (data?.progress) onProgress(data.progress);
            else if (data?.error) task.finish(new Error(data.error));
            else if (data && Object.hasOwn(data, 'result')) task.finish(null, data.result);
            else task.finish(new Error('Respuesta de cálculo no reconocida.'));
          } catch (error) {
            task.finish(error);
          }
        };
        task.worker.onerror = event => task.finish(new Error(event.message || 'Error de cálculo.'));
        task.worker.onmessageerror = () => task.finish(new Error('Respuesta de cálculo no reconocida.'));
        if (timeoutMs > 0) task.timer = this.setTimer(() => task.finish(new Error(timeoutMessage)), timeoutMs);
        task.worker.postMessage(input);
      } catch (error) {
        task.finish(error);
      }
    });
  }
}
