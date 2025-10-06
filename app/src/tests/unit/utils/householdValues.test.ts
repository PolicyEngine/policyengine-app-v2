import { describe, test, expect } from 'vitest';
import {
  getValueFromHousehold,
  formatVariableValue,
  getParameterAtInstant,
  shouldShowVariable,
} from '@/utils/householdValues';
import {
  MOCK_METADATA,
  MOCK_HOUSEHOLD_DATA,
  MOCK_HOUSEHOLD_DATA_REFORM,
  MOCK_HOUSEHOLD_DATA_MULTI_PERIOD,
  MOCK_PARAMETER,
  MOCK_HOUSEHOLD_INCOME_VARIABLE,
  MOCK_AGE_VARIABLE,
  MOCK_TAX_RATE_VARIABLE,
  TEST_TIME_PERIODS,
  TEST_ENTITY_NAMES,
  TEST_VARIABLE_NAMES,
  EXPECTED_VALUES,
  EXPECTED_FORMATTED_VALUES,
} from '@/tests/fixtures/utils/householdValuesMocks';

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
    expect(result).toBe(EXPECTED_VALUES.HOUSEHOLD_INCOME_2024);
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
    const value = EXPECTED_VALUES.HOUSEHOLD_INCOME_2024;

    // When
    const result = formatVariableValue(variable, value);

    // Then
    expect(result).toBe(EXPECTED_FORMATTED_VALUES.USD_50000);
  });

  test('given percentage variable then returns formatted value with percent sign', () => {
    // Given
    const variable = MOCK_TAX_RATE_VARIABLE;
    const value = EXPECTED_VALUES.TAX_RATE_2024;

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
    const instant = '2024-01-01';

    // When
    const result = getParameterAtInstant(MOCK_PARAMETER, instant);

    // Then
    expect(result).toBe(14600);
  });

  test('given instant between dates then returns most recent prior value', () => {
    // Given
    const instant = '2024-06-15';

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
    const instant = '2024-01-01';

    // When
    const result = getParameterAtInstant(null, instant);

    // Then
    expect(result).toEqual([]);
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
      MOCK_METADATA
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
      MOCK_METADATA
    );

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
            benefits: { '2024': 0 },
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
