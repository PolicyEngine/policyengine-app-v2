import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BracketTable from '@/components/flagship/reform/BracketTable';
import { ParameterMetadataCollection } from '@/types/metadata/parameterMetadata';

const param = (path: string, unit: string) => ({
  [path]: { parameter: path, label: path, type: 'parameter' as const, unit, values: {} },
});

function renderSchedule(root: string, thresholdUnit: string) {
  const threshold = `${root}[0].threshold`;
  const amount = `${root}[0].amount`;
  const parameters: ParameterMetadataCollection = {
    ...param(threshold, thresholdUnit),
    ...param(amount, 'currency-USD'),
  };
  render(
    <BracketTable
      brackets={{
        fields: ['threshold', 'amount'],
        rows: [{ index: 0, cells: { threshold, amount } }],
      }}
      members={[]}
      period="2026"
      parameters={parameters}
      valueAt={() => 0}
      baselineAt={() => 0}
      onChange={vi.fn()}
      onFocus={vi.fn()}
    />
  );
}

describe('BracketTable', () => {
  test('given thresholds in years then the column says age', () => {
    renderSchedule('gov.irs.credits.ctc.amount.base', 'year');

    expect(screen.getByRole('columnheader', { name: 'Threshold (age)' })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: 'Amount' })).toBeInTheDocument();
  });

  test('given birth years then the column says so', () => {
    renderSchedule('gov.states.mi.tax.income.deductions.birth_year', 'year');

    expect(
      screen.getByRole('columnheader', { name: 'Threshold (birth year)' })
    ).toBeInTheDocument();
  });

  test('given dollar thresholds then the column needs no unit: the box shows $', () => {
    renderSchedule('gov.irs.income.bracket', 'currency-USD');

    expect(screen.getByRole('columnheader', { name: 'Threshold' })).toBeInTheDocument();
  });
});
