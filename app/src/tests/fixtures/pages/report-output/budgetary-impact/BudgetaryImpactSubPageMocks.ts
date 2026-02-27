import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import {
  createMockBudgetSummary,
  createMockEconomicImpactResponse,
} from '@/tests/fixtures/v2MockFactory';

/**
 * Creates a mock EconomicImpactResponse for testing BudgetaryImpactSubPage
 */
export const createMockOutput = (
  taxRevenue: number,
  stateTaxRevenue: number,
  benefitSpending: number
): EconomicImpactResponse =>
  createMockEconomicImpactResponse({
    budget_summary: createMockBudgetSummary({
      taxRevenue,
      stateTaxRevenue,
      benefitSpending,
      countPeople: 130_000_000,
      netIncome: 5_000_000_000_000,
    }),
  });

// Common test scenarios
// budgetaryImpact = taxRevenue - benefitSpending
export const MOCK_POSITIVE_IMPACT = createMockOutput(5e9, 1e9, 0);
export const MOCK_NEGATIVE_IMPACT = createMockOutput(-5e9, -1e9, 0);
export const MOCK_ZERO_IMPACT = createMockOutput(0, 0, 0);
export const MOCK_LARGE_IMPACT = createMockOutput(12.3e9, 2e9, 0);
export const MOCK_SMALL_IMPACT = createMockOutput(500e6, 100e6, 0);
export const MOCK_TRILLION_IMPACT = createMockOutput(2.5e12, 0.5e12, 0);
