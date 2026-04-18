import { describe, expect, test } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import { buildBudgetaryImpactCsv } from '@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage';
import { buildDistributionalAbsoluteCsv } from '@/pages/report-output/distributional-impact/DistributionalImpactIncomeAverageSubPage';
import { buildDistributionalRelativeCsv } from '@/pages/report-output/distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import { buildWinnersLosersCsv } from '@/pages/report-output/distributional-impact/WinnersLosersIncomeDecileSubPage';
import { buildInequalityCsv } from '@/pages/report-output/inequality-impact/InequalityImpactSubPage';
import { buildPovertyByAgeCsv } from '@/pages/report-output/poverty-impact/PovertyImpactByAgeSubPage';
import { buildPovertyByGenderCsv } from '@/pages/report-output/poverty-impact/PovertyImpactByGenderSubPage';
import { buildPovertyByRaceCsv } from '@/pages/report-output/poverty-impact/PovertyImpactByRaceSubPage';

const asOutput = (partial: object): SocietyWideReportOutput =>
  partial as SocietyWideReportOutput;

describe('buildBudgetaryImpactCsv', () => {
  const output = asOutput({
    budget: {
      budgetary_impact: 5e9,
      benefit_spending_impact: -1e9,
      state_tax_revenue_impact: 1e9,
      tax_revenue_impact: 4e9,
    },
  });

  test('given US output then includes federal and state tax rows in billions', () => {
    const rows = buildBudgetaryImpactCsv(output, 'us');

    expect(rows[0]).toEqual(['Line item', 'Value (billions)']);
    expect(rows.find((r) => r[0] === 'Federal tax revenues')?.[1]).toBe('3.000');
    expect(rows.find((r) => r[0] === 'State and local income tax revenues')?.[1]).toBe('1.000');
    expect(rows.find((r) => r[0] === 'Benefit spending')?.[1]).toBe('1.000');
    expect(rows.find((r) => r[0] === 'Net impact')?.[1]).toBe('5.000');
  });

  test('given UK output then uses generic "Tax revenues" label', () => {
    const rows = buildBudgetaryImpactCsv(output, 'uk');

    expect(rows.some((r) => r[0] === 'Federal tax revenues')).toBe(false);
    expect(rows.some((r) => r[0] === 'Tax revenues')).toBe(true);
  });

  test('given zero line item then filters it out', () => {
    const rows = buildBudgetaryImpactCsv(
      asOutput({
        budget: {
          budgetary_impact: 5e9,
          benefit_spending_impact: 0,
          state_tax_revenue_impact: 0,
          tax_revenue_impact: 5e9,
        },
      }),
      'us'
    );

    // Header + Federal taxes + Net impact only (State and Benefits filtered).
    expect(rows).toHaveLength(3);
    expect(rows.some((r) => r[0] === 'Benefit spending')).toBe(false);
    expect(rows.some((r) => r[0] === 'State and local income tax revenues')).toBe(false);
  });
});

describe('buildDistributionalAbsoluteCsv', () => {
  test('given decile averages then emits one row per decile sorted numerically', () => {
    const rows = buildDistributionalAbsoluteCsv(
      asOutput({
        decile: {
          average: { '1': 100, '2': 200, '10': 1000, '3': 300 },
        },
      })
    );

    expect(rows[0]).toEqual(['Decile', 'Absolute change in household income']);
    expect(rows.slice(1).map((r) => r[0])).toEqual(['1', '2', '3', '10']);
    expect(rows.find((r) => r[0] === '10')?.[1]).toBe('1000.00');
  });
});

describe('buildDistributionalRelativeCsv', () => {
  test('given relative decile changes then converts to percent with 2 decimals', () => {
    const rows = buildDistributionalRelativeCsv(
      asOutput({
        decile: {
          relative: { '1': 0.012345, '2': -0.05 },
        },
      })
    );

    expect(rows[0]).toEqual(['Decile', 'Relative change (%)']);
    expect(rows.find((r) => r[0] === '1')?.[1]).toBe('1.23');
    expect(rows.find((r) => r[0] === '2')?.[1]).toBe('-5.00');
  });
});

describe('buildWinnersLosersCsv', () => {
  const makeDecileArray = (value: number) => Array(10).fill(value);
  const output = asOutput({
    intra_decile: {
      deciles: {
        'Gain more than 5%': makeDecileArray(0.2),
        'Gain less than 5%': makeDecileArray(0.1),
        'No change': makeDecileArray(0.5),
        'Lose less than 5%': makeDecileArray(0.1),
        'Lose more than 5%': makeDecileArray(0.1),
      },
      all: {
        'Gain more than 5%': 0.25,
        'Gain less than 5%': 0.15,
        'No change': 0.4,
        'Lose less than 5%': 0.1,
        'Lose more than 5%': 0.1,
      },
    },
  });

  test('given full output then produces 10 decile rows + All row', () => {
    const rows = buildWinnersLosersCsv(output);

    // Header + 10 deciles + All row = 12.
    expect(rows).toHaveLength(12);
    expect(rows[0][0]).toBe('Decile');
    expect(rows.slice(1, 11).map((r) => r[0])).toEqual([
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      '10',
    ]);
    expect(rows[11][0]).toBe('All');
  });

  test('given values then emits percentages with 2 decimals', () => {
    const rows = buildWinnersLosersCsv(output);
    const allRow = rows[11];

    // 'Gain more than 5%' is second column after the "Decile" label.
    expect(allRow[1]).toBe('25.00');
    expect(allRow[3]).toBe('40.00'); // No change
  });

  test('given header then uses display labels (Loss not Lose)', () => {
    const rows = buildWinnersLosersCsv(output);

    expect(rows[0]).toContain('Loss less than 5% (%)');
    expect(rows[0]).toContain('Loss more than 5% (%)');
    expect(rows[0]).toContain('Gain more than 5% (%)');
  });
});

