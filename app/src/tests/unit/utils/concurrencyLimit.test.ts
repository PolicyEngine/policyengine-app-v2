import { describe, expect, test } from 'vitest';
import {
  controlledTask,
  flushPromises,
  TASK_FAILURE,
  TASK_LIMIT,
  TASK_RESULT,
} from '@/tests/fixtures/utils/concurrencyLimitMocks';
import { createConcurrencyLimit } from '@/utils/concurrencyLimit';

describe('createConcurrencyLimit', () => {
  test('given more tasks than the limit then no more than the limit run at once', async () => {
    // Given
    const limit = createConcurrencyLimit(TASK_LIMIT);
    const tasks = [controlledTask(), controlledTask(), controlledTask(), controlledTask()];

    // When
    tasks.forEach((task) => void limit.run(task.run));
    await flushPromises();

    // Then
    expect(tasks.map((task) => task.started())).toEqual([true, true, false, false]);
  });

  test('given a running task finishes then the next queued task starts, first in first out', async () => {
    // Given
    const limit = createConcurrencyLimit(TASK_LIMIT);
    const tasks = [controlledTask(), controlledTask(), controlledTask(), controlledTask()];
    tasks.forEach((task) => void limit.run(task.run));
    await flushPromises();

    // When
    tasks[1].resolve(TASK_RESULT);
    await flushPromises();

    // Then
    expect(tasks.map((task) => task.started())).toEqual([true, true, true, false]);
  });

  test('given a task then run answers with its result', async () => {
    // Given
    const limit = createConcurrencyLimit(TASK_LIMIT);
    const task = controlledTask();

    // When
    const result = limit.run(task.run);
    task.resolve(TASK_RESULT);

    // Then
    await expect(result).resolves.toBe(TASK_RESULT);
  });

  test('given a task that rejects then run rejects and its place goes to the next task', async () => {
    // Given
    const limit = createConcurrencyLimit(1);
    const failing = controlledTask();
    const queued = controlledTask();
    const failed = limit.run(failing.run);
    void limit.run(queued.run);
    await flushPromises();
    expect(queued.started()).toBe(false);

    // When
    failing.reject(TASK_FAILURE);

    // Then
    await expect(failed).rejects.toBe(TASK_FAILURE);
    await flushPromises();
    expect(queued.started()).toBe(true);
  });

  test('given a queued task aborted then it never runs, rejects, and gives up its place', async () => {
    // Given
    const limit = createConcurrencyLimit(1);
    const running = controlledTask();
    const aborted = controlledTask();
    const next = controlledTask();
    const controller = new AbortController();
    void limit.run(running.run);
    const abortedResult = expect(limit.run(aborted.run, controller.signal)).rejects.toMatchObject({
      name: 'AbortError',
    });
    void limit.run(next.run);

    // When
    controller.abort();
    running.resolve(TASK_RESULT);
    await flushPromises();

    // Then
    await abortedResult;
    expect(aborted.started()).toBe(false);
    expect(next.started()).toBe(true);
  });

  test('given a signal already aborted then the task never runs', async () => {
    // Given
    const limit = createConcurrencyLimit(TASK_LIMIT);
    const task = controlledTask();
    const controller = new AbortController();
    controller.abort();

    // When
    const result = limit.run(task.run, controller.signal);

    // Then
    await expect(result).rejects.toMatchObject({ name: 'AbortError' });
    expect(task.started()).toBe(false);
  });

  test('given a running task aborted then it still finishes with its result', async () => {
    // Given
    const limit = createConcurrencyLimit(TASK_LIMIT);
    const task = controlledTask();
    const controller = new AbortController();
    const result = limit.run(task.run, controller.signal);
    await flushPromises();

    // When
    controller.abort();
    task.resolve(TASK_RESULT);

    // Then
    await expect(result).resolves.toBe(TASK_RESULT);
  });
});
