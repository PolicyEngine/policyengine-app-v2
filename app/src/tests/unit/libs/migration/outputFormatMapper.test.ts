import { describe, expect, test } from 'vitest';
import type { SocietyWideReportOutput } from '@/api/societyWideCalculation';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import {
  mapLegacyEconomyOutputToV2ComparableOutput,
  mapLegacyHouseholdOutputToV2ComparableOutput,
  mapV2EconomicImpactToComparableOutput,
  mapV2EconomicImpactToLegacyOutput,
  mapV2HouseholdImpactToLegacyOutput,
} from '@/libs/migration/outputFormatMapper';

const baseEconomicImpactResponse: EconomicImpactResponse = {
  report_id: 'report-1',
  status: 'completed',
  baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
  region: null,
  error_message: null,
  decile_impacts: [
    {
      id: 'decile-1',
      report_id: 'report-1',
      income_variable: 'household_net_income',
      entity: 'household',
      decile: 1,
      quantiles: 10,
      baseline_mean: 100,
      reform_mean: 110,
      absolute_change: 10,
      relative_change: 0.1,
      count_better_off: null,
      count_worse_off: null,
      count_no_change: null,
    },
    {
      id: 'decile-2',
      report_id: 'report-1',
      income_variable: 'household_net_income',
      entity: 'household',
      decile: 2,
      quantiles: 10,
      baseline_mean: 200,
      reform_mean: 190,
      absolute_change: -10,
      relative_change: -0.05,
      count_better_off: null,
      count_worse_off: null,
      count_no_change: null,
    },
  ],
  program_statistics: null,
  poverty: [
    {
      id: 'poverty-baseline',
      simulation_id: 'sim-baseline',
      report_id: 'report-1',
      poverty_type: 'poverty',
      entity: 'all',
      filter_variable: null,
      headcount: 100,
      total_population: 1000,
      rate: 0.1,
    },
    {
      id: 'poverty-reform',
      simulation_id: 'sim-reform',
      report_id: 'report-1',
      poverty_type: 'poverty',
      entity: 'all',
      filter_variable: null,
      headcount: 80,
      total_population: 1000,
      rate: 0.08,
    },
    {
      id: 'deep-child-baseline',
      simulation_id: 'sim-baseline',
      report_id: 'report-1',
      poverty_type: 'deep_poverty',
      entity: 'child',
      filter_variable: null,
      headcount: 20,
      total_population: 200,
      rate: 0.1,
    },
    {
      id: 'deep-child-reform',
      simulation_id: 'sim-reform',
      report_id: 'report-1',
      poverty_type: 'deep_poverty',
      entity: 'child',
      filter_variable: null,
      headcount: 16,
      total_population: 200,
      rate: 0.08,
    },
    {
      id: 'male-poverty-baseline',
      simulation_id: 'sim-baseline',
      report_id: 'report-1',
      poverty_type: 'poverty',
      entity: 'male',
      filter_variable: null,
      headcount: 40,
      total_population: 500,
      rate: 0.08,
    },
    {
      id: 'male-poverty-reform',
      simulation_id: 'sim-reform',
      report_id: 'report-1',
      poverty_type: 'poverty',
      entity: 'male',
      filter_variable: null,
      headcount: 35,
      total_population: 500,
      rate: 0.07,
    },
  ],
  inequality: [
    {
      id: 'ineq-baseline',
      simulation_id: 'sim-baseline',
      report_id: 'report-1',
      income_variable: 'household_net_income',
      entity: 'household',
      gini: 0.4,
      top_10_share: 0.35,
      top_1_share: 0.12,
      bottom_50_share: 0.18,
    },
    {
      id: 'ineq-reform',
      simulation_id: 'sim-reform',
      report_id: 'report-1',
      income_variable: 'household_net_income',
      entity: 'household',
      gini: 0.38,
      top_10_share: 0.33,
      top_1_share: 0.11,
      bottom_50_share: 0.19,
    },
  ],
  budget_summary: [
    {
      id: 'net-income',
      report_id: 'report-1',
      variable_name: 'household_net_income',
      entity: 'household',
      baseline_total: 1_000,
      reform_total: 1_080,
      change: 80,
    },
    {
      id: 'federal-tax',
      report_id: 'report-1',
      variable_name: 'income_tax',
      entity: 'tax_unit',
      baseline_total: 500,
      reform_total: 620,
      change: 120,
    },
    {
      id: 'state-tax',
      report_id: 'report-1',
      variable_name: 'state_income_tax',
      entity: 'tax_unit',
      baseline_total: 200,
      reform_total: 220,
      change: 20,
    },
    {
      id: 'benefits',
      report_id: 'report-1',
      variable_name: 'benefit_spending',
      entity: 'person',
      baseline_total: 300,
      reform_total: 330,
      change: 30,
    },
  ],
  intra_decile: [
    {
      id: 'intra-1',
      report_id: 'report-1',
      decile: 1,
      gain_more_than_5pct: 0.2,
      gain_less_than_5pct: 0.3,
      no_change: 0.4,
      lose_less_than_5pct: 0.05,
      lose_more_than_5pct: 0.05,
    },
    {
      id: 'intra-2',
      report_id: 'report-1',
      decile: 2,
      gain_more_than_5pct: 0.1,
      gain_less_than_5pct: 0.2,
      no_change: 0.5,
      lose_less_than_5pct: 0.1,
      lose_more_than_5pct: 0.1,
    },
  ],
  detailed_budget: {
    income_tax: {
      baseline_total: 500,
      reform_total: 620,
      change: 120,
    },
  },
  congressional_district_impact: null,
  constituency_impact: null,
  local_authority_impact: null,
  wealth_decile: null,
  intra_wealth_decile: null,
};

