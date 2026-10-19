import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import ReportContents, {
  leadsWithStateRevenue,
  reportMetrics,
  winnerShareMetric,
} from '@/components/flagship/ReportContents';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

describe('reportMetrics', () => {
  test('given a nationwide run then the headline is the combined budget effect', () => {
    const output = createMockSocietyWideOutput();
    expect(reportMetrics(output, 'us')[0]).toEqual({
      value: '$1.0m',
      label: 'Annual government savings',
    });
  });

  test('given a state run then the headline is that state revenue', () => {
    const output = createMockSocietyWideOutput();
    output.budget.state_tax_revenue_impact = -74_200_000;
    expect(reportMetrics(output, 'us', { stateRevenue: true })[0]).toEqual({
      value: '$74.2m',
      label: 'Annual state revenue loss',
    });
  });

  test('given more people gain than lose then the second figure is the share of people gaining', () => {
    // Given: the API's winner shares count people, as in report 4326.
    const output = createMockSocietyWideOutput();
    output.intra_decile.all = {
      'Gain more than 5%': 0.041,
      'Gain less than 5%': 0.1,
      'No change': 0.849,
      'Lose less than 5%': 0.01,
      'Lose more than 5%': 0,
    };

    // Then
    expect(reportMetrics(output, 'us')[1]).toEqual({
      value: '14.1%',
      label: 'People gaining income',
    });
  });

  test('given more people lose than gain then the second figure is the share of people losing', () => {
    // Given: 46% of people lose a little and no one gains, as in report 4302.
    const output = createMockSocietyWideOutput();
    output.intra_decile.all = {
      'Gain more than 5%': 0,
      'Gain less than 5%': 0,
      'No change': 0.5398,
      'Lose less than 5%': 0.4602,
      'Lose more than 5%': 0,
    };

    // Then
    expect(reportMetrics(output, 'us')[1]).toEqual({
      value: '46.0%',
      label: 'People losing income',
    });
  });
});

describe('winnerShareMetric', () => {
  test('given no one gains or loses then it reads as no one gaining', () => {
    expect(winnerShareMetric(0, 0)).toEqual({ value: '0.0%', label: 'People gaining income' });
  });

  test('given shares that are not numbers then it is unavailable', () => {
    expect(winnerShareMetric(Number.NaN, Number.NaN)).toEqual({
      value: 'Unavailable',
      label: 'People gaining income',
    });
  });
});

describe('leadsWithStateRevenue', () => {
  const state = [{ path: 'gov.states.de.tax.income.rate' }];
  const federal = [{ path: 'gov.irs.credits.ctc.amount.base[0].amount' }];

  test('given a state reform run on a state or district then it leads with state revenue', () => {
    expect(leadsWithStateRevenue('state/de', state)).toBe(true);
    expect(leadsWithStateRevenue('congressional_district/DE-01', state)).toBe(true);
    expect(
      leadsWithStateRevenue('state/va', [{ path: 'gov.contrib.states.va.hb979.in_effect' }])
    ).toBe(true);
  });

  test('given a federal reform run on a state then it leads with the full budget effect', () => {
    expect(leadsWithStateRevenue('state/de', federal)).toBe(false);
    expect(leadsWithStateRevenue('state/de', [...state, ...federal])).toBe(false);
  });

  test('given a nationwide run then it leads with the full budget effect', () => {
    expect(leadsWithStateRevenue('us', state)).toBe(false);
    expect(leadsWithStateRevenue(undefined, state)).toBe(false);
  });
});

describe('ReportContents', () => {
  test('given no districts copy then the card reads districts', () => {
    render(<ReportContents metrics={[]} districtAvailable onOpen={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Explore districts' })).toHaveTextContent(
      'Compare income changes across districts on a map.'
    );
  });

  test('given districts copy then the card reads it', () => {
    render(
      <ReportContents
        metrics={[]}
        districtAvailable
        districtsCopy={{
          title: 'Local area impacts',
          action: 'Explore local areas',
          preview: 'Compare income changes across constituencies and local authorities on a map.',
        }}
        onOpen={vi.fn()}
      />
    );

    const card = screen.getByRole('button', { name: 'Explore local areas' });
    expect(card).toHaveTextContent('Local area impacts');
    expect(card).toHaveTextContent('constituencies and local authorities');
  });

  test('given districts hidden then the overview has no districts card', () => {
    render(
      <ReportContents metrics={[]} districtAvailable showDistricts={false} onOpen={vi.fn()} />
    );

    expect(screen.queryByRole('button', { name: 'Explore districts' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore household impacts' })).toBeInTheDocument();
  });
});
