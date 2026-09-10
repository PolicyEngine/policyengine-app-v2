import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { ReportComputingScreen, ReportUnresolvable } from '@/components/flagship/ReportComputing';
import type { ReportStage } from '@/libs/flagship/reportStages';

const stages: ReportStage[] = [
  { id: 'report', label: 'Loading the report', state: 'done' },
  { id: 'reform', label: 'Loading the reform', detail: '1 provision', state: 'done' },
  {
    id: 'run',
    label: 'Running the society-wide calculation',
    detail: 'In queue, position 2',
    state: 'active',
  },
  { id: 'validate', label: 'Checking the data behind the estimate', state: 'pending' },
];

const provision = {
  path: 'gov.irs.credits.ctc.amount.base[0].amount',
  breadcrumb: 'IRS → Credits → Child Tax Credit → Amount → Bracket 1 → Amount',
  unit: 'currency-USD',
  baselineValue: 2200,
  value: 2500,
};

describe('ReportComputingScreen', () => {
  test('given a run in progress then the reform, the active stage, and its detail render', () => {
    render(
      <ReportComputingScreen
        title="CTC to $2,500"
        sourceNote="Hand-built draft"
        baselineLine="Baseline: current law · 2026 · Population: United States (nationwide)"
        provisions={[provision]}
        stages={stages}
        progress={35}
      />
    );

    expect(screen.getByRole('heading', { name: 'CTC to $2,500' })).toBeInTheDocument();
    expect(screen.getByText(/Bracket 1/)).toBeInTheDocument();
    expect(screen.getAllByText('Running the society-wide calculation')).toHaveLength(2);
    expect(screen.getByText('In queue, position 2')).toBeInTheDocument();
    expect(screen.getByText(/35%/)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  test('given the reform is still loading then it says so instead of claiming no provisions', () => {
    render(
      <ReportComputingScreen
        title="Impact report"
        baselineLine="Baseline: current law · 2026"
        provisions={null}
        stages={stages.map((s) => ({ ...s, state: s.id === 'report' ? 'active' : 'pending' }))}
      />
    );

    expect(screen.getByText('Loading the reform…')).toBeInTheDocument();
    expect(screen.queryByText(/unavailable/)).not.toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('given children then they render below the stages', () => {
    render(
      <ReportComputingScreen
        title="Impact report"
        baselineLine="Baseline: current law · 2026"
        provisions={[provision]}
        stages={stages}
      >
        <div>Validation goes here</div>
      </ReportComputingScreen>
    );

    expect(screen.getByText('Validation goes here')).toBeInTheDocument();
  });
});

describe('ReportUnresolvable', () => {
  test('given a local-only link then the page says so and how to get a shareable one', () => {
    render(<ReportUnresolvable />);

    expect(screen.getByText(/only opens in the browser that ran the report/i)).toBeInTheDocument();
    expect(screen.getByText(/shareable id/i)).toBeInTheDocument();
  });
});
