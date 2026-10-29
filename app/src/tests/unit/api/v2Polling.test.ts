import { describe, expect, test, vi } from 'vitest';
import { pollUntilFinished } from '@/api/v2Polling';

/** A calculation's state as a read answers it. */
interface ReadState {
  status: 'running' | 'succeeded';
}

const RUNNING: ReadState = { status: 'running' };
const SUCCEEDED: ReadState = { status: 'succeeded' };
const isFinished = (state: ReadState) => state.status === 'succeeded';
const TIMEOUT_MESSAGE = 'The calculation timed out.';

describe('pollUntilFinished', () => {
  test('given an answer not finished then it is read again until it is', async () => {
    // Given
    const read = vi
      .fn<() => Promise<ReadState>>()
      .mockResolvedValueOnce(RUNNING)
      .mockResolvedValueOnce(SUCCEEDED);

    // When
    const finished = await pollUntilFinished({
      first: async () => RUNNING,
      read,
      isFinished,
      timeoutMessage: TIMEOUT_MESSAGE,
      wait: () => Promise.resolve(),
    });

    // Then
    expect(finished).toBe(SUCCEEDED);
    expect(read).toHaveBeenCalledTimes(2);
  });

  test('given no first answer then the first read is the first answer', async () => {
    // Given
    const read = vi.fn<() => Promise<ReadState>>().mockResolvedValue(SUCCEEDED);

    // When
    await pollUntilFinished({ read, isFinished, timeoutMessage: TIMEOUT_MESSAGE });

    // Then
    expect(read).toHaveBeenCalledTimes(1);
  });

  test('given the wait aborted then it stops at once and reads no more', async () => {
    // Given
    const controller = new AbortController();
    const read = vi.fn<() => Promise<ReadState>>().mockResolvedValue(RUNNING);
    const polling = pollUntilFinished({
      read,
      isFinished,
      timeoutMessage: TIMEOUT_MESSAGE,
      pollIntervalMs: 60_000,
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(read).toHaveBeenCalledTimes(1));

    // When
    controller.abort();

    // Then
    await expect(polling).rejects.toMatchObject({ name: 'AbortError' });
    expect(read).toHaveBeenCalledTimes(1);
  });

  test('given the time limit then it ends the wait, saying so', async () => {
    // Given
    let clock = 0;
    const read = vi.fn<() => Promise<ReadState>>().mockResolvedValue(RUNNING);

    // When
    const polling = pollUntilFinished({
      read,
      isFinished,
      timeoutMessage: TIMEOUT_MESSAGE,
      pollIntervalMs: 2000,
      timeLimitMs: 6000,
      now: () => clock,
      wait: async (milliseconds) => {
        clock += milliseconds;
      },
    });

    // Then
    await expect(polling).rejects.toThrow(TIMEOUT_MESSAGE);
    expect(read).toHaveBeenCalledTimes(4);
  });
});
