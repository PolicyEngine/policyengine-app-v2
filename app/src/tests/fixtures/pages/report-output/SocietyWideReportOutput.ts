import type { Geography } from '@/types/ingredients/Geography';
import type { Policy } from '@/types/ingredients/Policy';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';

/**
 * Mock Report for SocietyWideReportOutput tests
 */
export const MOCK_REPORT: Report = {
  id: 'test-report-123',
  countryId: 'us',
  year: '2024',
  label: 'Test Society-Wide Report',
  simulationIds: ['sim-1', 'sim-2'],
  apiVersion: '1.0.0',
  status: 'complete',
  output: null,
};

/**
 * Mock Simulations for SocietyWideReportOutput tests
 */
export const MOCK_SIMULATION_BASELINE: Simulation = {
  id: 'sim-1',
  label: 'Baseline Simulation',
  countryId: 'us',
  populationType: 'geography',
  populationId: 'us',
  policyId: 'policy-1',
  status: 'complete',
  output: null,
  isCreated: true,
};

export const MOCK_SIMULATION_REFORM: Simulation = {
  id: 'sim-2',
  label: 'Reform Simulation',
  countryId: 'us',
  populationType: 'geography',
  populationId: 'us',
  policyId: 'policy-2',
  status: 'complete',
  output: null,
  isCreated: true,
};

/**
 * Mock Policies for SocietyWideReportOutput tests
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
 * Mock UserPolicies for SocietyWideReportOutput tests
 */
export const MOCK_USER_POLICY: UserPolicy = {
  id: 'user-policy-1',
  userId: 'user-123',
  policyId: 'policy-1',
  countryId: 'us',
  label: 'My Policy',
  createdAt: '2024-01-01T00:00:00Z',
};

/**
 * Mock Geographies for SocietyWideReportOutput tests
 */
export const MOCK_GEOGRAPHY: Geography = {
  countryId: 'us',
  regionCode: 'us',
};

/**
 * Mock society-wide calculation output
 */
export const MOCK_SOCIETY_WIDE_OUTPUT = {
  budget: {
    budgetary_impact: 1000000,
    baseline_net_income: 5_000_000_000,
    benefit_spending_impact: 500_000,
    households: 10000,
    state_tax_revenue_impact: 200_000,
    tax_revenue_impact: 300_000,
  },
  poverty: {
    baseline: {},
    reform: {},
    poverty: {
      all: { baseline: 0.1, reform: 0.09 },
    },
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.2,
      'Gain less than 5%': 0.1,
      'Lose more than 5%': 0.05,
      'Lose less than 5%': 0.05,
      'No change': 0.6,
    },
  },
};

/**
 * Mock calculation status return values
 */
export const MOCK_CALC_STATUS_INITIALIZING = {
  status: 'initializing' as const,
  isInitializing: true,
  isPending: false,
  isComplete: false,
  isError: false,
  result: null,
  error: null,
  progress: 0,
};

export const MOCK_CALC_STATUS_PENDING = {
  status: 'pending' as const,
  isInitializing: false,
  isPending: true,
  isComplete: false,
  isError: false,
  result: null,
  error: null,
  progress: 50,
};

export const MOCK_CALC_STATUS_COMPLETE = {
  status: 'complete' as const,
  isInitializing: false,
  isPending: false,
  isComplete: true,
  isError: false,
  result: MOCK_SOCIETY_WIDE_OUTPUT,
  error: null,
  progress: 100,
};

export const MOCK_CALC_STATUS_ERROR = {
  status: 'error' as const,
  isInitializing: false,
  isPending: false,
  isComplete: false,
  isError: true,
  result: null,
  error: { message: 'Calculation failed', code: 'CALC_ERROR', retryable: true },
  progress: 0,
};

export const MOCK_CALC_STATUS_IDLE = {
  status: 'idle' as const,
  isInitializing: false,
  isPending: false,
  isComplete: false,
  isError: false,
  result: null,
  error: null,
  progress: 0,
};
