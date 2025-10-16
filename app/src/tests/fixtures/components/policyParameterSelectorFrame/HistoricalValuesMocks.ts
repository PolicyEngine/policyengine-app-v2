import { ParameterMetadata } from '@/types/metadata/parameterMetadata';
import { ValueIntervalCollection, ValuesList } from '@/types/subIngredients/valueInterval';

// Mock parameter metadata
export const MOCK_PARAM_USD: ParameterMetadata = {
  label: 'Standard Deduction',
  type: 'parameter',
  parameter: 'tax.deductions.standard',
  unit: 'currency-USD',
  description: 'Standard deduction amount',
  values: {
    '2020-01-01': 12000,
    '2021-01-01': 12550,
    '2022-01-01': 12950,
  },
};

export const MOCK_PARAM_PERCENTAGE: ParameterMetadata = {
  label: 'Tax Rate',
  type: 'parameter',
  parameter: 'tax.income.rate',
  unit: '/1',
  description: 'Income tax rate',
  values: {
    '2020-01-01': 0.22,
    '2021-01-01': 0.22,
    '2022-01-01': 0.24,
  },
};

export const MOCK_PARAM_BOOLEAN: ParameterMetadata = {
  label: 'Feature Enabled',
  type: 'parameter',
  parameter: 'features.newFeature',
  unit: 'bool',
  description: 'Whether the feature is enabled',
  values: {
    '2020-01-01': 0,
    '2022-01-01': 1,
  },
};

// Mock value collections for base values
export const MOCK_BASE_VALUES_USD: ValuesList = {
  '2020-01-01': 12000,
  '2021-01-01': 12550,
  '2022-01-01': 12950,
};

export const MOCK_BASE_VALUES_PERCENTAGE: ValuesList = {
  '2020-01-01': 0.22,
  '2021-01-01': 0.22,
  '2022-01-01': 0.24,
};

export const MOCK_BASE_VALUES_BOOLEAN: ValuesList = {
  '2020-01-01': 0,
  '2022-01-01': 1,
};

// Mock reform values
export const MOCK_REFORM_VALUES_USD: ValuesList = {
  '2020-01-01': 12000,
  '2023-01-01': 15000,
  '2024-01-01': 16000,
};

export const MOCK_REFORM_VALUES_PERCENTAGE: ValuesList = {
  '2020-01-01': 0.22,
  '2023-01-01': 0.20,
};

// Create value interval collections
export function createMockBaseCollection(values: ValuesList = MOCK_BASE_VALUES_USD) {
  return new ValueIntervalCollection(values);
}

export function createMockReformCollection(values: ValuesList = MOCK_REFORM_VALUES_USD) {
  return new ValueIntervalCollection(values);
}

// Expected chart data points (after extending to 2099)
export const EXPECTED_BASE_DATES = ['2020-01-01', '2021-01-01', '2022-01-01', '2099-12-31'];
export const EXPECTED_BASE_VALUES_USD = [12000, 12550, 12950, 12950];

export const EXPECTED_REFORM_DATES = ['2020-01-01', '2023-01-01', '2024-01-01', '2099-12-31'];
export const EXPECTED_REFORM_VALUES_USD = [12000, 15000, 16000, 16000];

// Expected formatted hover data
export const EXPECTED_FORMATTED_BASE = ['$12,000.00', '$12,550.00', '$12,950.00', '$12,950.00'];
export const EXPECTED_FORMATTED_REFORM = ['$12,000.00', '$15,000.00', '$16,000.00', '$16,000.00'];

// Expected chart colors
export const EXPECTED_REFORM_COLOR = '#2563eb';
export const EXPECTED_BASELINE_WITH_REFORM_COLOR = '#6b7280';
export const EXPECTED_BASELINE_NO_REFORM_COLOR = '#374151';

// Helper to check if dates array matches expected
export function expectDatesToMatch(actual: string[], expected: string[]) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((date, index) => {
    expect(date).toBe(expected[index]);
  });
}

// Helper to check if values array matches expected
export function expectValuesToMatch(actual: number[], expected: number[]) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => {
    expect(value).toBeCloseTo(expected[index], 2);
  });
}
