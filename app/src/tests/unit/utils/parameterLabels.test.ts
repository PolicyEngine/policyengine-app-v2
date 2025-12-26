import { describe, expect, test } from 'vitest';
import {
  EXPECTED_COMPACT_LABELS,
  EXPECTED_FORMATTED_STRINGS,
  EXPECTED_HIERARCHICAL_LABELS,
  MOCK_PARAMETER_METADATA,
  SENTENCE_CASE_TESTS,
  TEST_LABEL_ARRAYS,
  TEST_PARAM_NAMES,
} from '@/tests/fixtures/utils/parameterLabelsMocks';
import {
  buildCompactLabel,
  formatLabelParts,
  getHierarchicalLabels,
} from '@/utils/parameterLabels';

describe('getHierarchicalLabels', () => {
  test('given single level parameter then returns empty array', () => {
    // Given
    const paramName = TEST_PARAM_NAMES.SINGLE_LEVEL;

    // When
    const result = getHierarchicalLabels(paramName, MOCK_PARAMETER_METADATA);

    // Then
    expect(result).toEqual(EXPECTED_HIERARCHICAL_LABELS.SINGLE_LEVEL);
  });

  test('given two level parameter then returns one label in sentence case', () => {
    // Given
    const paramName = TEST_PARAM_NAMES.TWO_LEVELS;

    // When
    const result = getHierarchicalLabels(paramName, MOCK_PARAMETER_METADATA);

    // Then
    expect(result).toEqual(EXPECTED_HIERARCHICAL_LABELS.TWO_LEVELS);
  });

  test('given three level parameter then returns two labels in sentence case', () => {
    // Given
    const paramName = TEST_PARAM_NAMES.THREE_LEVELS;

    // When
    const result = getHierarchicalLabels(paramName, MOCK_PARAMETER_METADATA);

    // Then
    expect(result).toEqual(EXPECTED_HIERARCHICAL_LABELS.THREE_LEVELS);
  });

  test('given four level parameter then returns three labels in sentence case', () => {
    // Given
    const paramName = TEST_PARAM_NAMES.FOUR_LEVELS;

    // When
    const result = getHierarchicalLabels(paramName, MOCK_PARAMETER_METADATA);

    // Then
    expect(result).toEqual(EXPECTED_HIERARCHICAL_LABELS.FOUR_LEVELS);
  });

  test('given five level parameter then returns four labels in sentence case', () => {
    // Given
    const paramName = TEST_PARAM_NAMES.FIVE_LEVELS;

    // When
    const result = getHierarchicalLabels(paramName, MOCK_PARAMETER_METADATA);

    // Then
    expect(result).toEqual(EXPECTED_HIERARCHICAL_LABELS.FIVE_LEVELS);
  });

  test('given six level parameter then returns five labels in sentence case', () => {
    // Given
    const paramName = TEST_PARAM_NAMES.SIX_LEVELS;

    // When
    const result = getHierarchicalLabels(paramName, MOCK_PARAMETER_METADATA);

    // Then
    expect(result).toEqual(EXPECTED_HIERARCHICAL_LABELS.SIX_LEVELS);
  });

  test('given parameter with brackets and missing final label then filters correctly', () => {
    // Given
    const paramName = TEST_PARAM_NAMES.WITH_BRACKETS;

    // When
    const result = getHierarchicalLabels(paramName, MOCK_PARAMETER_METADATA);

    // Then
    // Note: gov.irs.income.bracket.rates[1] has no metadata, so only parent levels are included
    expect(result).toEqual(EXPECTED_HIERARCHICAL_LABELS.WITH_BRACKETS);
  });

  test('given parameter with missing metadata then filters out undefined labels', () => {
    // Given
    const paramName = 'gov.irs.missing.param';
    const partialMetadata = {
      'gov.irs': {
        label: 'IRS',
        type: 'parameterNode' as const,
        parameter: 'gov.irs',
        unit: '',
      },
      // Missing 'gov.irs.missing' and 'gov.irs.missing.param'
    };

    // When
    const result = getHierarchicalLabels(paramName, partialMetadata);

    // Then
    expect(result).toEqual(['IRS']); // Only the one available label, first char already uppercase
  });
});

describe('buildCompactLabel', () => {
  test('given empty array then returns empty array with hasMore false', () => {
    // Given
    const labels = TEST_LABEL_ARRAYS.EMPTY;

    // When
    const result = buildCompactLabel(labels);

    // Then
    expect(result).toEqual(EXPECTED_COMPACT_LABELS.ZERO_ITEMS);
  });

  test('given one item then returns all items with hasMore false', () => {
    // Given
    const labels = TEST_LABEL_ARRAYS.ONE_ITEM;

    // When
    const result = buildCompactLabel(labels);

    // Then
    expect(result).toEqual(EXPECTED_COMPACT_LABELS.ONE_ITEM);
  });

  test('given two items then returns all items with hasMore false', () => {
    // Given
    const labels = TEST_LABEL_ARRAYS.TWO_ITEMS;

    // When
    const result = buildCompactLabel(labels);

    // Then
    expect(result).toEqual(EXPECTED_COMPACT_LABELS.TWO_ITEMS);
  });

  test('given three items then returns all items with hasMore false', () => {
    // Given
    const labels = TEST_LABEL_ARRAYS.THREE_ITEMS;

    // When
    const result = buildCompactLabel(labels);

    // Then
    expect(result).toEqual(EXPECTED_COMPACT_LABELS.THREE_ITEMS);
  });

  test('given four items then returns first and last two with ellipsis and hasMore true', () => {
    // Given
    const labels = TEST_LABEL_ARRAYS.FOUR_ITEMS;

    // When
    const result = buildCompactLabel(labels);

    // Then
    expect(result).toEqual(EXPECTED_COMPACT_LABELS.FOUR_ITEMS);
  });

  test('given five items then returns first and last two with ellipsis and hasMore true', () => {
    // Given
    const labels = TEST_LABEL_ARRAYS.FIVE_ITEMS;

    // When
    const result = buildCompactLabel(labels);

    // Then
    expect(result).toEqual(EXPECTED_COMPACT_LABELS.FIVE_ITEMS);
  });

  test('given six items then returns first and last two with ellipsis and hasMore true', () => {
    // Given
    const labels = TEST_LABEL_ARRAYS.SIX_ITEMS;

    // When
    const result = buildCompactLabel(labels);

    // Then
    expect(result).toEqual(EXPECTED_COMPACT_LABELS.SIX_ITEMS);
  });
});

