import { beforeEach, describe, expect, test, vi } from 'vitest';
import { buildParameterTree, convertMetadataToParameterTree } from '@/libs/buildParameterTree';
import {
  EXPECTED_ALLOWANCE_LABEL,
  EXPECTED_BENEFITS_LABEL,
  EXPECTED_BRACKET_1_LABEL,
  EXPECTED_BRACKET_2_LABEL,
  EXPECTED_BRACKETS_LABEL,
  EXPECTED_CHILD_CARE_SUPPORT_LABEL,
  EXPECTED_FIRST_BRACKET_LABEL,
  EXPECTED_GOV_LABEL,
  EXPECTED_GOVERNMENT_LABEL,
  EXPECTED_INCOME_LABEL,
  EXPECTED_INCOME_TAX_RATE_LABEL,
  EXPECTED_ONE_CHILD,
  EXPECTED_PERSONAL_INCOME_LABEL,
  EXPECTED_PERSONAL_LABEL,
  EXPECTED_SECOND_BRACKET_LABEL,
  EXPECTED_SORTED_LABELS,
  EXPECTED_TAX_LABEL,
  EXPECTED_TAXATION_LABEL,
  EXPECTED_TAXATION_NODE_LABEL,
  EXPECTED_THIRD_BRACKET_LABEL,
  EXPECTED_THREE_CHILDREN,
  EXPECTED_TWO_CHILDREN,
  expectNodeToHaveChildren,
  expectNodeToHaveLabel,
  findNodeByName,
  GOV_ABOLITIONS_NODE_NAME,
  GOV_BENEFIT_NODE_NAME,
  GOV_INTERNAL_NODE_NAME,
  GOV_TAX_BRACKETS_NODE_NAME,
  GOV_TAX_INCOME_NODE_NAME,
  GOV_TAX_INCOME_PERSONAL_ALLOWANCE_NODE_NAME,
  GOV_TAX_INCOME_PERSONAL_NODE_NAME,
  GOV_TAX_NODE_NAME,
  GOV_TAX_RATES_NODE_NAME,
  GOV_TAXSIM_NODE_NAME,
  mockAlphabeticalParameters,
  mockBracketIndicesParameters,
  mockBracketParameters,
  mockCustomLabelParameters,
  mockDeepNestedParameters,
  mockEmptyParameters,
  mockFilteredParameters,
  mockMetadataApiPayload,
  mockNestedParameters,
  mockNonApplicableParameters,
  mockNonGovParameters,
  mockSimpleParameters,
  mockSpecialCharParameters,
  TEST_DESCRIPTION,
  TEST_PERIOD,
  TEST_UNIT,
  TEST_VALUE_2025,
} from '@/tests/fixtures/libs/buildParameterTreeMocks';

