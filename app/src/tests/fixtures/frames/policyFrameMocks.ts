import { vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { Policy } from '@/types/ingredients/Policy';
import { Parameter } from '@/types/subIngredients/parameter';
import { ValueInterval } from '@/types/subIngredients/valueInterval';

// Mock selector functions
export const mockSelectCurrentPosition = vi.fn();
export const mockSelectActivePolicy = vi.fn();

// Mock dispatch
export const mockDispatch = vi.fn();

// Mock navigation functions
export const mockOnNavigate = vi.fn();
export const mockOnReturn = vi.fn();

// Mock flow props
export const createMockFlowProps = (overrides?: Partial<any>) => ({
  onNavigate: mockOnNavigate,
  onReturn: mockOnReturn,
  flowConfig: {
    component: 'PolicyFrame' as any,
    on: {},
  },
  isInSubflow: false,
  flowDepth: 0,
  ...overrides,
});

// Mock policy data
export const MOCK_VALUE_INTERVAL: ValueInterval = {
  startDate: `${CURRENT_YEAR}-01-01`,
  endDate: `${CURRENT_YEAR}-12-31`,
  value: 0.25,
};

export const MOCK_PARAMETER: Parameter = {
  name: 'income_tax_rate',
  values: [MOCK_VALUE_INTERVAL],
};

export const MOCK_POLICY_WITH_PARAMS: Policy = {
  id: '123',
  countryId: 'us',
  label: 'Test Tax Policy',
  isCreated: false,
  parameters: [MOCK_PARAMETER],
};

export const MOCK_EMPTY_POLICY: Policy = {
  countryId: 'us',
  label: 'New Policy',
  isCreated: false,
  parameters: [],
};

// Mock API responses
export const mockCreatePolicySuccessResponse = {
  result: {
    policy_id: '123',
    status: 'ok',
  },
};

// Mock hooks
export const mockUseCreatePolicy = {
  createPolicy: vi.fn(),
  isPending: false,
  isError: false,
  error: null,
};

// Mock metadata for parameters
export const mockParameterMetadata = {
  name: 'income_tax_rate',
  parameter: 'income_tax_rate',
  label: 'Income tax rate',
  type: 'parameter',
  unit: '%',
  period: 'year',
  defaultValue: 0.2,
  minValue: 0,
  maxValue: 1,
  scale: 100,
};

// Mock report states for auto-naming tests
export const mockReportStateStandalone = {
  id: '',
  label: null,
  countryId: 'us' as const,
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  mode: 'standalone' as const,
  activeSimulationPosition: 0 as const,
};

export const mockReportStateReportWithName = {
  id: '456',
  label: '2025 Tax Analysis',
  countryId: 'us' as const,
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  mode: 'report' as const,
  activeSimulationPosition: 0 as const,
};

export const mockReportStateReportWithoutName = {
  id: '789',
  label: null,
  countryId: 'us' as const,
  apiVersion: null,
  simulationIds: [],
  status: 'pending' as const,
  output: null,
  mode: 'report' as const,
  activeSimulationPosition: 0 as const,
};

// Auto-naming test constants
export const TEST_REPORT_NAME = '2025 Tax Analysis';
export const EXPECTED_BASELINE_POLICY_LABEL = 'Baseline policy';
export const EXPECTED_REFORM_POLICY_LABEL = 'Reform policy';
export const EXPECTED_BASELINE_WITH_REPORT_LABEL = '2025 Tax Analysis baseline policy';
export const EXPECTED_REFORM_WITH_REPORT_LABEL = '2025 Tax Analysis reform policy';
