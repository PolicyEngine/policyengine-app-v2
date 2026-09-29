import { describe, expect, test } from 'vitest';
import { reportMetrics } from '@/components/flagship/ReportContents';
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
