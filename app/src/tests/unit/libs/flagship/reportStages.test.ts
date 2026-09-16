import { describe, expect, test } from 'vitest';
import { formatElapsed, ReportStageInput, reportStages } from '@/libs/flagship/reportStages';

const base: ReportStageInput = {
  reportLoaded: false,
  provisionsLoaded: false,
  provisionCount: 0,
  calc: { status: 'initializing' },
  validationResolved: false,
};

const states = (input: ReportStageInput) => reportStages(input).map((s) => s.state);

describe('reportStages', () => {
  test('given nothing loaded then the first stage is active and the rest pending', () => {
    expect(states(base)).toEqual(['active', 'pending', 'pending', 'pending']);
  });

  test('given the report and reform loaded then the run is the active stage', () => {
    const stages = reportStages({
      ...base,
      reportLoaded: true,
      provisionsLoaded: true,
      provisionCount: 2,
    });

    expect(stages.map((s) => s.state)).toEqual(['done', 'done', 'active', 'pending']);
    expect(stages[1].detail).toBe('2 provisions');
    expect(stages[2].label).toBe('Starting the society-wide run');
  });

  test('given the run is queued then the queue position is the detail', () => {
    const stages = reportStages({
      ...base,
      reportLoaded: true,
      provisionsLoaded: true,
      provisionCount: 1,
      calc: { status: 'pending', queuePosition: 3, message: 'In queue' },
    });

    expect(stages[2].label).toBe('Running the society-wide calculation');
    expect(stages[2].detail).toBe('In queue, position 3');
  });

  test('given the run is computing then the calculation message is the detail', () => {
    const stages = reportStages({
      ...base,
      reportLoaded: true,
      provisionsLoaded: true,
      provisionCount: 1,
      calc: { status: 'pending', message: 'Running society-wide calculation...', progress: 40 },
    });

    expect(stages[2].detail).toBe('Running society-wide calculation...');
  });

  test('given validation resolved before the run then it shows done while the run is active', () => {
    const stages = reportStages({
      ...base,
      reportLoaded: true,
      provisionsLoaded: true,
      provisionCount: 1,
      calc: { status: 'pending' },
      validationResolved: true,
      calibratedCount: 4,
      scorecardPrograms: ['ctc_refund'],
    });

    expect(stages.map((s) => s.state)).toEqual(['done', 'done', 'active', 'done']);
    expect(stages[3].detail).toBe(
      '4 calibrated variables found · scorecard context for ctc_refund'
    );
  });

  test('given no calibrated variables then the validation detail says so', () => {
    const stages = reportStages({
      ...base,
      reportLoaded: true,
      provisionsLoaded: true,
      provisionCount: 1,
      calc: { status: 'complete' },
      validationResolved: true,
      calibratedCount: 0,
      scorecardPrograms: [],
    });

    expect(stages.map((s) => s.state)).toEqual(['done', 'done', 'done', 'done']);
    expect(stages[3].detail).toBe('no calibrated variables among those the reform moves');
  });
});

describe('formatElapsed', () => {
  test('given under a minute then seconds only', () => {
    expect(formatElapsed(42_000)).toBe('42s');
  });

  test('given over a minute then minutes and seconds', () => {
    expect(formatElapsed(83_000)).toBe('1m 23s');
  });
});
