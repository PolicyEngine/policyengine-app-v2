import { vi } from 'vitest';
import { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import { mockHouseholdResult } from '@/tests/fixtures/types/calculationFixtures';
import { Household } from '@/types/ingredients/Household';

/**
 * Test constants for strategy timing and progress
 */
export const STRATEGY_TEST_CONSTANTS = {
  // Refetch intervals (both strategies now use 1s polling)
  SOCIETY_WIDE_REFETCH_INTERVAL_MS: 1000,
  HOUSEHOLD_REFETCH_INTERVAL_MS: 1000,

  // Duration estimates
  HOUSEHOLD_ESTIMATED_DURATION_MS: 60000,
  CUSTOM_ESTIMATED_DURATION_MS: 30000,
  LONG_ESTIMATED_DURATION_MS: 100000,

  // Progress thresholds
  MAX_SYNTHETIC_PROGRESS: 95,
  COMPLETE_PROGRESS: 100,

  // Queue and timing
  TEST_QUEUE_POSITION: 3,
  SOCIETY_WIDE_AVERAGE_TIME_SECONDS: 45,
  SOCIETY_WIDE_AVERAGE_TIME_MS: 45000,

  // Test timing values
  TEST_PROGRESS_TIME_MS: 30000,
} as const;

/**
 * Test report IDs for economy analysis
 */
export const TEST_REPORT_IDS = {
  PENDING: 'report-pending-123',
  RUNNING: 'report-running-456',
  COMPLETED: 'report-completed-789',
  FAILED: 'report-failed-000',
} as const;

/**
 * Mock v2 EconomicImpactResponse — pending state
 */
export const mockEconomyPendingResponse = (
  overrides?: Partial<EconomicImpactResponse>
): EconomicImpactResponse => ({
  report_id: TEST_REPORT_IDS.PENDING,
  status: 'pending',
  baseline_simulation: { id: 'sim-baseline', status: 'pending', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'pending', error_message: null },
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
});

/**
 * Mock v2 EconomicImpactResponse — running state
 */
export const mockEconomyRunningResponse = (
  overrides?: Partial<EconomicImpactResponse>
): EconomicImpactResponse => ({
  ...mockEconomyPendingResponse(),
  report_id: TEST_REPORT_IDS.RUNNING,
  status: 'running',
  baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'running', error_message: null },
  ...overrides,
});

/**
 * Mock v2 EconomicImpactResponse — completed state
 */
export const mockEconomyCompletedResponse = (
  overrides?: Partial<EconomicImpactResponse>
): EconomicImpactResponse => ({
  ...mockEconomyPendingResponse(),
  report_id: TEST_REPORT_IDS.COMPLETED,
  status: 'completed',
  baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
  budget_summary: [
    {
      id: 'bs-1',
      report_id: TEST_REPORT_IDS.COMPLETED,
      variable_name: 'household_tax',
      entity: 'household',
      baseline_total: 100000,
      reform_total: 115000,
      change: 15000,
    },
  ],
  ...overrides,
});

/**
 * Mock v2 EconomicImpactResponse — failed state
 */
export const mockEconomyFailedResponse = (
  overrides?: Partial<EconomicImpactResponse>
): EconomicImpactResponse => ({
  ...mockEconomyPendingResponse(),
  report_id: TEST_REPORT_IDS.FAILED,
  status: 'failed',
  error_message: 'Calculation failed due to invalid parameters',
  ...overrides,
});

/**
 * Mock household API response (successful)
 */
export const mockHouseholdSuccessResponse = (): Household => mockHouseholdResult();

/**
 * Mock ProgressTracker
 */
export const createMockProgressTracker = () => ({
  register: vi.fn(),
  getProgress: vi.fn(),
  complete: vi.fn(),
  fail: vi.fn(),
  isActive: vi.fn().mockReturnValue(false),
});
