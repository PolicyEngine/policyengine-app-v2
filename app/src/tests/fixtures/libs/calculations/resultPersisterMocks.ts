import { QueryClient } from '@tanstack/react-query';
import {
  mockHouseholdResult,
  mockSocietyWideResult,
} from '@/tests/fixtures/types/calculationFixtures';
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
 * Create a test QueryClient
 */
export const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

/**
 * Mock complete CalcStatus for society-wide report
 */
export const mockCompleteSocietyWideStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'complete',
  result: mockSocietyWideResult(),
  metadata: {
    calcId: TEST_CALC_IDS.REPORT_123,
    targetType: 'report',
    calcType: 'societyWide',
    startedAt: Date.now(),
  },
  ...overrides,
});

/**
 * Mock complete CalcStatus for household simulation
 */
export const mockCompleteHouseholdStatus = (overrides?: Partial<CalcStatus>): CalcStatus => ({
  status: 'complete',
  result: mockHouseholdResult(),
  metadata: {
    calcId: TEST_CALC_IDS.SIM_456,
    targetType: 'simulation',
    calcType: 'household',
    startedAt: Date.now(),
  },
  ...overrides,
});

/**
 * Mock complete CalcStatus for household simulation with reportId
 */
export const mockCompleteHouseholdStatusWithReport = (
  simId: string,
  overrides?: Partial<CalcStatus>
): CalcStatus => ({
  status: 'complete',
  result: mockHouseholdResult(),
  metadata: {
    calcId: simId,
    targetType: 'simulation',
    calcType: 'household',
    reportId: TEST_CALC_IDS.REPORT_123,
    startedAt: Date.now(),
  },
  ...overrides,
});

/**
 * Mock pending CalcStatus
 */
export const mockPendingStatus = (simId: string): CalcStatus => ({
  status: 'pending',
  metadata: {
    calcId: simId,
    targetType: 'simulation',
    calcType: 'household',
    startedAt: Date.now(),
  },
});
