import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserReport } from '@/types/ingredients/UserReport';
import { UserSimulation } from '@/types/ingredients/UserSimulation';
import { UserPolicyMetadata } from '@/types/metadata/userPolicyMetadata';
import { UserReportCreationPayload, UserSimulationCreationPayload } from '@/types/payloads';
import {
  TEST_COUNTRIES,
  TEST_LABELS,
  TEST_POLICY_IDS,
  TEST_REPORT_IDS,
  TEST_SIMULATION_IDS,
  TEST_TIMESTAMPS,
  TEST_USER_IDS,
} from '../constants';

// UserPolicy fixtures
export const mockUserPolicyUS: UserPolicy = {
  id: 'user-policy-123', // Association ID from backend
  userId: TEST_USER_IDS.USER_123,
  policyId: TEST_POLICY_IDS.POLICY_789,
  label: TEST_LABELS.MY_POLICY,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
  isCreated: true,
};

export const mockUserPolicyUK: UserPolicy = {
  ...mockUserPolicyUS,
  id: 'user-policy-456', // Association ID from backend
  policyId: TEST_POLICY_IDS.POLICY_ABC,
};

export const mockUserPolicyWithoutOptionalFields: Omit<UserPolicy, 'id' | 'createdAt'> = {
  userId: TEST_USER_IDS.USER_123,
  policyId: TEST_POLICY_IDS.POLICY_789,
  isCreated: true,
};

export const mockUserPolicyCreationPayload = {
  user_id: TEST_USER_IDS.USER_123,
  policy_id: TEST_POLICY_IDS.POLICY_789,
  label: TEST_LABELS.MY_POLICY,
};

export const mockUserPolicyApiResponse: UserPolicyMetadata = {
  id: 'user-policy-123',
  policy_id: TEST_POLICY_IDS.POLICY_789,
  user_id: TEST_USER_IDS.USER_123,
  label: TEST_LABELS.MY_POLICY,
  created_at: TEST_TIMESTAMPS.CREATED_AT,
  updated_at: TEST_TIMESTAMPS.UPDATED_AT,
};

// UserSimulation fixtures
export const mockUserSimulationUS: UserSimulation = {
  id: 'us-sim-def',
  userId: TEST_USER_IDS.USER_123,
  simulationId: TEST_SIMULATION_IDS.SIM_DEF,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_SIMULATION,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
  isCreated: true,
};

export const mockUserSimulationUK: UserSimulation = {
  ...mockUserSimulationUS,
  id: 'us-sim-ghi',
  simulationId: TEST_SIMULATION_IDS.SIM_GHI,
  countryId: TEST_COUNTRIES.UK,
};

export const mockUserSimulationWithoutOptionalFields: Omit<UserSimulation, 'id' | 'createdAt'> = {
  userId: TEST_USER_IDS.USER_123,
  simulationId: TEST_SIMULATION_IDS.SIM_DEF,
  countryId: TEST_COUNTRIES.US,
  isCreated: true,
};

export const mockUserSimulationCreationPayload: UserSimulationCreationPayload = {
  userId: TEST_USER_IDS.USER_123,
  simulationId: TEST_SIMULATION_IDS.SIM_DEF,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_SIMULATION,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
};

export const mockUserSimulationApiResponse = {
  id: 'us-sim-def',
  userId: TEST_USER_IDS.USER_123,
  simulationId: TEST_SIMULATION_IDS.SIM_DEF,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_SIMULATION,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
};

// UserReport fixtures
export const mockUserReportUS: UserReport = {
  id: 'ur-report-jkl',
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_JKL,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_REPORT,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
  isCreated: true,
};

export const mockUserReportUK: UserReport = {
  ...mockUserReportUS,
  id: 'ur-report-mno',
  reportId: TEST_REPORT_IDS.REPORT_MNO,
  countryId: TEST_COUNTRIES.UK,
};

export const mockUserReportWithoutOptionalFields: Omit<UserReport, 'id' | 'createdAt'> = {
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_JKL,
  countryId: TEST_COUNTRIES.US,
  isCreated: true,
};

export const mockUserReportCreationPayload: UserReportCreationPayload = {
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_JKL,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_REPORT,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
};

export const mockUserReportApiResponse = {
  id: 'ur-report-jkl',
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_JKL,
  countryId: TEST_COUNTRIES.US,
  label: TEST_LABELS.MY_REPORT,
  createdAt: TEST_TIMESTAMPS.CREATED_AT,
  updatedAt: TEST_TIMESTAMPS.UPDATED_AT,
};
