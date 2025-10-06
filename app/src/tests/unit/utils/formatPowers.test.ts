import { describe, test, expect } from 'vitest';
import { formatPowers, formatBudgetaryImpact } from '@/utils/formatPowers';
import {
  TEST_VALUES,
  EXPECTED_FORMATTED_VALUES,
  EXPECTED_POWER_TUPLES,
} from '@/tests/fixtures/utils/formatPowersMocks';

describe('formatPowers', () => {
  test('given zero value then returns zero with no label', () => {
    // Given
    const value = TEST_VALUES.ZERO;

    // When
    const result = formatPowers(value);

    // Then
    expect(result).toEqual(EXPECTED_POWER_TUPLES.ZERO);
  });

  test('given small value then returns value with no label', () => {
    // Given
    const value = TEST_VALUES.SMALL;

    // When
    const result = formatPowers(value);

    // Then
    expect(result).toEqual(EXPECTED_POWER_TUPLES.SMALL);
  });

  test('given thousand value then returns value with no label', () => {
    // Given
    const value = TEST_VALUES.THOUSAND;

    // When
    const result = formatPowers(value);

    // Then
    expect(result).toEqual(EXPECTED_POWER_TUPLES.THOUSAND);
  });

  test('given million value then returns scaled value with million label', () => {
    // Given
    const value = TEST_VALUES.MILLION;

    // When
    const result = formatPowers(value);

    // Then
    expect(result).toEqual(EXPECTED_POWER_TUPLES.MILLION);
  });

  test('given billion value then returns scaled value with billion label', () => {
    // Given
    const value = TEST_VALUES.BILLION;

    // When
    const result = formatPowers(value);

    // Then
    expect(result).toEqual(EXPECTED_POWER_TUPLES.BILLION);
  });

  test('given trillion value then returns scaled value with trillion label', () => {
    // Given
    const value = TEST_VALUES.TRILLION;

    // When
    const result = formatPowers(value);

    // Then
    expect(result).toEqual(EXPECTED_POWER_TUPLES.TRILLION);
  });

  test('given quadrillion value then returns scaled value with quadrillion label', () => {
    // Given
    const value = TEST_VALUES.QUADRILLION;

    // When
    const result = formatPowers(value);

    // Then
    expect(result).toEqual(EXPECTED_POWER_TUPLES.QUADRILLION);
  });
});

describe('formatBudgetaryImpact', () => {
  test('given zero value then returns formatted zero', () => {
    // Given
    const value = TEST_VALUES.ZERO;

    // When
    const result = formatBudgetaryImpact(value);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_VALUES.ZERO);
  });

  test('given small value then returns formatted value with no label', () => {
    // Given
    const value = TEST_VALUES.SMALL;

    // When
    const result = formatBudgetaryImpact(value);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_VALUES.SMALL);
  });

  test('given million value then returns formatted value with million label', () => {
    // Given
    const value = TEST_VALUES.MILLION;

    // When
    const result = formatBudgetaryImpact(value);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_VALUES.MILLION);
  });

  test('given billion value then returns formatted value with billion label', () => {
    // Given
    const value = TEST_VALUES.BILLION;

    // When
    const result = formatBudgetaryImpact(value);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_VALUES.BILLION);
  });

  test('given negative billion value then returns absolute formatted value with billion label', () => {
    // Given
    const value = TEST_VALUES.NEGATIVE_BILLION;

    // When
    const result = formatBudgetaryImpact(value);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_VALUES.NEGATIVE_BILLION);
  });

  test('given trillion value then returns formatted value with trillion label', () => {
    // Given
    const value = TEST_VALUES.TRILLION;

    // When
    const result = formatBudgetaryImpact(value);

    // Then
    expect(result).toEqual(EXPECTED_FORMATTED_VALUES.TRILLION);
  });

  test('given result has one decimal place precision', () => {
    // Given
    const value = 1234567890; // 1.234... billion

    // When
    const result = formatBudgetaryImpact(value);

    // Then
    expect(result.display).toBe('1.2');
    expect(result.label).toBe(' billion');
  });
});
