import { QueryClient } from '@tanstack/react-query';
import type { EconomicImpactResponse } from '@/api/v2/economyAnalysis';
import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import type { CalcStatus } from '@/types/calculation';

/**
 * Test constants for calc IDs
 */
export const TEST_CALC_IDS = {
  REPORT_123: 'report-123',
  SIM_1: 'sim-1',
  SIM_2: 'sim-2',
  SIM_456: 'sim-456',
} as const;

/**
 * Test constants for countries
 */
export const TEST_COUNTRIES = {
  US: 'us',
} as const;

/**
 * Test constants for years
 */
export const TEST_YEARS = {
  DEFAULT: '2024',
} as const;

/**
 * Test v2 report IDs (UUIDs from analysis API)
 */
export const TEST_V2_REPORT_IDS = {
  ECONOMY: 'v2-economy-report-abc',
  HOUSEHOLD: 'v2-household-report-def',
} as const;

/**
 * Create a test QueryClient
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

/**
 * Mock v2 economy analysis result (EconomicImpactResponse)
 */
export const mockEconomyAnalysisResult = (
  overrides?: Partial<EconomicImpactResponse>
): EconomicImpactResponse =>
  ({
    report_id: TEST_V2_REPORT_IDS.ECONOMY,
    report_type: 'economy_comparison',
    status: 'completed',
    baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
    reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
    budget: { budgetary_impact: -25000 },
    decile: { average: {}, relative: {} },
    error_message: null,
    ...overrides,
  }) as EconomicImpactResponse;

/**
 * Mock v2 household analysis result (HouseholdImpactResponse)
 */
export const mockHouseholdAnalysisResult = (
  overrides?: Partial<HouseholdImpactResponse>
): HouseholdImpactResponse => ({
  report_id: TEST_V2_REPORT_IDS.HOUSEHOLD,
  report_type: 'household',
  status: 'completed',
  baseline_simulation: { id: 'sim-baseline', status: 'completed', error_message: null },
  reform_simulation: { id: 'sim-reform', status: 'completed', error_message: null },
  baseline_result: { person: [{ net_income: 42000 }] },
  reform_result: { person: [{ net_income: 44000 }] },
  impact: { person: [{ net_income: 2000 }] },
  error_message: null,
  ...overrides,
});

/**
 * Mock complete CalcStatus for v2 economy analysis
 */
export const mockCompleteEconomyStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'complete',
  result: mockEconomyAnalysisResult(),
  metadata: {
    calcId: TEST_CALC_IDS.REPORT_123,
    targetType: 'report',
    calcType: 'societyWide',
    startedAt: Date.now(),
  },
  ...overrides,
});

/**
 * Mock complete CalcStatus for v2 household analysis
 */
export const mockCompleteHouseholdStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'complete',
  result: mockHouseholdAnalysisResult(),
  metadata: {
    calcId: TEST_CALC_IDS.SIM_456,
    targetType: 'simulation',
    calcType: 'household',
    startedAt: Date.now(),
  },
  ...overrides,
});
