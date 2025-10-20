import type { EconomyReportOutput } from '@/api/economy';

/**
 * Creates a mock EconomyReportOutput for testing BudgetaryImpactSubPage
 */
export const createMockOutput = (
  budgetaryImpact: number,
  taxRevenue: number,
  stateTaxRevenue: number,
  benefitSpending: number
): EconomyReportOutput =>
  ({
    budget: {
      budgetary_impact: budgetaryImpact,
      tax_revenue_impact: taxRevenue,
      state_tax_revenue_impact: stateTaxRevenue,
      benefit_spending_impact: benefitSpending,
    },
  }) as EconomyReportOutput;

// Common test scenarios
export const MOCK_POSITIVE_IMPACT = createMockOutput(5e9, 3e9, 1e9, -1e9);
export const MOCK_NEGATIVE_IMPACT = createMockOutput(-5e9, -3e9, -1e9, 1e9);
export const MOCK_ZERO_IMPACT = createMockOutput(0, 0, 0, 0);
export const MOCK_LARGE_IMPACT = createMockOutput(12.3e9, 10e9, 2e9, 0.3e9);
export const MOCK_SMALL_IMPACT = createMockOutput(500e6, 300e6, 100e6, 100e6);
export const MOCK_TRILLION_IMPACT = createMockOutput(2.5e12, 2e12, 0.5e12, 0);
