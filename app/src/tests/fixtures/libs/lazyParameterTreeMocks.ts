/**
 * Fixtures for lazyParameterTree tests
 */
import { ParameterMetadata } from '@/types/metadata';
import { LazyParameterTreeNode, ParameterTreeCache } from '@/libs/lazyParameterTree';

// Test paths
export const TEST_PATHS = {
  ROOT: 'gov',
  TAX: 'gov.tax',
  TAX_INCOME: 'gov.tax.income',
  TAX_INCOME_RATE: 'gov.tax.income.rate',
  BENEFIT: 'gov.benefit',
  BENEFIT_CHILD: 'gov.benefit.child',
  BRACKET_0: 'gov.tax.brackets[0]',
  BRACKET_1: 'gov.tax.brackets[1]',
  CALIBRATION: 'calibration.test',
  ABOLITIONS: 'gov.abolitions.test',
  TAXSIM: 'gov.taxsim.test',
  NON_GOV: 'other.test',
} as const;

// Mock parameter labels
export const TEST_LABELS = {
  INCOME_TAX_RATE: 'Income Tax Rate',
  CHILD_BENEFIT: 'Child Benefit Amount',
  BRACKET_1: 'Bracket 1',
  BRACKET_2: 'Bracket 2',
} as const;

// Factory function to create mock parameters
export function createMockParameter(overrides: Partial<ParameterMetadata> = {}): ParameterMetadata {
  return {
    parameter: 'gov.test.param',
    label: 'Test Parameter',
    type: 'parameter',
    values: {},
    ...overrides,
  };
}

// Mock parameters for tree building tests
export const MOCK_PARAMETERS_SIMPLE: Record<string, ParameterMetadata> = {
  [TEST_PATHS.TAX_INCOME_RATE]: createMockParameter({
    parameter: TEST_PATHS.TAX_INCOME_RATE,
    label: TEST_LABELS.INCOME_TAX_RATE,
    id: 'param-1',
    description: 'The rate of income tax',
    unit: 'percent',
  }),
  [TEST_PATHS.BENEFIT_CHILD]: createMockParameter({
    parameter: TEST_PATHS.BENEFIT_CHILD,
    label: TEST_LABELS.CHILD_BENEFIT,
    id: 'param-2',
    description: 'Child benefit amount',
    unit: 'currency-USD',
    economy: true,
    household: false,
  }),
};

// Mock parameters with nested structure
export const MOCK_PARAMETERS_NESTED: Record<string, ParameterMetadata> = {
  // Leaf parameters at various depths
  'gov.tax.income.rate': createMockParameter({
    parameter: 'gov.tax.income.rate',
    label: 'Income Rate',
    id: 'rate-1',
  }),
  'gov.tax.income.threshold': createMockParameter({
    parameter: 'gov.tax.income.threshold',
    label: 'Income Threshold',
    id: 'threshold-1',
  }),
  'gov.tax.capital.rate': createMockParameter({
    parameter: 'gov.tax.capital.rate',
    label: 'Capital Rate',
    id: 'rate-2',
  }),
  'gov.benefit.housing.amount': createMockParameter({
    parameter: 'gov.benefit.housing.amount',
    label: 'Housing Amount',
    id: 'amount-1',
  }),
};

// Mock parameters with bracket notation
export const MOCK_PARAMETERS_BRACKETS: Record<string, ParameterMetadata> = {
  'gov.tax.brackets[0]': createMockParameter({
    parameter: 'gov.tax.brackets[0]',
    label: 'First bracket',
    id: 'bracket-0',
  }),
  'gov.tax.brackets[1]': createMockParameter({
    parameter: 'gov.tax.brackets[1]',
    label: 'Second bracket',
    id: 'bracket-1',
  }),
  'gov.tax.brackets[2]': createMockParameter({
    parameter: 'gov.tax.brackets[2]',
    label: 'Third bracket',
    id: 'bracket-2',
  }),
};

// Mock parameters with excluded prefixes
export const MOCK_PARAMETERS_WITH_EXCLUDED: Record<string, ParameterMetadata> = {
  'gov.tax.rate': createMockParameter({
    parameter: 'gov.tax.rate',
    label: 'Tax Rate',
  }),
  'calibration.factor': createMockParameter({
    parameter: 'calibration.factor',
    label: 'Calibration Factor',
  }),
  'gov.abolitions.test': createMockParameter({
    parameter: 'gov.abolitions.test',
    label: 'Abolitions Test',
  }),
  'gov.taxsim.param': createMockParameter({
    parameter: 'gov.taxsim.param',
    label: 'Taxsim Param',
  }),
  'taxsim.value': createMockParameter({
    parameter: 'taxsim.value',
    label: 'Taxsim Value',
  }),
  'other.param': createMockParameter({
    parameter: 'other.param',
    label: 'Other Param',
  }),
};

// Empty parameters record
export const MOCK_PARAMETERS_EMPTY: Record<string, ParameterMetadata> = {};

// Expected node structures for assertions
export const EXPECTED_LEAF_NODE: LazyParameterTreeNode = {
  name: TEST_PATHS.TAX_INCOME_RATE,
  label: 'Income Tax Rate',
  type: 'parameter',
  id: 'param-1',
  parameter: TEST_PATHS.TAX_INCOME_RATE,
  description: 'The rate of income tax',
  unit: 'percent',
  values: {},
  economy: undefined,
  household: undefined,
};

export const EXPECTED_BRANCH_NODE: LazyParameterTreeNode = {
  name: TEST_PATHS.TAX,
  label: 'Tax',
  type: 'parameterNode',
};

// Helper to create a fresh cache for tests
export function createTestCache(): ParameterTreeCache {
  return new Map();
}

// Helper to pre-populate cache with entries
export function createPrefilledCache(
  entries: Array<[string, LazyParameterTreeNode[]]>
): ParameterTreeCache {
  return new Map(entries);
}

// Mock nodes for cache testing
export const MOCK_CACHED_NODES: LazyParameterTreeNode[] = [
  { name: 'gov.cached', label: 'Cached Node', type: 'parameterNode' },
];