describe('buildPovertyByAgeCsv', () => {
  test('given full poverty data then emits four group rows with relative change', () => {
    const rows = buildPovertyByAgeCsv(
      asOutput({
        poverty: {
          poverty: {
            child: { baseline: 0.2, reform: 0.18 },
            adult: { baseline: 0.1, reform: 0.11 },
            senior: { baseline: 0.05, reform: 0.05 },
            all: { baseline: 0.12, reform: 0.11 },
          },
        },
      })
    );

    expect(rows[0]).toEqual([
      'Group',
      'Baseline rate (%)',
      'Reform rate (%)',
      'Relative change (%)',
    ]);
    expect(rows.slice(1).map((r) => r[0])).toEqual([
      'Children',
      'Working-age adults',
      'Seniors',
      'All',
    ]);

    const childRow = rows.find((r) => r[0] === 'Children')!;
    // 0.2 → 0.18 = -10% relative.
    expect(childRow[1]).toBe('20.00');
    expect(childRow[2]).toBe('18.00');
    expect(childRow[3]).toBe('-10.00');
  });
});

describe('buildPovertyByGenderCsv', () => {
  const output = asOutput({
    poverty: {
      poverty: { all: { baseline: 0.1, reform: 0.09 } },
      deep_poverty: { all: { baseline: 0.05, reform: 0.04 } },
    },
    poverty_by_gender: {
      poverty: {
        male: { baseline: 0.08, reform: 0.07 },
        female: { baseline: 0.12, reform: 0.11 },
      },
      deep_poverty: {
        male: { baseline: 0.03, reform: 0.025 },
        female: { baseline: 0.07, reform: 0.06 },
      },
    },
  });

  test('given deep=false then uses regular poverty source', () => {
    const rows = buildPovertyByGenderCsv(output, false);

    expect(rows.find((r) => r[0] === 'All')?.[1]).toBe('10.00');
    expect(rows.find((r) => r[0] === 'Male')?.[1]).toBe('8.00');
  });

  test('given deep=true then uses deep_poverty source', () => {
    const rows = buildPovertyByGenderCsv(output, true);

    expect(rows.find((r) => r[0] === 'All')?.[1]).toBe('5.00');
    expect(rows.find((r) => r[0] === 'Male')?.[1]).toBe('3.00');
  });

  test('given missing gender data then skips those rows', () => {
    const minimal = asOutput({
      poverty: { poverty: { all: { baseline: 0.1, reform: 0.09 } } },
    });
    const rows = buildPovertyByGenderCsv(minimal);

    // Header + "All" only (no male/female data in fixture).
    expect(rows).toHaveLength(2);
    expect(rows[1][0]).toBe('All');
  });
});

describe('buildPovertyByRaceCsv', () => {
  test('given dynamic race keys then capitalizes and appends All', () => {
    const rows = buildPovertyByRaceCsv(
      asOutput({
        poverty: { poverty: { all: { baseline: 0.12, reform: 0.11 } } },
        poverty_by_race: {
          poverty: {
            white: { baseline: 0.08, reform: 0.075 },
            black: { baseline: 0.2, reform: 0.18 },
            hispanic: { baseline: 0.18, reform: 0.17 },
            all: { baseline: 0.12, reform: 0.11 },
          },
        },
      })
    );

    const labels = rows.slice(1).map((r) => r[0]);
    expect(labels).toContain('White');
    expect(labels).toContain('Black');
    expect(labels).toContain('Hispanic');
    expect(labels).toContain('All');
    expect(labels).not.toContain('all'); // Dynamic 'all' excluded; we add capitalized 'All' from poverty.poverty.
  });
});

describe('buildInequalityCsv', () => {
  test('given inequality metrics then emits Gini, Top 10%, Top 1% rows', () => {
    const rows = buildInequalityCsv(
      asOutput({
        inequality: {
          gini: { baseline: 0.45, reform: 0.44 },
          top_10_pct_share: { baseline: 0.4, reform: 0.39 },
          top_1_pct_share: { baseline: 0.2, reform: 0.18 },
        },
      })
    );

    expect(rows[0]).toEqual(['Metric', 'Baseline', 'Reform', 'Relative change (%)']);
    expect(rows.slice(1).map((r) => r[0])).toEqual([
      'Gini index',
      'Top 10% share',
      'Top 1% share',
    ]);

    const top1Row = rows.find((r) => r[0] === 'Top 1% share')!;
    // 0.2 → 0.18 = -10% relative.
    expect(top1Row[3]).toBe('-10.00');
    // Gini shows 3 decimal places, shares show 4.
    expect(rows.find((r) => r[0] === 'Gini index')![1]).toBe('0.450');
    expect(top1Row[1]).toBe('0.2000');
  });
});