describe('buildParameterTree', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear console.error mock
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  test('given simple parameters then builds basic tree structure', () => {
    // Given
    const parameters = mockSimpleParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();
    expectNodeToHaveLabel(tree, EXPECTED_GOV_LABEL);
    expectNodeToHaveChildren(tree, EXPECTED_TWO_CHILDREN); // tax and benefit nodes
  });

  test('given nested parameters then creates proper hierarchy', () => {
    // Given
    const parameters = mockNestedParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();
    expectNodeToHaveLabel(tree, EXPECTED_GOVERNMENT_LABEL);

    const taxNode = findNodeByName(tree, GOV_TAX_NODE_NAME);
    expect(taxNode).toBeDefined();
    expectNodeToHaveLabel(taxNode, EXPECTED_TAXATION_NODE_LABEL);
    expectNodeToHaveChildren(taxNode, EXPECTED_TWO_CHILDREN); // income_tax and capital_gains

    const benefitNode = findNodeByName(tree, GOV_BENEFIT_NODE_NAME);
    expect(benefitNode).toBeDefined();
    expectNodeToHaveLabel(benefitNode, EXPECTED_BENEFITS_LABEL);
    expectNodeToHaveChildren(benefitNode, EXPECTED_ONE_CHILD); // child_benefit
  });

  test('given parameters with brackets then creates bracket structure', () => {
    // Given
    const parameters = mockBracketParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();
    const taxNode = findNodeByName(tree, GOV_TAX_NODE_NAME);
    expect(taxNode).toBeDefined();

    // Check bracket container node exists
    const bracketsNode = findNodeByName(tree, GOV_TAX_BRACKETS_NODE_NAME);
    expect(bracketsNode).toBeDefined();
    expectNodeToHaveLabel(bracketsNode, EXPECTED_BRACKETS_LABEL);

    // Check that bracket parameters are added
    const brackets = bracketsNode?.children || [];
    expect(brackets.length).toBe(EXPECTED_THREE_CHILDREN);

    // The parameter nodes themselves keep their labels from the data
    const bracket0Node = brackets.find((b) => b.parameter === 'gov.tax.brackets[0]');
    const bracket1Node = brackets.find((b) => b.parameter === 'gov.tax.brackets[1]');
    const bracket2Node = brackets.find((b) => b.parameter === 'gov.tax.brackets[2]');

    expect(bracket0Node?.label).toBe(EXPECTED_FIRST_BRACKET_LABEL);
    expect(bracket1Node?.label).toBe(EXPECTED_SECOND_BRACKET_LABEL);
    expect(bracket2Node?.label).toBe(EXPECTED_THIRD_BRACKET_LABEL);
  });

  test('given parameters with bracket indices then transforms intermediate nodes', () => {
    // Given
    const parameters = mockBracketIndicesParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    const ratesNode = findNodeByName(tree, GOV_TAX_RATES_NODE_NAME);
    expect(ratesNode).toBeDefined();

    // The intermediate bracket index nodes should have "Bracket N" labels
    const rate0Node = findNodeByName(tree, 'gov.tax.rates[0]');
    const rate1Node = findNodeByName(tree, 'gov.tax.rates[1]');

    expect(rate0Node?.label).toBe(EXPECTED_BRACKET_1_LABEL);
    expect(rate1Node?.label).toBe(EXPECTED_BRACKET_2_LABEL);
  });

  test('given parameters with taxsim or abolitions then filters them out', () => {
    // Given
    const parameters = mockFilteredParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();

    // Should only have the income_tax parameter
    const taxNode = findNodeByName(tree, GOV_TAX_NODE_NAME);
    expect(taxNode).toBeDefined();
    expectNodeToHaveChildren(taxNode, EXPECTED_ONE_CHILD);

    // Should not have taxsim or abolitions nodes
    const taxsimNode = findNodeByName(tree, GOV_TAXSIM_NODE_NAME);
    expect(taxsimNode).toBeUndefined();

    const abolitionsNode = findNodeByName(tree, GOV_ABOLITIONS_NODE_NAME);
    expect(abolitionsNode).toBeUndefined();
  });

  test('given parameters without economy or household flags then excludes them', () => {
    // Given
    const parameters = mockNonApplicableParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();

    // Should only have the income_tax parameter
    const taxNode = findNodeByName(tree, GOV_TAX_NODE_NAME);
    expect(taxNode).toBeDefined();
    expectNodeToHaveChildren(taxNode, EXPECTED_ONE_CHILD);

    // Should not have internal config
    const internalNode = findNodeByName(tree, GOV_INTERNAL_NODE_NAME);
    expect(internalNode).toBeUndefined();
  });

  test('given empty parameters then returns undefined', () => {
    // Given
    const parameters = mockEmptyParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeUndefined();
  });

  test('given non-gov parameters then returns undefined', () => {
    // Given
    const parameters = mockNonGovParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeUndefined();
  });

  test('given parameters with underscores then replaces with spaces and capitalizes', () => {
    // Given
    const parameters = mockSpecialCharParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();

    const incomeTaxNode = findNodeByName(tree, 'gov.tax.income_tax_rate');
    expect(incomeTaxNode).toBeDefined();
    expectNodeToHaveLabel(incomeTaxNode, EXPECTED_INCOME_TAX_RATE_LABEL);

    const childCareNode = findNodeByName(tree, 'gov.benefit.child_care_support');
    expect(childCareNode).toBeDefined();
    expectNodeToHaveLabel(childCareNode, EXPECTED_CHILD_CARE_SUPPORT_LABEL);
  });

  test('given parameters then sorts children alphabetically', () => {
    // Given
    const parameters = mockAlphabeticalParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();
    const children = tree?.children || [];
    expect(children[0]?.label).toBe(EXPECTED_SORTED_LABELS[0]);
    expect(children[1]?.label).toBe(EXPECTED_SORTED_LABELS[1]);
    expect(children[2]?.label).toBe(EXPECTED_SORTED_LABELS[2]);
  });

  test('given parameter with custom label then uses custom label', () => {
    // Given
    const parameters = mockCustomLabelParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();
    const taxNode = findNodeByName(tree, GOV_TAX_NODE_NAME);
    expect(taxNode).toBeDefined();
    expectNodeToHaveLabel(taxNode, EXPECTED_TAXATION_LABEL);

    const incomeNode = findNodeByName(tree, GOV_TAX_INCOME_NODE_NAME);
    expect(incomeNode).toBeDefined();
    expectNodeToHaveLabel(incomeNode, EXPECTED_PERSONAL_INCOME_LABEL);
  });

  test('given parameter with all metadata fields then includes them in node', () => {
    // Given
    const parameters = mockSimpleParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    const incomeTaxNode = findNodeByName(tree, 'gov.tax.income_tax');
    expect(incomeTaxNode).toBeDefined();
    expect(incomeTaxNode?.description).toBe(TEST_DESCRIPTION);
    expect(incomeTaxNode?.unit).toBe(TEST_UNIT);
    expect(incomeTaxNode?.period).toBe(TEST_PERIOD);
    expect(incomeTaxNode?.values).toEqual(TEST_VALUE_2025);
    expect(incomeTaxNode?.economy).toBe(true);
    expect(incomeTaxNode?.household).toBe(false);
    expect(incomeTaxNode?.type).toBe('parameter');
  });

  test('given deeply nested parameters then creates all intermediate nodes', () => {
    // Given
    const parameters = mockDeepNestedParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();

    // Check all intermediate nodes exist
    const taxNode = findNodeByName(tree, GOV_TAX_NODE_NAME);
    expect(taxNode).toBeDefined();
    expectNodeToHaveLabel(taxNode, EXPECTED_TAX_LABEL);

    const incomeNode = findNodeByName(tree, GOV_TAX_INCOME_NODE_NAME);
    expect(incomeNode).toBeDefined();
    expectNodeToHaveLabel(incomeNode, EXPECTED_INCOME_LABEL);

    const personalNode = findNodeByName(tree, GOV_TAX_INCOME_PERSONAL_NODE_NAME);
    expect(personalNode).toBeDefined();
    expectNodeToHaveLabel(personalNode, EXPECTED_PERSONAL_LABEL);

    const allowanceNode = findNodeByName(tree, GOV_TAX_INCOME_PERSONAL_ALLOWANCE_NODE_NAME);
    expect(allowanceNode).toBeDefined();
    expectNodeToHaveLabel(allowanceNode, EXPECTED_ALLOWANCE_LABEL);
  });

  test('given error during node insertion then logs error and continues', () => {
    // Given
    const parameters = mockSimpleParameters;

    // When
    const tree = buildParameterTree(parameters);

    // Then
    expect(tree).toBeDefined();
    // Should still build the tree even if errors occur
    expectNodeToHaveChildren(tree, EXPECTED_TWO_CHILDREN);
  });
});

describe('convertMetadataToParameterTree', () => {
  test('given metadata API payload then extracts parameters and builds tree', () => {
    // Given
    const metadata = mockMetadataApiPayload;

    // When
    const tree = convertMetadataToParameterTree(metadata);

    // Then
    expect(tree).toBeDefined();
    expectNodeToHaveLabel(tree, EXPECTED_GOV_LABEL);
    expectNodeToHaveChildren(tree, EXPECTED_TWO_CHILDREN);

    // Verify it used the parameters from the metadata
    const incomeTaxNode = findNodeByName(tree, 'gov.tax.income_tax');
    expect(incomeTaxNode).toBeDefined();
    expect(incomeTaxNode?.description).toBe(TEST_DESCRIPTION);
  });

  test('given metadata with empty parameters then returns undefined', () => {
    // Given
    const metadata = {
      ...mockMetadataApiPayload,
      result: {
        ...mockMetadataApiPayload.result,
        parameters: {},
      },
    };

    // When
    const tree = convertMetadataToParameterTree(metadata);

    // Then
    expect(tree).toBeUndefined();
  });
});
