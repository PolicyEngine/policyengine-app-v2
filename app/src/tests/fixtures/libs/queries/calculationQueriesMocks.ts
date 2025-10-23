import { vi } from 'vitest';
import type { CalcMetadata, CalcParams } from '@/types/calculation';

export const TEST_CALC_IDS = {
  REPORT_123: 'report-123',
  REPORT_456: 'report-456',
  SIM_123: 'sim-123',
  SIM_456: 'sim-456',
} as const;

export const TEST_POLICY_IDS = {
  POLICY_1: 'policy-1',
  POLICY_2: 'policy-2',
} as const;

export const TEST_POPULATION_IDS = {
  HOUSEHOLD_123: 'household-123',
  US: 'us',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
} as const;

export const createMockStrategy = (refetchInterval: number | false = 2000) => ({
  execute: vi.fn().mockResolvedValue({
    status: 'complete',
    result: { data: 'test' },
  }),
  getRefetchConfig: vi.fn().mockReturnValue({
    refetchInterval,
  }),
});

export const mockSocietyWideMetadata = (calcId: string = TEST_CALC_IDS.REPORT_123): CalcMetadata => ({
  calcId,
  calcType: 'societyWide',
  targetType: 'report',
  startedAt: Date.now(),
});

export const mockHouseholdMetadata = (calcId: string = TEST_CALC_IDS.SIM_456): CalcMetadata => ({
  calcId,
  calcType: 'household',
  targetType: 'simulation',
  startedAt: Date.now(),
  reportId: TEST_CALC_IDS.REPORT_123,
});

export const mockSocietyWideParams = (calcId: string = TEST_CALC_IDS.REPORT_123): CalcParams => ({
  countryId: TEST_COUNTRIES.US,
  calcType: 'societyWide',
  policyIds: {
    baseline: TEST_POLICY_IDS.POLICY_1,
    reform: TEST_POLICY_IDS.POLICY_2,
  },
  populationId: TEST_POPULATION_IDS.US,
  region: TEST_POPULATION_IDS.US,
  calcId,
});

export const mockHouseholdParams = (calcId: string = TEST_CALC_IDS.SIM_456): CalcParams => ({
  countryId: TEST_COUNTRIES.US,
  calcType: 'household',
  policyIds: {
    baseline: TEST_POLICY_IDS.POLICY_1,
  },
  populationId: TEST_POPULATION_IDS.HOUSEHOLD_123,
  calcId,
});
