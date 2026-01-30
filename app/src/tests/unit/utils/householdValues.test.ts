import { describe, expect, test } from 'vitest';
import {
  EXPECTED_FORMATTED_VALUES,
  EXPECTED_VALUES,
  MOCK_AGE_VARIABLE,
  MOCK_HOUSEHOLD_DATA,
  MOCK_HOUSEHOLD_DATA_REFORM,
  MOCK_HOUSEHOLD_INCOME_VARIABLE,
  MOCK_METADATA_CONTEXT,
  MOCK_PARAMETER,
  MOCK_TAX_RATE_VARIABLE,
  TEST_ENTITY_IDS,
  TEST_VARIABLE_NAMES,
} from '@/tests/fixtures/utils/householdValuesMocks';
import {
  formatVariableValue,
  getInputFormattingProps,
  getParameterAtInstant,
  getValueFromHousehold,
  shouldShowVariable,
} from '@/utils/householdValues';

describe('getValueFromHousehold', () => {
  test('given household variable with specific entity ID then returns correct value', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.HOUSEHOLD_INCOME;
    const entityId = TEST_ENTITY_IDS.HOUSEHOLD_0;

    // When
    const result = getValueFromHousehold(
      variableName,
      entityId,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.HOUSEHOLD_INCOME_2025);
  });

  test('given person variable with specific entity ID then returns correct value', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.AGE;
    const entityId = TEST_ENTITY_IDS.PERSON_0;

    // When
    const result = getValueFromHousehold(
      variableName,
      entityId,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.AGE_PERSON_0);
  });

  test('given null entity ID then aggregates across all entities', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.AGE;
    const entityId = null;

    // When
    const result = getValueFromHousehold(
      variableName,
      entityId,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.AGE_TOTAL);
  });

  test('given null entity ID for benefits then aggregates across all people', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.BENEFITS;
    const entityId = null;

    // When
    const result = getValueFromHousehold(
      variableName,
      entityId,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.BENEFITS_TOTAL);
  });

  test('given nonexistent variable then returns zero', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.NONEXISTENT;
    const entityId = TEST_ENTITY_IDS.HOUSEHOLD_0;

    // When
    const result = getValueFromHousehold(
      variableName,
      entityId,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(0);
  });

  test('given valueFromFirstOnly true then returns value from first entity only', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.BENEFITS;
    const entityId = null;
    const valueFromFirstOnly = true;

    // When
    const result = getValueFromHousehold(
      variableName,
      entityId,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA_CONTEXT,
      valueFromFirstOnly
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.BENEFITS_PERSON_0);
  });
});

describe('formatVariableValue', () => {
  test('given USD currency variable then returns formatted value with dollar sign', () => {
    // Given
    const variable = MOCK_HOUSEHOLD_INCOME_VARIABLE;
    const value = EXPECTED_VALUES.HOUSEHOLD_INCOME_2025;

    // When
    const result = formatVariableValue(variable, value);

    // Then
    expect(result).toBe(EXPECTED_FORMATTED_VALUES.USD_50000);
  });

  test('given percentage variable then returns formatted value with percent sign', () => {
    // Given
    const variable = MOCK_TAX_RATE_VARIABLE;
    const value = EXPECTED_VALUES.TAX_RATE_2025;

    // When
    const result = formatVariableValue(variable, value);

    // Then
    expect(result).toBe(EXPECTED_FORMATTED_VALUES.PERCENTAGE_15);
  });

  test('given plain numeric variable then returns formatted number', () => {
    // Given
    const variable = MOCK_AGE_VARIABLE;
    const value = EXPECTED_VALUES.AGE_TOTAL;

    // When
    const result = formatVariableValue(variable, value);

    // Then
    expect(result).toBe(EXPECTED_FORMATTED_VALUES.PLAIN_67);
  });

  test('given negative value then returns absolute value formatted', () => {
    // Given
    const variable = MOCK_HOUSEHOLD_INCOME_VARIABLE;
    const value = -5000;

    // When
    const result = formatVariableValue(variable, value);

    // Then
    expect(result).toBe(EXPECTED_FORMATTED_VALUES.USD_5000);
  });

  test('given precision parameter then formats with specified decimal places', () => {
    // Given
    const variable = MOCK_HOUSEHOLD_INCOME_VARIABLE;
    const value = 50000.567;
    const precision = 2;

    // When
    const result = formatVariableValue(variable, value, precision);

    // Then - V2 API doesn't include 'unit', so no currency symbol
    expect(result).toBe('50,000.57');
  });
});