describe('outputFormatMapper', () => {
  describe('mapV2EconomicImpactToLegacyOutput', () => {
    test('given v2 economy rows then it maps budget and decile fields to legacy output', () => {
      const output = mapV2EconomicImpactToLegacyOutput(baseEconomicImpactResponse, {
        modelVersion: '1.2.3',
        dataVersion: '2026.1',
        dataset: 'enhanced_cps_2026',
      });

      expect(output.budget).toEqual({
        baseline_net_income: 1_000,
        benefit_spending_impact: 30,
        budgetary_impact: 110,
        households: 1_000,
        state_tax_revenue_impact: 20,
        tax_revenue_impact: 140,
      });
      expect(output.decile.average).toEqual({ '1': 10, '2': -10 });
      expect(output.decile.relative).toEqual({ '1': 0.1, '2': -0.05 });
      expect(output.model_version).toBe('1.2.3');
      expect(output.data_version).toBe('2026.1');
      expect(output.dataset).toBe('enhanced_cps_2026');
    });

    test('given v2 poverty and inequality rows then it maps baseline and reform pairs', () => {
      const output = mapV2EconomicImpactToLegacyOutput(baseEconomicImpactResponse);

      expect(output.poverty.poverty.all).toEqual({ baseline: 0.1, reform: 0.08 });
      expect(output.poverty.deep_poverty.child).toEqual({ baseline: 0.1, reform: 0.08 });
      expect(output.poverty_by_gender.poverty.male).toEqual({ baseline: 0.08, reform: 0.07 });
      expect(output.inequality.gini).toEqual({ baseline: 0.4, reform: 0.38 });
      expect(output.inequality.top_10_pct_share).toEqual({ baseline: 0.35, reform: 0.33 });
      expect(output.inequality.top_1_pct_share).toEqual({ baseline: 0.12, reform: 0.11 });
    });

    test('given v2 intra-decile rows then it maps decile arrays and overall averages', () => {
      const output = mapV2EconomicImpactToLegacyOutput(baseEconomicImpactResponse);

      expect(output.intra_decile.deciles['Gain more than 5%']).toEqual([0.2, 0.1]);
      expect(output.intra_decile.deciles['No change']).toEqual([0.4, 0.5]);
      expect(output.intra_decile.all['Gain more than 5%']).toBeCloseTo(0.15);
      expect(output.detailed_budget).toEqual({
        income_tax: {
          baseline: 500,
          difference: 120,
          reform: 620,
        },
      });
    });
  });

  describe('mapV2HouseholdImpactToLegacyOutput', () => {
    test('given v2 household analysis results then it keys output by simulation id', () => {
      const response: HouseholdImpactResponse = {
        report_id: 'report-1',
        report_type: 'household',
        status: 'completed',
        baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
        reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
        baseline_result: { people: { adult: { net_income: 40_000 } } },
        reform_result: { people: { adult: { net_income: 42_000 } } },
        impact: { people: { adult: { net_income: 2_000 } } },
        error_message: null,
      };

      expect(mapV2HouseholdImpactToLegacyOutput(response)).toEqual({
        'sim-baseline': { people: { adult: { net_income: 40_000 } } },
        'sim-reform': { people: { adult: { net_income: 42_000 } } },
      });
    });
  });

  describe('comparable output mappers', () => {
    test('given legacy economy output then it creates v2-comparable rows', () => {
      const legacyOutput = mapV2EconomicImpactToLegacyOutput(
        baseEconomicImpactResponse
      ) as SocietyWideReportOutput;

      const comparable = mapLegacyEconomyOutputToV2ComparableOutput(legacyOutput);

      expect(comparable.budget_summary).toContainEqual({
        variable_name: 'budgetary_impact',
        baseline_total: null,
        reform_total: null,
        change: 110,
      });
      expect(comparable.decile_impacts).toEqual([
        { decile: 1, absolute_change: 10, relative_change: 0.1 },
        { decile: 2, absolute_change: -10, relative_change: -0.05 },
      ]);
      expect(comparable.poverty).toContainEqual({
        poverty_type: 'poverty',
        entity: 'all',
        filter_variable: null,
        baseline_rate: 0.1,
        reform_rate: 0.08,
      });
      expect(comparable.inequality).toContainEqual({
        metric: 'gini',
        baseline: 0.4,
        reform: 0.38,
      });
    });

    test('given v2 economy output then comparable mapper uses normalized legacy field names', () => {
      const comparable = mapV2EconomicImpactToComparableOutput(baseEconomicImpactResponse);

      expect(comparable.intra_decile[0]).toEqual({
        decile: 1,
        gain_more_than_5pct: 0.2,
        gain_less_than_5pct: 0.3,
        no_change: 0.4,
        lose_less_than_5pct: 0.05,
        lose_more_than_5pct: 0.05,
      });
    });

    test('given legacy household output then it creates a v2-comparable payload', () => {
      const comparable = mapLegacyHouseholdOutputToV2ComparableOutput(
        {
          'sim-baseline': { people: { adult: { net_income: 40_000 } } },
          'sim-reform': { people: { adult: { net_income: 42_000 } } },
        } as any,
        'sim-baseline',
        'sim-reform'
      );

      expect(comparable).toEqual({
        baseline_result: { people: { adult: { net_income: 40_000 } } },
        reform_result: { people: { adult: { net_income: 42_000 } } },
      });
    });
  });
});
