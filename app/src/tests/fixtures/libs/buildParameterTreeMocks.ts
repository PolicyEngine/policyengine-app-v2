import { CURRENT_YEAR } from '@/constants';
import { ParameterTreeNode } from '@/libs/buildParameterTree';

// Test constants
export const TEST_PARAMETER_NAME = 'gov.tax.income_tax';
export const TEST_PARAMETER_LABEL = 'Income Tax';
export const TEST_BRACKET_NAME = 'gov.tax.brackets[0]';
export const TEST_UNIT = 'currency-GBP';
export const TEST_DESCRIPTION = 'Tax on income';
export const TEST_PERIOD = CURRENT_YEAR;

// Mock parameters - Simple flat structure
export const mockSimpleParameters = {
  'gov.tax.income_tax': {
    parameter: 'gov.tax.income_tax',
    label: 'income_tax',
    description: TEST_DESCRIPTION,
    unit: TEST_UNIT,
    period: TEST_PERIOD,
    values: { [CURRENT_YEAR]: 0.2 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 0,
  },
  'gov.benefit.child_benefit': {
    parameter: 'gov.benefit.child_benefit',
    label: 'child_benefit',
    description: 'Benefit for children',
    unit: 'currency-GBP',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 100 },
    economy: false,
    household: true,
    type: 'parameter' as const,
    indexInModule: 1,
  },
};

// Mock parameters - Nested structure
export const mockNestedParameters = {
  gov: {
    parameter: 'gov',
    label: 'Government',
    type: 'parameterNode' as const,
  },
  'gov.tax': {
    parameter: 'gov.tax',
    label: 'Taxation',
    type: 'parameterNode' as const,
  },
  'gov.tax.income_tax': {
    parameter: 'gov.tax.income_tax',
    label: 'income_tax',
    description: TEST_DESCRIPTION,
    unit: TEST_UNIT,
    period: TEST_PERIOD,
    values: { [CURRENT_YEAR]: 0.2 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 1,
  },
  'gov.tax.capital_gains': {
    parameter: 'gov.tax.capital_gains',
    label: 'capital_gains',
    description: 'Tax on capital gains',
    unit: 'currency-GBP',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 0.15 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 0,
  },
  'gov.benefit': {
    parameter: 'gov.benefit',
    label: 'Benefits',
    type: 'parameterNode' as const,
  },
  'gov.benefit.child_benefit': {
    parameter: 'gov.benefit.child_benefit',
    label: 'child_benefit',
    description: 'Benefit for children',
    unit: 'currency-GBP',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 100 },
    economy: false,
    household: true,
    type: 'parameter' as const,
    indexInModule: 0,
  },
};

// Mock parameters with brackets (tax brackets)
export const mockBracketParameters = {
  'gov.tax.brackets[0]': {
    parameter: 'gov.tax.brackets[0]',
    label: 'First bracket',
    description: 'First tax bracket',
    unit: 'currency-GBP',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 12570 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 0,
  },
  'gov.tax.brackets[1]': {
    parameter: 'gov.tax.brackets[1]',
    label: 'Second bracket',
    description: 'Second tax bracket',
    unit: 'currency-GBP',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 50270 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 1,
  },
  'gov.tax.brackets[2]': {
    parameter: 'gov.tax.brackets[2]',
    label: 'Third bracket',
    description: 'Third tax bracket',
    unit: 'currency-GBP',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 125140 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 2,
  },
};

