import { describe, expect, test } from 'vitest';
import {
  clockProgress,
  economyRunStartedAt,
  highestProgressAtPoll,
  runProgressAt,
} from '@/libs/calculations/runProgress';
import {
  mockFailedEconomyStatus,
  mockPendingEconomyStatus,
  QUEUED_STAGE,
  QUEUED_STAGE_MAX,
  RETRY_STARTED_AT,
  RUN_STARTED_AT,
  runTimeAfter,
  SEGMENTED_LOADING_DATA_STAGE,
  SIMULATING_STAGE,
  TYPICAL_RUN_ESTIMATE,
  TYPICAL_RUN_MS,
} from '@/tests/fixtures/libs/calculations/runProgressFixtures';

describe('runProgressAt', () => {
  test('given a run inside its stage then the bar follows the clock from its first request', () => {
    // When
    const progress = runProgressAt(
      { startedAt: RUN_STARTED_AT, runStage: SIMULATING_STAGE },
      runTimeAfter(TYPICAL_RUN_MS / 2),
      TYPICAL_RUN_ESTIMATE
    );

    // Then
    expect(progress).toBeCloseTo(clockProgress(TYPICAL_RUN_MS / 2, TYPICAL_RUN_MS));
  });

  test('given a highest value above the current stage then the bar keeps that value', () => {
    // Given - a US nationwide run held at 24% while queued, now loading its data (3–4%)
    const state = {
      startedAt: RUN_STARTED_AT,
      highestProgress: QUEUED_STAGE_MAX,
      runStage: SEGMENTED_LOADING_DATA_STAGE,
    };

    // When
    const progress = runProgressAt(state, runTimeAfter(TYPICAL_RUN_MS / 3), TYPICAL_RUN_ESTIMATE);

    // Then
    expect(progress).toBe(QUEUED_STAGE_MAX);
  });

  test('given time passes then the bar never decreases', () => {
    // Given
    const state = { startedAt: RUN_STARTED_AT, highestProgress: 12, runStage: SIMULATING_STAGE };
    const elapsedTimes = [0, 1_000, 60_000, TYPICAL_RUN_MS, 3 * TYPICAL_RUN_MS, 30 * TYPICAL_RUN_MS];

    // When
    const values = elapsedTimes.map((elapsedMs) =>
      runProgressAt(state, runTimeAfter(elapsedMs), TYPICAL_RUN_ESTIMATE)
    );

    // Then
    values.slice(1).forEach((value, index) => expect(value).toBeGreaterThanOrEqual(values[index]));
  });

  test('given a start time later than now then the bar starts at its stage', () => {
    // When
    const progress = runProgressAt(
      { startedAt: RUN_STARTED_AT, runStage: SIMULATING_STAGE },
      runTimeAfter(-5_000),
      TYPICAL_RUN_ESTIMATE
    );

    // Then
    expect(progress).toBe(SIMULATING_STAGE.floor);
  });
});

describe('highestProgressAtPoll', () => {
  test('given a first poll then the highest value is the bar by its stage', () => {
    // When
    const highest = highestProgressAtPoll(
      { startedAt: RUN_STARTED_AT, runStage: SIMULATING_STAGE },
      undefined,
      runTimeAfter(TYPICAL_RUN_MS / 2),
      TYPICAL_RUN_ESTIMATE
    );

    // Then
    expect(highest).toBeCloseTo(clockProgress(TYPICAL_RUN_MS / 2, TYPICAL_RUN_MS));
  });

  test('given a stage that starts lower than the last one then the value shown so far is kept', () => {
    // Given - the bar reached the queued stage's ceiling before this poll
    const previous = { startedAt: RUN_STARTED_AT, highestProgress: 20, runStage: QUEUED_STAGE };

    // When - this poll reports the data loading (3–4%)
    const highest = highestProgressAtPoll(
      { startedAt: RUN_STARTED_AT, runStage: SEGMENTED_LOADING_DATA_STAGE },
      previous,
      runTimeAfter(TYPICAL_RUN_MS / 2),
      TYPICAL_RUN_ESTIMATE
    );

    // Then - the bar ticked up to 24% by the queued stage's range between the polls
    expect(highest).toBe(QUEUED_STAGE_MAX);
  });

  test('given a bar that moved between polls then the next poll keeps at least that value', () => {
    // Given
    const previous = { startedAt: RUN_STARTED_AT, highestProgress: 10, runStage: SIMULATING_STAGE };
    const shownBeforePoll = runProgressAt(
      previous,
      runTimeAfter(TYPICAL_RUN_MS / 2 - 1_000),
      TYPICAL_RUN_ESTIMATE
    );

    // When - the next poll has no stage range
    const highest = highestProgressAtPoll(
      { startedAt: RUN_STARTED_AT },
      previous,
      runTimeAfter(TYPICAL_RUN_MS / 2),
      TYPICAL_RUN_ESTIMATE
    );

    // Then
    expect(highest).toBeGreaterThanOrEqual(shownBeforePoll);
  });

  test('given the last state is another run then its value does not carry over', () => {
    // Given - the last state is from a run that failed and was tried again
    const previous = { startedAt: RUN_STARTED_AT, highestProgress: 80, runStage: SIMULATING_STAGE };

    // When
    const highest = highestProgressAtPoll(
      { startedAt: RETRY_STARTED_AT, runStage: QUEUED_STAGE },
      previous,
      RETRY_STARTED_AT + 1_000,
      TYPICAL_RUN_ESTIMATE
    );

    // Then
    expect(highest).toBeCloseTo(clockProgress(1_000, TYPICAL_RUN_MS));
  });
});

describe('economyRunStartedAt', () => {
  const NOW = runTimeAfter(TYPICAL_RUN_MS);

  test('given a run still computing then it keeps its first request time', () => {
    expect(economyRunStartedAt(mockPendingEconomyStatus(), NOW)).toBe(RUN_STARTED_AT);
  });

  test('given a run that failed then trying it again starts now', () => {
    expect(economyRunStartedAt(mockFailedEconomyStatus(), NOW)).toBe(NOW);
  });

  test('given no run yet then it starts now', () => {
    expect(economyRunStartedAt(undefined, NOW)).toBe(NOW);
  });
});
