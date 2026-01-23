/**
 * Fixtures for LazyNestedMenu component tests
 */
import { vi } from 'vitest';
import { LazyMenuNode } from '@/components/common/LazyNestedMenu';

// Test node names
export const TEST_NODE_NAMES = {
  TAX: 'gov.tax',
  BENEFIT: 'gov.benefit',
  INCOME_TAX: 'gov.tax.income',
  CAPITAL_TAX: 'gov.tax.capital',
  TAX_RATE: 'gov.tax.rate',
  HOUSING_BENEFIT: 'gov.benefit.housing',
} as const;

// Test node labels
export const TEST_NODE_LABELS = {
  TAX: 'Tax',
  BENEFIT: 'Benefit',
  INCOME_TAX: 'Income tax',
  CAPITAL_TAX: 'Capital tax',
  TAX_RATE: 'Tax rate',
  HOUSING_BENEFIT: 'Housing benefit',
} as const;

// Factory to create mock menu node
export function createMockNode(
  overrides: Partial<LazyMenuNode> = {}
): LazyMenuNode {
  return {
    name: 'gov.test',
    label: 'Test',
    type: 'parameterNode',
    ...overrides,
  };
}

// Root level nodes (branches)
export const MOCK_ROOT_NODES: LazyMenuNode[] = [
  createMockNode({
    name: TEST_NODE_NAMES.TAX,
    label: TEST_NODE_LABELS.TAX,
    type: 'parameterNode',
  }),
  createMockNode({
    name: TEST_NODE_NAMES.BENEFIT,
    label: TEST_NODE_LABELS.BENEFIT,
    type: 'parameterNode',
  }),
];

// Tax children (mix of branches and leaves)
export const MOCK_TAX_CHILDREN: LazyMenuNode[] = [
  createMockNode({
    name: TEST_NODE_NAMES.INCOME_TAX,
    label: TEST_NODE_LABELS.INCOME_TAX,
    type: 'parameterNode',
  }),
  createMockNode({
    name: TEST_NODE_NAMES.CAPITAL_TAX,
    label: TEST_NODE_LABELS.CAPITAL_TAX,
    type: 'parameterNode',
  }),
  createMockNode({
    name: TEST_NODE_NAMES.TAX_RATE,
    label: TEST_NODE_LABELS.TAX_RATE,
    type: 'parameter',
  }),
];

// Benefit children (leaves only)
export const MOCK_BENEFIT_CHILDREN: LazyMenuNode[] = [
  createMockNode({
    name: TEST_NODE_NAMES.HOUSING_BENEFIT,
    label: TEST_NODE_LABELS.HOUSING_BENEFIT,
    type: 'parameter',
  }),
];

// Leaf-only nodes for simple tests
export const MOCK_LEAF_NODES: LazyMenuNode[] = [
  createMockNode({
    name: 'gov.param1',
    label: 'Parameter 1',
    type: 'parameter',
  }),
  createMockNode({
    name: 'gov.param2',
    label: 'Parameter 2',
    type: 'parameter',
  }),
];

// Empty nodes array
export const MOCK_EMPTY_NODES: LazyMenuNode[] = [];

// Single node for focused tests
export const MOCK_SINGLE_BRANCH_NODE: LazyMenuNode[] = [
  createMockNode({
    name: TEST_NODE_NAMES.TAX,
    label: TEST_NODE_LABELS.TAX,
    type: 'parameterNode',
  }),
];

export const MOCK_SINGLE_LEAF_NODE: LazyMenuNode[] = [
  createMockNode({
    name: TEST_NODE_NAMES.TAX_RATE,
    label: TEST_NODE_LABELS.TAX_RATE,
    type: 'parameter',
  }),
];

// Factory to create mock getChildren function
export function createMockGetChildren(
  childrenMap: Record<string, LazyMenuNode[]> = {}
): (path: string) => LazyMenuNode[] {
  const defaultMap: Record<string, LazyMenuNode[]> = {
    [TEST_NODE_NAMES.TAX]: MOCK_TAX_CHILDREN,
    [TEST_NODE_NAMES.BENEFIT]: MOCK_BENEFIT_CHILDREN,
    [TEST_NODE_NAMES.INCOME_TAX]: [],
    [TEST_NODE_NAMES.CAPITAL_TAX]: [],
  };

  const mergedMap = { ...defaultMap, ...childrenMap };

  return vi.fn((path: string) => mergedMap[path] || []);
}

// Factory to create mock onParameterClick handler
export function createMockOnParameterClick() {
  return vi.fn();
}
