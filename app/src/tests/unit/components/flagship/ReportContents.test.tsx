import { describe, expect, test } from 'vitest';
import { leadsWithStateRevenue, reportMetrics } from '@/components/flagship/ReportContents';
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
