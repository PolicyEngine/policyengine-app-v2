import { describe, expect, test } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import {
  getBudgetCsvRows,
  getDetailedBudgetCsvRows,
} from '@/pages/report-output/budgetary-impact/budgetChartUtils';
import {
  getDecileAverageCsvRows,
  getDecileRelativeCsvRows,
  getWinnersLosersCsvRows,
} from '@/pages/report-output/distributional-impact/distributionalChartUtils';
import { getInequalityCsvRows } from '@/pages/report-output/inequality-impact/inequalityChartUtils';
import {
  getPovertyByAgeCsvRows,
  getPovertyByGenderCsvRows,
  getPovertyByRaceCsvRows,
} from '@/pages/report-output/poverty-impact/povertyChartUtils';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

describe('report output CSV exports', () => {
  test('given decile outputs then distributional CSVs include normalized headers', () => {
    const output = createMockSocietyWideOutput({
      decile: {
        average: { '2': 20, '1': 10 },
        relative: { '2': 0.02, '1': 0.01 },
      },
      wealth_decile: {
        average: { '1': 100 },
        relative: { '1': 0.1 },
      },
    }) as SocietyWideReportOutput;

    expect(getDecileAverageCsvRows(output)).toEqual([
      ['Income decile', 'Average change'],
      ['1', 10],
      ['2', 20],
    ]);
    expect(getDecileRelativeCsvRows(output)).toEqual([
      ['Income decile', 'Relative change'],
      ['1', 0.01],
      ['2', 0.02],
    ]);
    expect(getDecileAverageCsvRows(output, 'wealth')).toEqual([
      ['Wealth decile', 'Average change'],
      ['1', 100],
    ]);
  });

  test('given intra-decile output then winners and losers CSV puts All after deciles', () => {
    const output = createMockSocietyWideOutput({
      intra_decile: {
        deciles: {
          'Gain more than 5%': Array(10).fill(0.1),
          'Gain less than 5%': Array(10).fill(0.2),
          'No change': Array(10).fill(0.3),
          'Lose less than 5%': Array(10).fill(0.2),
          'Lose more than 5%': Array(10).fill(0.2),
        },
        all: {
          'Gain more than 5%': 0.1,
          'Gain less than 5%': 0.2,
          'No change': 0.3,
          'Lose less than 5%': 0.2,
          'Lose more than 5%': 0.2,
        },
      },
    }) as SocietyWideReportOutput;

    const rows = getWinnersLosersCsvRows(output);

    expect(rows[0]).toEqual([
      'Income decile',
      'Gain more than 5%',
      'Gain less than 5%',
      'No change',
      'Lose less than 5%',
      'Lose more than 5%',
    ]);
    expect(rows[1]).toEqual(['1', 0.1, 0.2, 0.3, 0.2, 0.2]);
    expect(rows[11]).toEqual(['All', 0.1, 0.2, 0.3, 0.2, 0.2]);
  });

  test('given budget outputs then budget CSVs include headers and raw numeric values', () => {
    const output = createMockSocietyWideOutput({
      budget: {
        budgetary_impact: 4e9,
        baseline_net_income: 20e9,
        benefit_spending_impact: -3e9,
        households: 100,
        state_tax_revenue_impact: 1e9,
        tax_revenue_impact: 2e9,
      },
      detailed_budget: {
        child_benefit: { baseline: 10, reform: 12, difference: 2 },
      },
    }) as SocietyWideReportOutput;
    const metadata = {
      variables: {
        child_benefit: { label: 'Child benefit' },
      },
    } as any;

    expect(getBudgetCsvRows(output, 'us')).toEqual([
      ['Category', 'Budgetary impact (billions)'],
      ['Federal tax revenues', 1],
      ['State and local income tax revenues', 1],
      ['Benefit spending', 3],
      ['Net impact', 4],
    ]);
    expect(getDetailedBudgetCsvRows(output, metadata)).toEqual([
      ['Program', 'Baseline', 'Reform', 'Difference'],
      ['Child benefit', 10, 12, 2],
    ]);
  });

  test('given poverty outputs then poverty CSVs include demographic breakdown values', () => {
    const output = createMockSocietyWideOutput({
      poverty_by_gender: {
        poverty: {
          male: { baseline: 0.1, reform: 0.09 },
          female: { baseline: 0.2, reform: 0.18 },
        },
        deep_poverty: {
          male: { baseline: 0.03, reform: 0.027 },
          female: { baseline: 0.04, reform: 0.036 },
        },
      },
      poverty_by_race: {
        poverty: {
          white: { baseline: 0.1, reform: 0.09 },
          black: { baseline: 0.2, reform: 0.18 },
          hispanic: { baseline: 0.3, reform: 0.24 },
          other: { baseline: 0.4, reform: 0.36 },
        },
      },
    }) as SocietyWideReportOutput;

    expect(getPovertyByAgeCsvRows(output)[0]).toEqual([
      'Age group',
      'Baseline',
      'Reform',
      'Change',
    ]);
    expect(getPovertyByAgeCsvRows(output)[1]).toEqual(['Children', 0.15, 0.13, 0.13 / 0.15 - 1]);
    expect(getPovertyByGenderCsvRows(output)).toContainEqual(['Male', 0.1, 0.09, 0.09 / 0.1 - 1]);
    expect(getPovertyByRaceCsvRows(output)).toContainEqual([
      'White (non-Hispanic)',
      0.1,
      0.09,
      0.09 / 0.1 - 1,
    ]);
  });

  test('given inequality output then inequality CSV includes each metric', () => {
    const output = createMockSocietyWideOutput() as SocietyWideReportOutput;

    expect(getInequalityCsvRows(output)).toEqual([
      ['Metric', 'Baseline', 'Reform', 'Change'],
      ['Gini index', 0.45, 0.44, 0.44 / 0.45 - 1],
      ['Top 10% share', 0.35, 0.34, 0.34 / 0.35 - 1],
      ['Top 1% share', 0.15, 0.14, 0.14 / 0.15 - 1],
    ]);
  });
});
