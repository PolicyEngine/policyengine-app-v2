/**
 * Factory helpers for creating v2 EconomicImpactResponse mocks.
 * Used by test fixtures throughout the test suite.
 */
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';

const BASELINE_SIM_ID = 'baseline-sim-001';
const REFORM_SIM_ID = 'reform-sim-002';
const REPORT_ID = 'test-report-001';

/**
 * Create a minimal valid EconomicImpactResponse.
 * Override any field via the `overrides` parameter.
 */
export function createMockEconomicImpactResponse(
  overrides?: Partial<EconomicImpactResponse>
): EconomicImpactResponse {
  return {
    report_id: REPORT_ID,
    status: 'completed',
    baseline_simulation: {
      id: BASELINE_SIM_ID,
      status: 'completed',
      error_message: null,
    },
    reform_simulation: {
      id: REFORM_SIM_ID,
      status: 'completed',
      error_message: null,
    },
    region: null,
    error_message: null,
    decile_impacts: null,
    program_statistics: null,
    poverty: null,
    inequality: null,
    budget_summary: null,
    intra_decile: null,
    detailed_budget: null,
    congressional_district_impact: null,
    constituency_impact: null,
    local_authority_impact: null,
    wealth_decile: null,
    intra_wealth_decile: null,
    ...overrides,
  };
}

/** Helper: create a budget_summary array from simple values */
export function createMockBudgetSummary(opts: {
  taxRevenue?: number;
  stateTaxRevenue?: number;
  benefitSpending?: number;
  countPeople?: number;
  netIncome?: number;
}) {
  const rows = [];
  if (opts.taxRevenue !== undefined) {
    rows.push({
      id: 'bs-1',
      report_id: REPORT_ID,
      variable_name: 'household_tax',
      entity: 'household',
      baseline_total: 0,
      reform_total: opts.taxRevenue,
      change: opts.taxRevenue,
    });
  }
  if (opts.stateTaxRevenue !== undefined) {
    rows.push({
      id: 'bs-2',
      report_id: REPORT_ID,
      variable_name: 'household_state_income_tax',
      entity: 'household',
      baseline_total: 0,
      reform_total: opts.stateTaxRevenue,
      change: opts.stateTaxRevenue,
    });
  }
  if (opts.benefitSpending !== undefined) {
    rows.push({
      id: 'bs-3',
      report_id: REPORT_ID,
      variable_name: 'household_benefits',
      entity: 'household',
      baseline_total: 0,
      reform_total: opts.benefitSpending,
      change: opts.benefitSpending,
    });
  }
  if (opts.countPeople !== undefined) {
    rows.push({
      id: 'bs-4',
      report_id: REPORT_ID,
      variable_name: 'household_count_people',
      entity: 'household',
      baseline_total: opts.countPeople,
      reform_total: opts.countPeople,
      change: 0,
    });
  }
  if (opts.netIncome !== undefined) {
    rows.push({
      id: 'bs-5',
      report_id: REPORT_ID,
      variable_name: 'household_net_income',
      entity: 'household',
      baseline_total: opts.netIncome,
      reform_total: opts.netIncome,
      change: 0,
    });
  }
  return rows;
}

/** Helper: create poverty rows for a baseline/reform pair */
export function createMockPovertyPair(
  povertyType: string,
  filterVariable: string | null,
  baselineRate: number,
  reformRate: number
) {
  return [
    {
      id: `pov-b-${povertyType}-${filterVariable ?? 'all'}`,
      simulation_id: BASELINE_SIM_ID,
      report_id: REPORT_ID,
      poverty_type: povertyType,
      entity: 'person',
      filter_variable: filterVariable,
      headcount: null,
      total_population: null,
      rate: baselineRate,
    },
    {
      id: `pov-r-${povertyType}-${filterVariable ?? 'all'}`,
      simulation_id: REFORM_SIM_ID,
      report_id: REPORT_ID,
      poverty_type: povertyType,
      entity: 'person',
      filter_variable: filterVariable,
      headcount: null,
      total_population: null,
      rate: reformRate,
    },
  ];
}

/** Helper: create inequality rows for baseline/reform */
export function createMockInequalityPair(
  baseline: { gini: number; top10: number; top1: number },
  reform: { gini: number; top10: number; top1: number }
) {
  return [
    {
      id: 'ineq-b',
      simulation_id: BASELINE_SIM_ID,
      report_id: REPORT_ID,
      income_variable: 'household_net_income',
      entity: 'household',
      gini: baseline.gini,
      top_10_share: baseline.top10,
      top_1_share: baseline.top1,
      bottom_50_share: null,
    },
    {
      id: 'ineq-r',
      simulation_id: REFORM_SIM_ID,
      report_id: REPORT_ID,
      income_variable: 'household_net_income',
      entity: 'household',
      gini: reform.gini,
      top_10_share: reform.top10,
      top_1_share: reform.top1,
      bottom_50_share: null,
    },
  ];
}

/** Helper: create decile impact rows */
export function createMockDecileImpacts(absoluteChanges: number[], relativeChanges?: number[]) {
  return absoluteChanges.map((change, i) => ({
    id: `decile-${i + 1}`,
    report_id: REPORT_ID,
    income_variable: 'household_net_income',
    entity: 'household',
    decile: i + 1,
    quantiles: 10,
    baseline_mean: null,
    reform_mean: null,
    absolute_change: change,
    relative_change: relativeChanges?.[i] ?? null,
    count_better_off: null,
    count_worse_off: null,
    count_no_change: null,
  }));
}

/** Helper: create intra-decile rows (all + per-decile) */
export function createMockIntraDecile(
  allRow: {
    gain5: number;
    gainLess5: number;
    noChange: number;
    loseLess5: number;
    lose5: number;
  },
  perDecile?: Array<typeof allRow>
) {
  const rows = [
    {
      id: 'intra-all',
      report_id: REPORT_ID,
      decile: 0,
      gain_more_than_5pct: allRow.gain5,
      gain_less_than_5pct: allRow.gainLess5,
      no_change: allRow.noChange,
      lose_less_than_5pct: allRow.loseLess5,
      lose_more_than_5pct: allRow.lose5,
    },
  ];
  if (perDecile) {
    perDecile.forEach((d, i) => {
      rows.push({
        id: `intra-${i + 1}`,
        report_id: REPORT_ID,
        decile: i + 1,
        gain_more_than_5pct: d.gain5,
        gain_less_than_5pct: d.gainLess5,
        no_change: d.noChange,
        lose_less_than_5pct: d.loseLess5,
        lose_more_than_5pct: d.lose5,
      });
    });
  }
  return rows;
}

export { BASELINE_SIM_ID, REFORM_SIM_ID, REPORT_ID };
