import { vi } from 'vitest';
import type { UserHouseholdAssociationV2Response } from '@/api/v2/userHouseholdAssociations';
import type { UserPolicyAssociationV2Response } from '@/api/v2/userPolicyAssociations';
import type { UserReportAssociationV2Response } from '@/api/v2/userReportAssociations';
import type { UserSimulationAssociationV2Response } from '@/api/v2/userSimulationAssociations';
import {
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_POLICY_IDS,
  TEST_REPORT_IDS,
  TEST_SIMULATION_IDS,
  TEST_TIMESTAMPS,
  TEST_USER_IDS,
} from '@/tests/fixtures/constants';

// Shared IDs
export const TEST_ASSOCIATION_IDS = {
  REPORT_ASSOC: 'ura-001',
  SIMULATION_ASSOC: 'usa-001',
  POLICY_ASSOC: 'upa-001',
  HOUSEHOLD_ASSOC: 'uha-001',
} as const;

export const TEST_HOUSEHOLD_IDS = {
  HH_001: 'hh-001',
  HH_002: 'hh-002',
} as const;

// Report association mocks
export const mockReportAssociationV2Response = (
  overrides?: Partial<UserReportAssociationV2Response>
): UserReportAssociationV2Response => ({
  id: TEST_ASSOCIATION_IDS.REPORT_ASSOC,
  user_id: TEST_USER_IDS.USER_123,
  report_id: TEST_REPORT_IDS.REPORT_JKL,
  country_id: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_REPORT,
  last_run_at: null,
  created_at: TEST_TIMESTAMPS.CREATED_AT,
  updated_at: TEST_TIMESTAMPS.UPDATED_AT,
  ...overrides,
});

// Simulation association mocks
export const mockSimulationAssociationV2Response = (
  overrides?: Partial<UserSimulationAssociationV2Response>
): UserSimulationAssociationV2Response => ({
  id: TEST_ASSOCIATION_IDS.SIMULATION_ASSOC,
  user_id: TEST_USER_IDS.USER_123,
  simulation_id: TEST_SIMULATION_IDS.SIM_DEF,
  country_id: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_SIMULATION,
  created_at: TEST_TIMESTAMPS.CREATED_AT,
  updated_at: TEST_TIMESTAMPS.UPDATED_AT,
  ...overrides,
});

// Policy association mocks
export const mockPolicyAssociationV2Response = (
  overrides?: Partial<UserPolicyAssociationV2Response>
): UserPolicyAssociationV2Response => ({
  id: TEST_ASSOCIATION_IDS.POLICY_ASSOC,
  user_id: TEST_USER_IDS.USER_123,
  policy_id: TEST_POLICY_IDS.POLICY_789,
  country_id: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_POLICY,
  created_at: TEST_TIMESTAMPS.CREATED_AT,
  updated_at: TEST_TIMESTAMPS.UPDATED_AT,
  ...overrides,
});

// Household association mocks
export const mockHouseholdAssociationV2Response = (
  overrides?: Partial<UserHouseholdAssociationV2Response>
): UserHouseholdAssociationV2Response => ({
  id: TEST_ASSOCIATION_IDS.HOUSEHOLD_ASSOC,
  user_id: TEST_USER_IDS.USER_123,
  household_id: TEST_HOUSEHOLD_IDS.HH_001,
  country_id: TEST_COUNTRIES.US,
  label: 'My Household',
  created_at: TEST_TIMESTAMPS.CREATED_AT,
  updated_at: TEST_TIMESTAMPS.UPDATED_AT,
  ...overrides,
});

// HTTP helpers
export const mockSuccessResponse = (data: any) => ({
  ok: true,
  status: 200,
  json: vi.fn().mockResolvedValue(data),
  text: vi.fn().mockResolvedValue(JSON.stringify(data)),
});

export const mockErrorResponse = (status: number, errorText = 'Server error') => ({
  ok: false,
  status,
  json: vi.fn().mockRejectedValue(new Error('Not JSON')),
  text: vi.fn().mockResolvedValue(errorText),
});

export const mockNotFoundResponse = () => ({
  ok: false,
  status: 404,
  json: vi.fn().mockRejectedValue(new Error('Not JSON')),
  text: vi.fn().mockResolvedValue('Not found'),
});

export const mockDeleteSuccessResponse = () => ({
  ok: true,
  status: 204,
});
