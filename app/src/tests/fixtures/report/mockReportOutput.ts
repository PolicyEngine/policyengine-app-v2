/**
 * Mock economy report output for demo and testing purposes
 * Based on a US report with realistic data values
 * Note: This is a partial mock with only the fields needed for the overview display
 */
export const MOCK_ECONOMY_REPORT_OUTPUT = {
  budget: {
    baseline_net_income: 5000000000000,
    benefit_spending_impact: 15000000000,
    budgetary_impact: -20200000000, // -$20.2B cost
    households: 130000000,
    state_tax_revenue_impact: -5000000000,
    tax_revenue_impact: -15000000000,
  },
  cliff_impact: null,
  constituency_impact: null,
  data_version: '2024.1.0',
  intra_decile: {
    all: {
      'Gain more than 5%': 0.08, // 8%
      'Gain less than 5%': 0.03, // 3%
      'Lose more than 5%': 0.02, // 2%
      'Lose less than 5%': 0.035, // 3.5%
      'No change': 0.835, // 83.5%
    },
  },
  poverty: {
    poverty: {
      all: {
        baseline: 0.124, // 12.4%
        reform: 0.118, // 11.8%
      },
    },
  },
} as any; // Use 'as any' to avoid type checking issues with partial mock

/**
 * Mock report ID for demo purposes
 */
export const MOCK_DEMO_REPORT_ID = 'demo-report-001';