describe('getParameterAtInstant', () => {
  test('given instant matching exact date then returns value at that date', () => {
    // Given
    const instant = '2025-01-01';

    // When
    const result = getParameterAtInstant(MOCK_PARAMETER, instant);

    // Then
    expect(result).toBe(14600);
  });

  test('given instant between dates then returns most recent prior value', () => {
    // Given
    const instant = '2025-06-15';

    // When
    const result = getParameterAtInstant(MOCK_PARAMETER, instant);

    // Then
    expect(result).toBe(14600);
  });

  test('given instant before all dates then returns empty array', () => {
    // Given
    const instant = '2019-01-01';

    // When
    const result = getParameterAtInstant(MOCK_PARAMETER, instant);

    // Then
    expect(result).toEqual([]);
  });

  test('given instant after all dates then returns latest value', () => {
    // Given
    const instant = '2026-01-01';

    // When
    const result = getParameterAtInstant(MOCK_PARAMETER, instant);

    // Then
    expect(result).toBe(15000);
  });

  test('given null parameter then returns empty array', () => {
    // Given
    const instant = '2025-01-01';

    // When
    const result = getParameterAtInstant(null, instant);

    // Then
    expect(result).toEqual([]);
  });
});

describe('getInputFormattingProps', () => {
  describe('Currency formatting', () => {
    test('given USD currency variable then returns dollar prefix with 2 decimals', () => {
      // Given
      const variable = { data_type: 'float', unit: 'currency-USD' };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        prefix: '$',
        thousandSeparator: ',',
        decimalScale: 2,
      });
    });

    test('given GBP currency variable then returns pound prefix with 2 decimals', () => {
      // Given
      const variable = { data_type: 'float', unit: 'currency-GBP' };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        prefix: '£',
        thousandSeparator: ',',
        decimalScale: 2,
      });
    });

    test('given EUR currency variable then returns euro prefix with 2 decimals', () => {
      // Given
      const variable = { data_type: 'float', unit: 'currency-EUR' };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        prefix: '€',
        thousandSeparator: ',',
        decimalScale: 2,
      });
    });
  });

  describe('Percentage formatting', () => {
    test('given percentage variable then returns percent suffix with 2 decimals', () => {
      // Given
      const variable = { data_type: 'float', unit: '/1' };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        suffix: '%',
        thousandSeparator: ',',
        decimalScale: 2,
      });
    });
  });

  describe('Integer formatting', () => {
    test('given int variable then returns 0 decimals', () => {
      // Given
      const variable = { data_type: 'int', unit: null };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        thousandSeparator: ',',
        decimalScale: 0,
      });
    });

    test('given Enum variable then returns 0 decimals', () => {
      // Given
      const variable = { data_type: 'Enum', unit: null };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        thousandSeparator: ',',
        decimalScale: 0,
      });
    });
  });

  describe('Float formatting', () => {
    test('given float variable without unit then returns 0 decimals', () => {
      // Given
      const variable = { data_type: 'float', unit: null };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        thousandSeparator: ',',
        decimalScale: 0,
      });
    });

    test('given float variable with unknown unit then returns 0 decimals', () => {
      // Given
      const variable = { data_type: 'float', unit: 'years' };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        thousandSeparator: ',',
        decimalScale: 0,
      });
    });
  });

  describe('Edge cases', () => {
    test('given variable without data_type then handles gracefully', () => {
      // Given
      const variable = { unit: 'currency-USD' };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        prefix: '$',
        thousandSeparator: ',',
        decimalScale: undefined,
      });
    });

    test('given variable without unit then returns default formatting', () => {
      // Given
      const variable = { data_type: 'float' };

      // When
      const result = getInputFormattingProps(variable);

      // Then
      expect(result).toEqual({
        thousandSeparator: ',',
        decimalScale: 0,
      });
    });
  });
});

describe('shouldShowVariable', () => {
  test('given non-zero baseline value then returns true', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.HOUSEHOLD_INCOME;

    // When
    const result = shouldShowVariable(
      variableName,
      MOCK_HOUSEHOLD_DATA,
      null,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(true);
  });

  test('given zero baseline and no reform then returns false', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.NONEXISTENT;

    // When
    const result = shouldShowVariable(
      variableName,
      MOCK_HOUSEHOLD_DATA,
      null,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(false);
  });

  test('given zero baseline but non-zero reform then returns true', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.BENEFITS;
    const householdZeroBenefits = {
      ...MOCK_HOUSEHOLD_DATA,
      people: [
        {
          person_id: 0,
          benefits: 0,
          person_tax_unit_id: 0,
          person_family_id: 0,
          person_spm_unit_id: 0,
          person_marital_unit_id: 0,
        },
      ],
    };

    // When
    const result = shouldShowVariable(
      variableName,
      householdZeroBenefits,
      MOCK_HOUSEHOLD_DATA_REFORM,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(true);
  });

  test('given forceShow true then returns true regardless of values', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.NONEXISTENT;
    const forceShow = true;

    // When
    const result = shouldShowVariable(
      variableName,
      MOCK_HOUSEHOLD_DATA,
      null,
      MOCK_METADATA_CONTEXT,
      forceShow
    );

    // Then
    expect(result).toBe(true);
  });

  test('given non-zero in both baseline and reform then returns true', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.BENEFITS;

    // When
    const result = shouldShowVariable(
      variableName,
      MOCK_HOUSEHOLD_DATA,
      MOCK_HOUSEHOLD_DATA_REFORM,
      MOCK_METADATA_CONTEXT
    );

    // Then
    expect(result).toBe(true);
  });
});
