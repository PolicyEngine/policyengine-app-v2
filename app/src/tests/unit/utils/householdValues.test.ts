import { describe, expect, test } from 'vitest';
import {
  EXPECTED_FORMATTED_VALUES,
  EXPECTED_VALUES,
  MOCK_AGE_VARIABLE,
  MOCK_HOUSEHOLD_DATA,
  MOCK_HOUSEHOLD_DATA_MULTI_PERIOD,
  MOCK_HOUSEHOLD_DATA_REFORM,
  MOCK_HOUSEHOLD_INCOME_VARIABLE,
  MOCK_METADATA,
  MOCK_PARAMETER,
  MOCK_TAX_RATE_VARIABLE,
  TEST_ENTITY_NAMES,
  TEST_TIME_PERIODS,
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
  test('given household variable with specific time period and entity then returns correct value', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.HOUSEHOLD_INCOME;
    const timePeriod = TEST_TIME_PERIODS.YEAR_2024;
    const entityName = TEST_ENTITY_NAMES.YOUR_HOUSEHOLD;

    // When
    const result = getValueFromHousehold(
      variableName,
      timePeriod,
      entityName,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.HOUSEHOLD_INCOME_2025);
  });

  test('given person variable with specific time period and entity then returns correct value', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.AGE;
    const timePeriod = TEST_TIME_PERIODS.YEAR_2024;
    const entityName = TEST_ENTITY_NAMES.PERSON_1;

    // When
    const result = getValueFromHousehold(
      variableName,
      timePeriod,
      entityName,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.AGE_PERSON_1);
  });

  test('given null entity name then aggregates across all entities', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.AGE;
    const timePeriod = TEST_TIME_PERIODS.YEAR_2024;
    const entityName = null;

    // When
    const result = getValueFromHousehold(
      variableName,
      timePeriod,
      entityName,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.AGE_TOTAL);
  });

  test('given null time period then aggregates across all time periods', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.HOUSEHOLD_INCOME;
    const timePeriod = null;
    const entityName = TEST_ENTITY_NAMES.YOUR_HOUSEHOLD;

    // When
    const result = getValueFromHousehold(
      variableName,
      timePeriod,
      entityName,
      MOCK_HOUSEHOLD_DATA_MULTI_PERIOD,
      MOCK_METADATA
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.HOUSEHOLD_INCOME_ALL_PERIODS);
  });

  test('given null time period and entity then aggregates across all', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.BENEFITS;
    const timePeriod = null;
    const entityName = null;

    // When
    const result = getValueFromHousehold(
      variableName,
      timePeriod,
      entityName,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.BENEFITS_TOTAL);
  });

  test('given nonexistent variable then returns zero', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.NONEXISTENT;
    const timePeriod = TEST_TIME_PERIODS.YEAR_2024;
    const entityName = TEST_ENTITY_NAMES.YOUR_HOUSEHOLD;

    // When
    const result = getValueFromHousehold(
      variableName,
      timePeriod,
      entityName,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA
    );

    // Then
    expect(result).toBe(0);
  });

  test('given valueFromFirstOnly true then returns value from first entity only', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.BENEFITS;
    const timePeriod = TEST_TIME_PERIODS.YEAR_2024;
    const entityName = null;
    const valueFromFirstOnly = true;

    // When
    const result = getValueFromHousehold(
      variableName,
      timePeriod,
      entityName,
      MOCK_HOUSEHOLD_DATA,
      MOCK_METADATA,
      valueFromFirstOnly
    );

    // Then
    expect(result).toBe(EXPECTED_VALUES.BENEFITS_PERSON_1);
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

    // Then
    expect(result).toBe('$50,000.57');
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
      const variable = { valueType: 'float', unit: 'currency-USD' };

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
      const variable = { valueType: 'float', unit: 'currency-GBP' };

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
      const variable = { valueType: 'float', unit: 'currency-EUR' };

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
      const variable = { valueType: 'float', unit: '/1' };

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
      const variable = { valueType: 'int', unit: null };

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
      const variable = { valueType: 'Enum', unit: null };

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
      const variable = { valueType: 'float', unit: null };

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
      const variable = { valueType: 'float', unit: 'years' };

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
    test('given variable without valueType then handles gracefully', () => {
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
      const variable = { valueType: 'float' };

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
    const result = shouldShowVariable(variableName, MOCK_HOUSEHOLD_DATA, null, MOCK_METADATA);

    // Then
    expect(result).toBe(true);
  });

  test('given zero baseline and no reform then returns false', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.NONEXISTENT;

    // When
    const result = shouldShowVariable(variableName, MOCK_HOUSEHOLD_DATA, null, MOCK_METADATA);

    // Then
    expect(result).toBe(false);
  });

  test('given zero baseline but non-zero reform then returns true', () => {
    // Given
    const variableName = TEST_VARIABLE_NAMES.BENEFITS;
    const householdZeroBenefits = {
      ...MOCK_HOUSEHOLD_DATA,
      householdData: {
        ...MOCK_HOUSEHOLD_DATA.householdData,
        people: {
          'person 1': {
            benefits: { '2025': 0 },
          },
        },
      },
    };

    // When
    const result = shouldShowVariable(
      variableName,
      householdZeroBenefits,
      MOCK_HOUSEHOLD_DATA_REFORM,
      MOCK_METADATA
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
      MOCK_METADATA,
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
      MOCK_METADATA
    );

    // Then
    expect(result).toBe(true);
  });
});
