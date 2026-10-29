/**
 * Waiting for work the Public API's v2 routes run in the background (a
 * household calculation, a household report): the work is read again at
 * an interval until it has finished, for at most a time limit, and the
 * wait stops at once when its signal is aborted (a query no longer needed,
 * or a sibling calculation that failed). The work itself runs on.
 */

import { isV2ApiError } from '@/api/v2UserClient';

/** How often unfinished work is read again. */
export const POLL_INTERVAL_MS = 2000;

/**
 * How many times in a row one read is asked again after a failure that may
 * pass (the Public API unreachable, or answering 503), before the wait fails.
 */
export const TRANSIENT_READ_RETRIES = 3;

/** A read that failed for a reason that may pass: no answer, or 503. */
function isTransientFailure(error: unknown): boolean {
  return isV2ApiError(error, 0) || isV2ApiError(error, 503);
}

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
 * AbortError) once it aborts. A read that fails for a reason that may pass
 * is asked again, an interval later, up to TRANSIENT_READ_RETRIES times in
 * a row; a submission is never sent again.
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
  const readWithRetries = async (): Promise<Answer> => {
    for (let retries = 0; ; retries += 1) {
      try {
        return await read();
      } catch (error) {
        if (!isTransientFailure(error) || retries >= TRANSIENT_READ_RETRIES) {
          throw error;
        }
      }
      await wait(pollIntervalMs, signal);
      signal?.throwIfAborted();
    }
  };
  signal?.throwIfAborted();
  let answer = await (first ?? readWithRetries)();
  while (!isFinished(answer)) {
    if (now() - startedAt >= timeLimitMs) {
      throw new Error(timeoutMessage);
    }
    await wait(pollIntervalMs, signal);
    signal?.throwIfAborted();
    answer = await readWithRetries();
  }
  return answer;
}
