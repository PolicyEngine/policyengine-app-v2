/** Runs tasks with no more than a set number in flight at once. */
export interface ConcurrencyLimit {
  /**
   * Runs `task` once fewer than the limit are running, in the order the
   * tasks were given, and answers with its result. A task whose `signal`
   * aborts while it waits never runs, and rejects with an `AbortError`;
   * one already running is left to finish.
   */
  run: <Result>(task: () => Promise<Result>, signal?: AbortSignal) => Promise<Result>;
}

function abortError(): DOMException {
  return new DOMException('The task was aborted before it started', 'AbortError');
}

/** A limit of `limit` tasks in flight at once, first in, first out. */
export function createConcurrencyLimit(limit: number): ConcurrencyLimit {
  let running = 0;
  const waiting: Array<() => void> = [];

  const startNext = () => {
    while (running < limit && waiting.length > 0) {
      waiting.shift()!();
    }
  };

  return {
    run: <Result>(task: () => Promise<Result>, signal?: AbortSignal) =>
      new Promise<Result>((resolve, reject) => {
        if (signal?.aborted) {
          reject(abortError());
          return;
        }
        const start = () => {
          signal?.removeEventListener('abort', onAbort);
          running += 1;
          let settled: Promise<Result>;
          try {
            settled = task();
          } catch (error) {
            settled = Promise.reject(error);
          }
          settled.then(resolve, reject).finally(() => {
            running -= 1;
            startNext();
          });
        };
        const onAbort = () => {
          const index = waiting.indexOf(start);
          if (index !== -1) {
            waiting.splice(index, 1);
            reject(abortError());
          }
        };
        signal?.addEventListener('abort', onAbort, { once: true });
        waiting.push(start);
        startNext();
      }),
  };
}