// Mock parameters with items to be filtered (taxsim, abolitions)
export const mockFilteredParameters = {
  'gov.tax.income_tax': {
    parameter: 'gov.tax.income_tax',
    label: 'income_tax',
    description: TEST_DESCRIPTION,
    unit: TEST_UNIT,
    period: TEST_PERIOD,
    values: { [CURRENT_YEAR]: 0.2 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 0,
  },
  'gov.taxsim.something': {
    parameter: 'gov.taxsim.something',
    label: 'Taxsim parameter',
    description: 'Should be filtered out',
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 1,
  },
  'gov.abolitions.policy': {
    parameter: 'gov.abolitions.policy',
    label: 'Abolition policy',
    description: 'Should be filtered out',
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 2,
  },
};

// Mock parameters with neither economy nor household flags
export const mockNonApplicableParameters = {
  'gov.internal.config': {
    parameter: 'gov.internal.config',
    label: 'Internal config',
    description: 'Internal configuration',
    economy: false,
    household: false,
    type: 'parameter' as const,
    indexInModule: 0,
  },
  'gov.tax.income_tax': {
    parameter: 'gov.tax.income_tax',
    label: 'income_tax',
    description: TEST_DESCRIPTION,
    unit: TEST_UNIT,
    period: TEST_PERIOD,
    values: { [CURRENT_YEAR]: 0.2 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 1,
  },
};

// Mock empty parameters
export const mockEmptyParameters = {};

// Mock parameters without gov prefix
export const mockNonGovParameters = {
  'other.tax.income': {
    parameter: 'other.tax.income',
    label: 'Other income tax',
    description: 'Non-gov parameter',
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 0,
  },
};

// Mock parameters with special characters in labels
export const mockSpecialCharParameters = {
  'gov.tax.income_tax_rate': {
    parameter: 'gov.tax.income_tax_rate',
    label: 'income_tax_rate',
    description: 'Tax rate with underscores',
    unit: 'percent',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 0.2 },
    economy: true,
    household: false,
    type: 'parameter' as const,
    indexInModule: 0,
  },
  'gov.benefit.child_care_support': {
    parameter: 'gov.benefit.child_care_support',
    label: 'child_care_support',
    description: 'Support for child care',
    unit: 'currency-GBP',
    period: CURRENT_YEAR,
    values: { [CURRENT_YEAR]: 500 },
    economy: false,
    household: true,
    type: 'parameter' as const,
    indexInModule: 1,
  },
};

// Expected tree outputs
export const expectedSimpleTree: ParameterTreeNode = {
  name: 'gov',
  label: 'Gov',
  index: 0,
  children: [
    {
      name: 'gov.benefit',
      label: 'Benefit',
      index: 0,
      children: [
        {
          name: 'gov.benefit.child_benefit',
          label: 'Child benefit',
          index: 1,
          type: 'parameter',
          parameter: 'gov.benefit.child_benefit',
          description: 'Benefit for children',
          unit: 'currency-GBP',
          period: CURRENT_YEAR,
          values: { [CURRENT_YEAR]: 100 },
          economy: false,
          household: true,
        },
      ],
      type: 'parameterNode',
    },
    {
      name: 'gov.tax',
      label: 'Tax',
      index: 0,
      children: [
        {
          name: 'gov.tax.income_tax',
          label: 'Income tax',
          index: 0,
          type: 'parameter',
          parameter: 'gov.tax.income_tax',
          description: TEST_DESCRIPTION,
          unit: TEST_UNIT,
          period: TEST_PERIOD,
          values: { [CURRENT_YEAR]: 0.2 },
          economy: true,
          household: false,
        },
      ],
      type: 'parameterNode',
    },
  ],
  type: 'parameterNode',
};


// Mock parameters for alphabetical sorting test
export const mockAlphabeticalParameters = {
  'gov.zebra': {
    parameter: 'gov.zebra',
    label: 'zebra',
    economy: true,
    household: false,
    type: 'parameter' as const,
  },
  'gov.apple': {
    parameter: 'gov.apple',
    label: 'apple',
    economy: true,
    household: false,
    type: 'parameter' as const,
  },
  'gov.banana': {
    parameter: 'gov.banana',
    label: 'banana',
    economy: true,
    household: false,
    type: 'parameter' as const,
  },
};

// Expected sorted labels
export const EXPECTED_SORTED_LABELS = ['Apple', 'Banana', 'Zebra'];

// Mock parameters with custom labels
export const mockCustomLabelParameters = {
  'gov.tax': {
    parameter: 'gov.tax',
    label: 'Taxation System',
    type: 'parameterNode' as const,
  },
  'gov.tax.income': {
    parameter: 'gov.tax.income',
    label: 'Personal Income Tax',
    economy: true,
    household: false,
    type: 'parameter' as const,
  },
};

// Expected custom labels
export const EXPECTED_TAXATION_LABEL = 'Taxation System';
export const EXPECTED_PERSONAL_INCOME_LABEL = 'Personal Income Tax';

// Mock deeply nested parameters
export const mockDeepNestedParameters = {
  'gov.tax.income.personal.allowance': {
    parameter: 'gov.tax.income.personal.allowance',
    label: 'Personal Allowance',
    economy: true,
    household: false,
    type: 'parameter' as const,
    values: { [CURRENT_YEAR]: 12570 },
  },
};

// Expected deep nested labels
export const EXPECTED_TAX_LABEL = 'Tax';
export const EXPECTED_INCOME_LABEL = 'Income';
export const EXPECTED_PERSONAL_LABEL = 'Personal';
export const EXPECTED_ALLOWANCE_LABEL = 'Personal Allowance';

// Mock parameters with bracket indices for intermediate node test
export const mockBracketIndicesParameters = {
  'gov.tax.rates[0].threshold': {
    parameter: 'gov.tax.rates[0].threshold',
    label: 'threshold',
    economy: true,
    household: false,
    type: 'parameter' as const,
    values: { [CURRENT_YEAR]: 0 },
  },
  'gov.tax.rates[1].threshold': {
    parameter: 'gov.tax.rates[1].threshold',
    label: 'threshold',
    economy: true,
    household: false,
    type: 'parameter' as const,
    values: { [CURRENT_YEAR]: 12570 },
  },
};

// Expected bracket labels for intermediate nodes
export const EXPECTED_BRACKET_1_LABEL = 'Bracket 1';
export const EXPECTED_BRACKET_2_LABEL = 'Bracket 2';
export const EXPECTED_BRACKET_3_LABEL = 'Bracket 3';

// Expected node names
export const GOV_NODE_NAME = 'gov';
export const GOV_TAX_NODE_NAME = 'gov.tax';
export const GOV_BENEFIT_NODE_NAME = 'gov.benefit';
export const GOV_TAX_BRACKETS_NODE_NAME = 'gov.tax.brackets';
export const GOV_TAX_RATES_NODE_NAME = 'gov.tax.rates';
export const GOV_TAX_INCOME_NODE_NAME = 'gov.tax.income';
export const GOV_TAX_INCOME_PERSONAL_NODE_NAME = 'gov.tax.income.personal';
export const GOV_TAX_INCOME_PERSONAL_ALLOWANCE_NODE_NAME = 'gov.tax.income.personal.allowance';
export const GOV_TAXSIM_NODE_NAME = 'gov.taxsim';
export const GOV_ABOLITIONS_NODE_NAME = 'gov.abolitions';
export const GOV_INTERNAL_NODE_NAME = 'gov.internal';

// Expected labels
export const EXPECTED_GOV_LABEL = 'Gov';
export const EXPECTED_GOVERNMENT_LABEL = 'Government';
export const EXPECTED_TAXATION_NODE_LABEL = 'Taxation';
export const EXPECTED_BENEFITS_LABEL = 'Benefits';
export const EXPECTED_BRACKETS_LABEL = 'Brackets';
export const EXPECTED_INCOME_TAX_LABEL = 'Income tax';
export const EXPECTED_CHILD_BENEFIT_LABEL = 'Child benefit';
export const EXPECTED_INCOME_TAX_RATE_LABEL = 'Income tax rate';
export const EXPECTED_CHILD_CARE_SUPPORT_LABEL = 'Child care support';
export const EXPECTED_FIRST_BRACKET_LABEL = 'First bracket';
export const EXPECTED_SECOND_BRACKET_LABEL = 'Second bracket';
export const EXPECTED_THIRD_BRACKET_LABEL = 'Third bracket';

// Expected counts
export const EXPECTED_TWO_CHILDREN = 2;
export const EXPECTED_THREE_CHILDREN = 3;
export const EXPECTED_ONE_CHILD = 1;

// Test values
export const TEST_VALUE_2025 = { [CURRENT_YEAR]: 0.2 };
export const TEST_VALUE_12570 = { [CURRENT_YEAR]: 12570 };

// Test utilities
export const expectNodeToHaveLabel = (node: ParameterTreeNode | undefined, label: string) => {
  expect(node?.label).toBe(label);
};

export const expectNodeToHaveChildren = (node: ParameterTreeNode | undefined, count: number) => {
  expect(node?.children?.length).toBe(count);
};

export const findNodeByName = (
  tree: ParameterTreeNode | undefined,
  name: string
): ParameterTreeNode | undefined => {
  if (!tree) {
    return undefined;
  }
  if (tree.name === name) {
    return tree;
  }

  if (tree.children) {
    for (const child of tree.children) {
      const found = findNodeByName(child, name);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
};
