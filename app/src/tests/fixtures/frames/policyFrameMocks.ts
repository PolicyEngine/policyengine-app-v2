import { vi } from 'vitest';
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
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  value: 0.25,
};

export const MOCK_PARAMETER: Parameter = {
  name: 'income_tax_rate',
  values: [MOCK_VALUE_INTERVAL],
};

export const MOCK_POLICY_WITH_PARAMS: Policy = {
  id: 'policy-123',
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
    policy_id: 'policy-123',
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