import type { HouseholdImpactResponse } from '@/api/v2/householdAnalysis';
import type { AggregatedCalcStatus } from '@/hooks/useAggregatedCalculationStatus';
import type { Household } from '@/types/ingredients/Household';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';
import type { CalcStatus } from '@/types/calculation';

/**
 * Mock Report for HouseholdReportOutput tests
 */
export const MOCK_REPORT: Report = {
  id: 'test-report-123',
  countryId: 'us',
  year: '2024',
  label: 'Test Household Report',
  simulationIds: ['sim-1', 'sim-2'],
  apiVersion: '1.0.0',
  status: 'complete',
  output: null,
};

/**
 * Mock Simulations for household tests
 */
export const MOCK_SIMULATION_BASELINE: Simulation = {
  id: 'sim-1',
  label: 'Baseline Simulation',
  countryId: 'us',
  populationType: 'household',
  populationId: 'hh-1',
  policyId: 'policy-1',
  status: 'complete',
  output: null,
  isCreated: true,
};

export const MOCK_SIMULATION_REFORM: Simulation = {
  id: 'sim-2',
  label: 'Reform Simulation',
  countryId: 'us',
  populationType: 'household',
  populationId: 'hh-1',
  policyId: 'policy-2',
  status: 'complete',
  output: null,
  isCreated: true,
};

/**
 * Mock Households
 */
export const MOCK_HOUSEHOLD: Household = {
  id: 'hh-1',
  tax_benefit_model_name: 'policyengine_us',
  year: 2024,
  people: [{ age: 30, employment_income: 50000 }],
  label: 'Test Household',
};

/**
 * Mock Policies
 */
export const MOCK_POLICY_BASELINE: Policy = {
  id: 'policy-1',
  countryId: 'us',
  label: 'Current Law',
  apiVersion: '1.0.0',
  parameters: [],
};

export const MOCK_POLICY_REFORM: Policy = {
  id: 'policy-2',
  countryId: 'us',
  label: 'Reform Policy',
  apiVersion: '1.0.0',
  parameters: [],
};

/**
 * Mock UserPolicies
 */
export const MOCK_USER_POLICY_BASELINE: UserPolicy = {
  id: 'user-policy-1',
  userId: 'user-123',
  policyId: 'policy-1',
  countryId: 'us',
  label: 'My Baseline',
  createdAt: '2024-01-01T00:00:00Z',
};

export const MOCK_USER_POLICY_REFORM: UserPolicy = {
  id: 'user-policy-2',
  userId: 'user-123',
  policyId: 'policy-2',
  countryId: 'us',
  label: 'My Reform',
  createdAt: '2024-01-01T00:00:00Z',
};

/**
 * Mock household output data (what comes back in HouseholdImpactResponse)
 */
export const MOCK_HOUSEHOLD_BASELINE_RESULT = {
  people: { you: { income_tax: { '2024': 5000 } } },
  households: { 'your household': { net_income: { '2024': 50000 } } },
};

export const MOCK_HOUSEHOLD_REFORM_RESULT = {
  people: { you: { income_tax: { '2024': 4000 } } },
  households: { 'your household': { net_income: { '2024': 51000 } } },
};

/**
 * Mock HouseholdImpactResponse objects (what CalcStatus.result holds)
 */
const MOCK_BASELINE_RESPONSE: HouseholdImpactResponse = {
  report_id: 'test-report-123',
  report_type: 'household',
  status: 'completed',
  baseline_simulation: { id: 'sim-1', status: 'completed', error_message: null },
  reform_simulation: null,
  baseline_result: MOCK_HOUSEHOLD_BASELINE_RESULT,
  reform_result: null,
  impact: null,
  error_message: null,
};

const MOCK_REFORM_RESPONSE: HouseholdImpactResponse = {
  report_id: 'test-report-123',
  report_type: 'household',
  status: 'completed',
  baseline_simulation: { id: 'sim-1', status: 'completed', error_message: null },
  reform_simulation: { id: 'sim-2', status: 'completed', error_message: null },
  baseline_result: MOCK_HOUSEHOLD_BASELINE_RESULT,
  reform_result: MOCK_HOUSEHOLD_REFORM_RESULT,
  impact: { income_tax: { baseline: 5000, reform: 4000, change: -1000 } },
  error_message: null,
};

/**
 * Mock CalcStatus objects with HouseholdImpactResponse results
 */
export const MOCK_CALC_STATUS_BASELINE_COMPLETE: CalcStatus = {
  status: 'complete',
  result: MOCK_BASELINE_RESPONSE,
  metadata: {
    calcId: 'sim-1',
    targetType: 'simulation',
    calcType: 'household',
    startedAt: Date.now(),
  },
};

export const MOCK_CALC_STATUS_REFORM_COMPLETE: CalcStatus = {
  status: 'complete',
  result: MOCK_REFORM_RESPONSE,
  metadata: {
    calcId: 'sim-2',
    targetType: 'simulation',
    calcType: 'household',
    startedAt: Date.now(),
  },
};

/**
 * Mock AggregatedCalcStatus return values for useCalculationStatus
 */
export const MOCK_AGG_STATUS_INITIALIZING: AggregatedCalcStatus = {
  status: 'initializing',
  calculations: [],
  isInitializing: true,
  isIdle: false,
  isPending: false,
  isComplete: false,
  isError: false,
  isLoading: true,
};

export const MOCK_AGG_STATUS_PENDING: AggregatedCalcStatus = {
  status: 'pending',
  calculations: [],
  progress: 45,
  isInitializing: false,
  isIdle: false,
  isPending: true,
  isComplete: false,
  isError: false,
  message: 'Computing household impacts...',
  isLoading: false,
};

export const MOCK_AGG_STATUS_COMPLETE: AggregatedCalcStatus = {
  status: 'complete',
  calculations: [MOCK_CALC_STATUS_BASELINE_COMPLETE, MOCK_CALC_STATUS_REFORM_COMPLETE],
  isInitializing: false,
  isIdle: false,
  isPending: false,
  isComplete: true,
  isError: false,
  isLoading: false,
};

export const MOCK_AGG_STATUS_COMPLETE_SINGLE: AggregatedCalcStatus = {
  status: 'complete',
  calculations: [MOCK_CALC_STATUS_BASELINE_COMPLETE],
  isInitializing: false,
  isIdle: false,
  isPending: false,
  isComplete: true,
  isError: false,
  isLoading: false,
};

export const MOCK_AGG_STATUS_ERROR: AggregatedCalcStatus = {
  status: 'error',
  calculations: [],
  isInitializing: false,
  isIdle: false,
  isPending: false,
  isComplete: false,
  isError: true,
  error: { message: 'Household calculation failed', code: 'CALC_ERROR', retryable: true },
  isLoading: false,
};

export const MOCK_AGG_STATUS_IDLE: AggregatedCalcStatus = {
  status: 'idle',
  calculations: [],
  isInitializing: false,
  isIdle: true,
  isPending: false,
  isComplete: false,
  isError: false,
  isLoading: false,
};
