import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import RunProgress, {
  clockProgress,
  runProgressValue,
  runStageCaption,
} from '@/components/flagship/report/RunProgress';

describe('runProgressValue', () => {
  test('given no run stage then the time estimate is the value', () => {
    expect(runProgressValue(40)).toBe(40);
  });

  test('given an estimate behind the stage then the stage start holds the bar', () => {
    expect(runProgressValue(30, { stage: 'reform', floor: 67, max: 96 })).toBe(67);
  });

  test('given an estimate past the stage then the bar waits below the next stage', () => {
    expect(runProgressValue(99, { stage: 'reform', floor: 67, max: 96 })).toBe(96);
  });

  test('given an estimate inside the stage then the estimate is the value', () => {
    expect(runProgressValue(80, { stage: 'reform', floor: 67, max: 96 })).toBe(80);
  });
});

describe('runStageCaption', () => {
  test('given a segmented run then the caption counts the regions', () => {
    expect(runStageCaption({ stage: 'simulating', segments: { completed: 19, total: 20 } })).toBe(
      'Running the regions, 19 of 20 done'
    );
  });

  test('given a stage the app does not know then there is no caption', () => {
    expect(runStageCaption({ stage: 'a_future_stage' })).toBeUndefined();
  });
});

describe('RunProgress', () => {
  test('given a run started before the page opened then the bar picks up at its age, not 0', () => {
    // Started two minutes ago on another page; a typical run takes four.
    render(
      <RunProgress
        title="Calculating the nationwide results"
        progress={0}
        expectedMs={4 * 60_000}
        startedAt={Date.now() - 2 * 60_000}
      />
    );

    const status = screen.getByRole('status');
    expect(status).toHaveTextContent('2m');
    expect(status).toHaveTextContent('43%');
  });

  test('given a run stage then the stage names the line under the title', () => {
    render(
      <RunProgress
        title="Calculating the nationwide results"
        expectedMs={360000}
        progress={10}
        runStage={{ stage: 'reform', floor: 67, max: 96 }}
      />
    );

    expect(screen.getByText('Running the reform')).toBeInTheDocument();
    expect(screen.getByText(/67%/)).toBeInTheDocument();
  });

  test('given a queue detail then it is shown in place of the stage', () => {
    render(
      <RunProgress
        title="Calculating the nationwide results"
        expectedMs={360000}
        progress={1}
        detail="In queue, position 2"
        runStage={{ stage: 'queued', floor: 0, max: 24 }}
      />
    );

    expect(screen.getByText('In queue, position 2')).toBeInTheDocument();
    expect(screen.queryByText('Waiting for a worker')).not.toBeInTheDocument();
  });

  test('given a later stage range that starts lower then the bar does not move backwards', () => {
    const { rerender } = render(
      <RunProgress
        title="Calculating the nationwide results"
        expectedMs={360000}
        progress={20}
        runStage={{ stage: 'queued', floor: 0, max: 24 }}
      />
    );

    rerender(
      <RunProgress
        title="Calculating the nationwide results"
        expectedMs={360000}
        progress={21}
        runStage={{ stage: 'loading_data', floor: 3, max: 4 }}
      />
    );

    expect(screen.getByText(/· 20%/)).toBeInTheDocument();
  });

  test('given a run past its typical time then the bar still moves and says it takes longer', () => {
    expect(clockProgress(60_000, 60_000)).toBe(85);
    expect(clockProgress(120_000, 60_000)).toBeGreaterThan(90);
    expect(clockProgress(600_000, 60_000)).toBeLessThan(95);
    render(
      <RunProgress
        title="Calculating this household"
        expectedMs={60_000}
        startedAt={Date.now() - 90_000}
      />
    );
    expect(screen.getByText('Taking longer than usual; still calculating')).toBeInTheDocument();
  });
});
