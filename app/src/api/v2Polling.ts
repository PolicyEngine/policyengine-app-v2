/**
 * Waiting for work the Public API's v2 routes run in the background (a
 * household calculation, a household report): the work is read again at
 * an interval until it has finished, for at most a time limit, and the
 * wait stops at once when its signal is aborted (a query no longer needed,
 * or a sibling calculation that failed). The work itself runs on.
 */

/** How often unfinished work is read again. */
export const POLL_INTERVAL_MS = 2000;

/**
 * How long the app waits for work before it stops: a variation across
 * earnings takes a few minutes, as on the v1 routes.
 */
export const POLL_TIME_LIMIT_MS = 10 * 60 * 1000;

export interface PollOptions {
  pollIntervalMs?: number;
  timeLimitMs?: number;
  /** Waits between reads; a timer that ends early when `signal` aborts, by default. */
  wait?: (milliseconds: number, signal?: AbortSignal) => Promise<void>;
  /** The time now, for the time limit; the clock by default. */
  now?: () => number;
  /** Stops waiting; the work itself runs on. */
  signal?: AbortSignal;
}

/** A timer that rejects with the signal's reason as soon as the signal aborts. */
export function waitOrAbort(milliseconds: number, signal?: AbortSignal): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const abort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', abort);
      resolve();
    }, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

/**
 * The first answer (a submission, or the first read when none is given),
 * then each read, until one has finished; rejects with `timeoutMessage`
 * once the time limit has passed, and with the signal's reason (an
 * AbortError) once it aborts.
 */
export async function pollUntilFinished<Answer>({
  first,
  read,
  isFinished,
  timeoutMessage,
  pollIntervalMs = POLL_INTERVAL_MS,
  timeLimitMs = POLL_TIME_LIMIT_MS,
  wait = waitOrAbort,
  now = Date.now,
  signal,
}: PollOptions & {
  first?: () => Promise<Answer>;
  read: () => Promise<Answer>;
  isFinished: (answer: Answer) => boolean;
  timeoutMessage: string;
}): Promise<Answer> {
  const startedAt = now();
  signal?.throwIfAborted();
  let answer = await (first ?? read)();
  while (!isFinished(answer)) {
    if (now() - startedAt >= timeLimitMs) {
      throw new Error(timeoutMessage);
    }
    await wait(pollIntervalMs, signal);
    signal?.throwIfAborted();
    answer = await read();
  }
  return answer;
}