describe('formatLabelParts', () => {
  test('given empty array then returns empty string', () => {
    // Given
    const parts = TEST_LABEL_ARRAYS.EMPTY;

    // When
    const result = formatLabelParts(parts);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_STRINGS.EMPTY);
  });

  test('given one item then returns single item without separator', () => {
    // Given
    const parts = TEST_LABEL_ARRAYS.ONE_ITEM;

    // When
    const result = formatLabelParts(parts);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_STRINGS.ONE_ITEM);
  });

  test('given two items then returns items joined with arrow separator', () => {
    // Given
    const parts = TEST_LABEL_ARRAYS.TWO_ITEMS;

    // When
    const result = formatLabelParts(parts);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_STRINGS.TWO_ITEMS);
  });

  test('given three items then returns items joined with arrow separators', () => {
    // Given
    const parts = TEST_LABEL_ARRAYS.THREE_ITEMS;

    // When
    const result = formatLabelParts(parts);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_STRINGS.THREE_ITEMS);
  });

  test('given compact four items then formats with ellipsis correctly', () => {
    // Given
    const parts = EXPECTED_COMPACT_LABELS.FOUR_ITEMS.displayParts;

    // When
    const result = formatLabelParts(parts);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_STRINGS.FOUR_ITEMS_COMPACT);
  });

  test('given compact five items then formats with ellipsis correctly', () => {
    // Given
    const parts = EXPECTED_COMPACT_LABELS.FIVE_ITEMS.displayParts;

    // When
    const result = formatLabelParts(parts);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_STRINGS.FIVE_ITEMS_COMPACT);
  });

  test('given compact six items then formats with ellipsis correctly', () => {
    // Given
    const parts = EXPECTED_COMPACT_LABELS.SIX_ITEMS.displayParts;

    // When
    const result = formatLabelParts(parts);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_STRINGS.SIX_ITEMS_COMPACT);
  });
});

describe('capitalize first formatting', () => {
  test('given lowercase string then capitalizes first letter only', () => {
    // Given
    const { input, expected } = SENTENCE_CASE_TESTS.LOWERCASE;

    // When
    const result = getHierarchicalLabels('gov.irs', {
      'gov.irs': { label: input, type: 'parameterNode', parameter: 'gov.irs', unit: '' },
    });

    // Then
    expect(result[0]).toBe(expected);
  });

  test('given uppercase string then preserves case (first already uppercase)', () => {
    // Given
    const { input, expected } = SENTENCE_CASE_TESTS.UPPERCASE;

    // When
    const result = getHierarchicalLabels('gov.irs', {
      'gov.irs': { label: input, type: 'parameterNode', parameter: 'gov.irs', unit: '' },
    });

    // Then
    expect(result[0]).toBe(expected);
  });

  test('given mixed case string then preserves case after first character', () => {
    // Given
    const { input, expected } = SENTENCE_CASE_TESTS.MIXED_CASE;

    // When
    const result = getHierarchicalLabels('gov.irs', {
      'gov.irs': { label: input, type: 'parameterNode', parameter: 'gov.irs', unit: '' },
    });

    // Then
    expect(result[0]).toBe(expected);
  });

  test('given string with proper nouns then preserves their capitalization', () => {
    // Given
    const { input, expected } = SENTENCE_CASE_TESTS.WITH_SPECIAL_CHARS;

    // When
    const result = getHierarchicalLabels('gov.irs', {
      'gov.irs': { label: input, type: 'parameterNode', parameter: 'gov.irs', unit: '' },
    });

    // Then
    expect(result[0]).toBe(expected);
  });

  test('given single character then capitalizes it', () => {
    // Given
    const { input, expected } = SENTENCE_CASE_TESTS.SINGLE_CHAR;

    // When
    const result = getHierarchicalLabels('gov.irs', {
      'gov.irs': { label: input, type: 'parameterNode', parameter: 'gov.irs', unit: '' },
    });

    // Then
    expect(result[0]).toBe(expected);
  });

  test('given empty string then returns empty string', () => {
    // Given
    const { input } = SENTENCE_CASE_TESTS.EMPTY;

    // When
    const result = getHierarchicalLabels('gov.irs', {
      'gov.irs': { label: input, type: 'parameterNode', parameter: 'gov.irs', unit: '' },
    });

    // Then
    // Empty label gets filtered out, so result array is empty
    expect(result).toEqual([]);
  });
});
