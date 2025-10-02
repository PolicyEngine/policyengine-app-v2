import ReportOutputPage from './ReportOutput.page';
import { MOCK_USER_ID } from '@/constants';
import { useUserReportById } from '@/hooks/useUserReports';

/**
 * Demo wrapper for ReportOutputPage
 * Provides mock data to view the structural page in isolation
 */
export default function ReportOutputPageDemo() {
  // Mock economy output data (simplified US report)
  const mockEconomyOutput = {
    budget: {
      baseline_net_income: 5000000000000,
      benefit_spending_impact: 15000000000,
      budgetary_impact: -20200000000,
      households: 130000000,
      state_tax_revenue_impact: -5000000000,
      tax_revenue_impact: -15000000000,
    },
    cliff_impact: null,
    constituency_impact: null,
    data_version: '2024.1.0',
    decile: {
      average: { '1': 500, '2': 800, '3': 1200 },
      relative: { '1': 0.05, '2': 0.08, '3': 0.12 },
    },
    detailed_budget: {},
    inequality: {
      gini: { baseline: 0.42, reform: 0.40 },
      top_10_pct_share: { baseline: 0.48, reform: 0.46 },
      top_1_pct_share: { baseline: 0.20, reform: 0.19 },
    },
    intra_decile: {
      all: {
        'Gain less than 5%': 0.15,
        'Gain more than 5%': 0.35,
        'Lose less than 5%': 0.10,
        'Lose more than 5%': 0.05,
        'No change': 0.35,
      },
      deciles: {
        'Gain less than 5%': [0.1, 0.15, 0.2],
        'Gain more than 5%': [0.3, 0.35, 0.4],
        'Lose less than 5%': [0.1, 0.1, 0.1],
        'Lose more than 5%': [0.05, 0.05, 0.05],
        'No change': [0.45, 0.35, 0.25],
      },
    },
    intra_wealth_decile: null,
    labor_supply_response: {
      decile: {
        average: { income: {}, substitution: {} },
        relative: { income: {}, substitution: {} },
      },
      hours: {
        baseline: 100000000,
        change: -500000,
        income_effect: -300000,
        reform: 99500000,
        substitution_effect: -200000,
      },
      income_lsr: -0.02,
      relative_lsr: { income: -0.01, substitution: -0.01 },
      revenue_change: -1000000000,
      substitution_lsr: -0.01,
      total_change: -500000,
    },
    model_version: 'policyengine-us@1.0.0',
    poverty: {
      deep_poverty: {
        adult: { baseline: 0.05, reform: 0.048 },
        all: { baseline: 0.055, reform: 0.052 },
        child: { baseline: 0.06, reform: 0.055 },
        senior: { baseline: 0.04, reform: 0.038 },
      },
      poverty: {
        adult: { baseline: 0.12, reform: 0.11 },
        all: { baseline: 0.13, reform: 0.12 },
        child: { baseline: 0.16, reform: 0.14 },
        senior: { baseline: 0.08, reform: 0.075 },
      },
    },
    poverty_by_gender: {
      deep_poverty: {
        female: { baseline: 0.06, reform: 0.055 },
        male: { baseline: 0.05, reform: 0.048 },
      },
      poverty: {
        female: { baseline: 0.14, reform: 0.13 },
        male: { baseline: 0.12, reform: 0.11 },
      },
    },
    poverty_by_race: {
      poverty: {
        black: { baseline: 0.21, reform: 0.19 },
        hispanic: { baseline: 0.18, reform: 0.16 },
        other: { baseline: 0.15, reform: 0.14 },
        white: { baseline: 0.10, reform: 0.095 },
      },
    },
    wealth_decile: null,
  };

  // Mock normalized report from useUserReportById
  const mockNormalizedReport = {
    report: {
      id: '0001',
      label: 'Making the CTC Fully Refundable in 2025',
      countryId: 'us' as const,
      apiVersion: '1.0',
      simulationIds: ['sim1', 'sim2'],
      status: 'complete' as const,
      output: mockEconomyOutput,
    },
    simulations: [
      {
        id: 'sim1',
        label: 'Baseline Simulation',
        countryId: 'us' as const,
        policyId: 'policy1',
        populationId: 'pop1',
        populationType: 'geography' as const,
        apiVersion: '1.0',
      },
      {
        id: 'sim2',
        label: 'Reform Simulation',
        countryId: 'us' as const,
        policyId: 'policy2',
        populationId: 'pop1',
        populationType: 'geography' as const,
        apiVersion: '1.0',
      },
    ],
    policies: [],
    households: [],
    userSimulations: [],
    userPolicies: [],
    userHouseholds: [],
    isLoading: false,
    error: null,
  };

  return (
    <ReportOutputPage
      output={mockEconomyOutput}
      outputType="economy"
      normalizedReport={mockNormalizedReport as unknown as ReturnType<typeof useUserReportById>}
    />
  );
}
