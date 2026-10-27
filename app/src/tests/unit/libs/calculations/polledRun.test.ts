import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { clockProgress } from '@/components/flagship/report/RunProgress';
import { MAX_FAILED_POLLS, pollRun, runStageOf } from '@/libs/calculations/polledRun';
import {
  COMPLETE_RESULT,
  computingRun,
  ERROR_RESPONSE,
  EXPECTED_MS,
  failedRun,
  FAILURE_MESSAGE,
  LOADING_DATA_RESPONSE,
  OK_RESPONSE,
  POLL_FAILURE,
  POLL_OPTIONS,
  QUEUED_RESPONSE,
  STARTED_AT,
  TIME_LIMIT_MESSAGE,
  TIME_LIMIT_MS,
  UNREADABLE_MESSAGE,
  UNREADABLE_RESPONSE,
} from '@/tests/fixtures/libs/calculations/polledRunMocks';

describe('pollRun', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(STARTED_AT);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given a first request still computing then the run starts its clock now', async () => {
    // When
    const run = await pollRun(async () => QUEUED_RESPONSE, undefined, POLL_OPTIONS);

    // Then
    expect(run).toEqual({
      status: 'computing',
      startedAt: STARTED_AT,
      result: null,
      progress: 0,
      stage: undefined,
      queuePosition: QUEUED_RESPONSE.queue_position,
    });
  });

  test('given a run computing for a while then the progress follows the clock', async () => {
    // Given
    const elapsed = EXPECTED_MS / 2;
    vi.setSystemTime(STARTED_AT + elapsed);

    // When
    const run = await pollRun(
      async () => QUEUED_RESPONSE,
      computingRun({ progress: 0 }),
      POLL_OPTIONS
    );

    // Then
    expect(run.progress).toBeCloseTo(clockProgress(elapsed, EXPECTED_MS));
  });

  test('given a reported stage then the clock is held inside it', async () => {
    // Given
    vi.setSystemTime(STARTED_AT + EXPECTED_MS);

    // When
    const run = await pollRun(
      async () => LOADING_DATA_RESPONSE,
      computingRun({ progress: 0 }),
      POLL_OPTIONS
    );

    // Then
    expect(run.progress).toBe(LOADING_DATA_RESPONSE.progress_max);
    expect(run.stage).toBe('loading_data');
  });

  test('given a stage that starts lower than the last poll then the progress never moves backwards', async () => {
    // Given
    const previous = computingRun({ progress: 60 });

    // When
    const run = await pollRun(async () => LOADING_DATA_RESPONSE, previous, POLL_OPTIONS);

    // Then
    expect(run.progress).toBe(60);
  });

  test('given a run still computing then its start time is kept', async () => {
    // Given
    vi.setSystemTime(STARTED_AT + 60_000);

    // When
    const run = await pollRun(async () => QUEUED_RESPONSE, computingRun(), POLL_OPTIONS);

    // Then
    expect(run.startedAt).toBe(STARTED_AT);
  });

  test('given a run that failed before then a new request starts a new clock', async () => {
    // Given
    const now = STARTED_AT + 60_000;
    vi.setSystemTime(now);

    // When
    const run = await pollRun(async () => QUEUED_RESPONSE, failedRun(), POLL_OPTIONS);

    // Then
    expect(run.startedAt).toBe(now);
  });

  test('given a run computing past the time limit then it fails with the time limit message', async () => {
    // Given
    vi.setSystemTime(STARTED_AT + TIME_LIMIT_MS + 1);

    // When
    const run = await pollRun(async () => QUEUED_RESPONSE, computingRun(), POLL_OPTIONS);

    // Then
    expect(run).toEqual({
      status: 'error',
      startedAt: STARTED_AT,
      result: null,
      error: TIME_LIMIT_MESSAGE,
    });
  });

  test('given an ok response then the run is complete with its result', async () => {
    // When
    const run = await pollRun(async () => OK_RESPONSE, computingRun(), POLL_OPTIONS);

    // Then
    expect(run).toEqual({ status: 'complete', startedAt: STARTED_AT, result: COMPLETE_RESULT });
  });

  test('given an ok result the run cannot read then it fails with why', async () => {
    // When
    const run = await pollRun(async () => UNREADABLE_RESPONSE, computingRun(), POLL_OPTIONS);

    // Then
    expect(run.status).toBe('error');
    expect(run.error).toBe(UNREADABLE_MESSAGE);
  });

  test('given an error response then the run fails with its error', async () => {
    // When
    const run = await pollRun(async () => ERROR_RESPONSE, computingRun(), POLL_OPTIONS);

    // Then
    expect(run.status).toBe('error');
    expect(run.error).toBe(ERROR_RESPONSE.error);
  });

  test('given an error response with no message then the run fails with the default message', async () => {
    // When
    const run = await pollRun(
      async () => ({ ...ERROR_RESPONSE, error: undefined }),
      computingRun(),
      POLL_OPTIONS
    );

    // Then
    expect(run.error).toBe(FAILURE_MESSAGE);
  });

  test('given a computing run whose polls fail then it keeps computing up to the tolerance', async () => {
    // Given
    let run = computingRun();

    // When
    for (let poll = 0; poll < MAX_FAILED_POLLS; poll++) {
      run = await pollRun(
        async () => {
          throw POLL_FAILURE;
        },
        run,
        POLL_OPTIONS
      );
      // Then
      expect(run.status).toBe('computing');
    }
    expect(run.failedPolls).toBe(MAX_FAILED_POLLS);
  });

  test('given one more failed poll than the tolerance then the run fails with that failure', async () => {
    // Given
    const previous = computingRun({ failedPolls: MAX_FAILED_POLLS });

    // When
    const run = await pollRun(
      async () => {
        throw POLL_FAILURE;
      },
      previous,
      POLL_OPTIONS
    );

    // Then
    expect(run).toEqual({
      status: 'error',
      startedAt: STARTED_AT,
      result: null,
      error: POLL_FAILURE.message,
    });
  });

  test('given a computing poll after failed polls then the count starts again', async () => {
    // When
    const run = await pollRun(
      async () => QUEUED_RESPONSE,
      computingRun({ failedPolls: 2 }),
      POLL_OPTIONS
    );

    // Then
    expect(run.failedPolls).toBeUndefined();
  });

  test('given a first request that fails then the run fails at once', async () => {
    // When
    const run = await pollRun(
      async () => {
        throw POLL_FAILURE;
      },
      undefined,
      POLL_OPTIONS
    );

    // Then
    expect(run.status).toBe('error');
    expect(run.error).toBe(POLL_FAILURE.message);
  });
});

describe('runStageOf', () => {
  test('given a response with its stage range then it is the stage', () => {
    expect(runStageOf(LOADING_DATA_RESPONSE)).toEqual({ floor: 10, max: 40 });
  });

  test('given a response without a stage range then there is none', () => {
    expect(runStageOf(QUEUED_RESPONSE)).toBeUndefined();
  });
});
