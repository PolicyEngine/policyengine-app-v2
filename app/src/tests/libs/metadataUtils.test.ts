import { describe, expect, test } from 'vitest';
import {
  getBasicInputFields,
  getDateRange,
  getFieldLabel,
  getFieldOptions,
  getRegions,
  getTaxYears,
  isDropdownField,
  transformMetadataPayload,
} from '@/libs/metadataUtils';
import {
  createMockMetadataApiPayload,
  createMockRootState,
  DROPDOWN_FIELDS,
  expectDateRangeToEqual,
  EXPECTED_COUNTRY,
  EXPECTED_EMPTY_OPTIONS,
  EXPECTED_LABEL_AGE,
  EXPECTED_LABEL_BRMA,
  EXPECTED_LABEL_CUSTOM,
  EXPECTED_LABEL_EMPLOYMENT_INCOME,
  EXPECTED_LABEL_LOCAL_AUTHORITY,
  EXPECTED_LABEL_REGION,
  EXPECTED_LABEL_STATE,
  EXPECTED_MARITAL_STATUS_OPTIONS,
  EXPECTED_MAX_DATE,
  EXPECTED_MAX_DATE_DEFAULT,
  EXPECTED_MIN_DATE,
  EXPECTED_MIN_DATE_DEFAULT,
  EXPECTED_REGION_OPTIONS,
  EXPECTED_TAX_YEAR_OPTIONS,
  EXPECTED_TRANSFORMED_METADATA,
  expectFieldsToEqual,
  expectOptionsToEqual,
  FIELD_AGE,
  FIELD_BRMA,
  FIELD_CUSTOM,
  FIELD_EMPLOYMENT_INCOME,
  FIELD_LOCAL_AUTHORITY,
  FIELD_MARITAL_STATUS,
  FIELD_REGION,
  FIELD_STATE_NAME,
  FIELD_UNKNOWN,
  HOUSEHOLD_FIELDS,
  MOCK_REGIONS,
  NON_DROPDOWN_FIELDS,
  PERSON_FIELDS,
} from '@/tests/fixtures/libs/metadataUtilsMocks';

describe('getTaxYears', () => {
  test('given time periods in state then returns formatted tax year options', () => {
    // Given
    const state = createMockRootState();

    // When
    const taxYears = getTaxYears(state);

    // Then
    expectOptionsToEqual(taxYears, EXPECTED_TAX_YEAR_OPTIONS);
  });

  test('given empty time periods then returns empty array', () => {
    // Given
    const state = createMockRootState({
      economyOptions: { region: [], time_period: [], datasets: [] },
    });

    // When
    const taxYears = getTaxYears(state);

    // Then
    expectOptionsToEqual(taxYears, EXPECTED_EMPTY_OPTIONS);
  });

  test('given null time periods then returns empty array', () => {
    // Given
    const state = createMockRootState({
      economyOptions: { region: [], time_period: null as any, datasets: [] },
    });

    // When
    const taxYears = getTaxYears(state);

    // Then
    expectOptionsToEqual(taxYears, EXPECTED_EMPTY_OPTIONS);
  });
});

describe('getDateRange', () => {
  test('given time periods in state then returns calculated date range', () => {
    // Given
    const state = createMockRootState();

    // When
    const dateRange = getDateRange(state);

    // Then
    expectDateRangeToEqual(dateRange, EXPECTED_MIN_DATE, EXPECTED_MAX_DATE);
  });

  test('given empty time periods then returns default date range', () => {
    // Given
    const state = createMockRootState({
      economyOptions: { region: [], time_period: [], datasets: [] },
    });

    // When
    const dateRange = getDateRange(state);

    // Then
    expectDateRangeToEqual(dateRange, EXPECTED_MIN_DATE_DEFAULT, EXPECTED_MAX_DATE_DEFAULT);
  });

  test('given null time periods then returns default date range', () => {
    // Given
    const state = createMockRootState({
      economyOptions: { region: [], time_period: null as any, datasets: [] },
    });

    // When
    const dateRange = getDateRange(state);

    // Then
    expectDateRangeToEqual(dateRange, EXPECTED_MIN_DATE_DEFAULT, EXPECTED_MAX_DATE_DEFAULT);
  });

  test('given unsorted time periods then returns correct min and max', () => {
    // Given
    const unsortedPeriods = [
      { name: 2025, label: '2025' },
      { name: 2022, label: '2022' },
      { name: 2024, label: '2024' },
      { name: 2023, label: '2023' },
    ];
    const state = createMockRootState({
      economyOptions: { region: [], time_period: unsortedPeriods, datasets: [] },
    });

    // When
    const dateRange = getDateRange(state);

    // Then
    expectDateRangeToEqual(dateRange, EXPECTED_MIN_DATE, EXPECTED_MAX_DATE);
  });
});

describe('getRegions', () => {
  test('given regions in state then returns formatted region options', () => {
    // Given
    const state = createMockRootState();

    // When
    const regions = getRegions(state);

    // Then
    expectOptionsToEqual(regions, EXPECTED_REGION_OPTIONS);
  });

  test('given empty regions then returns empty array', () => {
    // Given
    const state = createMockRootState({
      economyOptions: { region: [], time_period: [], datasets: [] },
    });

    // When
    const regions = getRegions(state);

    // Then
    expectOptionsToEqual(regions, EXPECTED_EMPTY_OPTIONS);
  });

  test('given null regions then returns empty array', () => {
    // Given
    const state = createMockRootState({
      economyOptions: { region: null as any, time_period: [], datasets: [] },
    });

    // When
    const regions = getRegions(state);

    // Then
    expectOptionsToEqual(regions, EXPECTED_EMPTY_OPTIONS);
  });
});

describe('getBasicInputFields', () => {
  test('given basic inputs then separates person and household fields', () => {
    // Given
    const state = createMockRootState();

    // When
    const fields = getBasicInputFields(state);

    // Then
    expectFieldsToEqual(fields, PERSON_FIELDS, HOUSEHOLD_FIELDS);
  });

  test('given only person fields then returns them in person array', () => {
    // Given
    const state = createMockRootState({
      basicInputs: PERSON_FIELDS,
    });

    // When
    const fields = getBasicInputFields(state);

    // Then
    expectFieldsToEqual(fields, PERSON_FIELDS, []);
  });

  test('given only household fields then returns them in household array', () => {
    // Given
    const state = createMockRootState({
      basicInputs: HOUSEHOLD_FIELDS,
    });

    // When
    const fields = getBasicInputFields(state);

    // Then
    expectFieldsToEqual(fields, [], HOUSEHOLD_FIELDS);
  });

  test('given empty basic inputs then returns empty arrays', () => {
    // Given
    const state = createMockRootState({
      basicInputs: [],
    });

    // When
    const fields = getBasicInputFields(state);

    // Then
    expectFieldsToEqual(fields, [], []);
  });

  test('given null basic inputs then returns empty arrays', () => {
    // Given
    const state = createMockRootState({
      basicInputs: null as any,
    });

    // When
    const fields = getBasicInputFields(state);

    // Then
    expectFieldsToEqual(fields, [], []);
  });
});

describe('makeGetFieldOptions and getFieldOptions', () => {
  test('given state_name field then returns region options', () => {
    // Given
    const state = createMockRootState();

    // When
    const options = getFieldOptions(state, FIELD_STATE_NAME);

    // Then
    expectOptionsToEqual(options, EXPECTED_REGION_OPTIONS);
  });

  test('given region field then returns region options', () => {
    // Given
    const state = createMockRootState();

    // When
    const options = getFieldOptions(state, FIELD_REGION);

    // Then
    expectOptionsToEqual(options, EXPECTED_REGION_OPTIONS);
  });

  test('given field with possible values then returns formatted options', () => {
    // Given
    const state = createMockRootState();

    // When
    const options = getFieldOptions(state, FIELD_MARITAL_STATUS);

    // Then
    expectOptionsToEqual(options, EXPECTED_MARITAL_STATUS_OPTIONS);
  });

  test('given field without possible values then returns empty array', () => {
    // Given
    const state = createMockRootState();

    // When
    const options = getFieldOptions(state, FIELD_EMPLOYMENT_INCOME);

    // Then
    expectOptionsToEqual(options, EXPECTED_EMPTY_OPTIONS);
  });

  test('given unknown field then returns empty array', () => {
    // Given
    const state = createMockRootState();

    // When
    const options = getFieldOptions(state, FIELD_UNKNOWN);

    // Then
    expectOptionsToEqual(options, EXPECTED_EMPTY_OPTIONS);
  });

  test('given null regions then returns empty array for state_name', () => {
    // Given
    const state = createMockRootState({
      economyOptions: { region: null as any, time_period: [], datasets: [] },
    });

    // When
    const options = getFieldOptions(state, FIELD_STATE_NAME);

    // Then
    expectOptionsToEqual(options, EXPECTED_EMPTY_OPTIONS);
  });

  test('given null variables then returns empty array for regular field', () => {
    // Given
    const state = createMockRootState({
      variables: null as any,
    });

    // When
    const options = getFieldOptions(state, FIELD_MARITAL_STATUS);

    // Then
    expectOptionsToEqual(options, EXPECTED_EMPTY_OPTIONS);
  });

  test('given field with non-string label in possible values then uses value as label', () => {
    // Given
    const state = createMockRootState({
      variables: {
        test_field: {
          label: 'Test Field',
          possible_values: {
            option1: 123 as any, // Non-string label
            option2: null as any, // Null label
            option3: 'Valid Label',
          },
        },
      },
    });

    // When
    const options = getFieldOptions(state, 'test_field');

    // Then
    expect(options).toEqual([
      { value: 'option1', label: 'option1' },
      { value: 'option2', label: 'option2' },
      { value: 'option3', label: 'Valid Label' },
    ]);
  });
});

describe('isDropdownField', () => {
  test('given dropdown field names then returns true', () => {
    // Given
    const dropdownFields = DROPDOWN_FIELDS;

    // When & Then
    dropdownFields.forEach((field) => {
      expect(isDropdownField(field)).toBe(true);
    });
  });

  test('given non-dropdown field names then returns false', () => {
    // Given
    const nonDropdownFields = NON_DROPDOWN_FIELDS;

    // When & Then
    nonDropdownFields.forEach((field) => {
      expect(isDropdownField(field)).toBe(false);
    });
  });

  test('given unknown field then returns false', () => {
    // Given
    const field = FIELD_UNKNOWN;

    // When
    const isDropdown = isDropdownField(field);

    // Then
    expect(isDropdown).toBe(false);
  });
});

describe('getFieldLabel', () => {
  test('given state_name then returns State', () => {
    // Given
    const field = FIELD_STATE_NAME;

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe(EXPECTED_LABEL_STATE);
  });

  test('given region then returns Region', () => {
    // Given
    const field = FIELD_REGION;

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe(EXPECTED_LABEL_REGION);
  });

  test('given brma then returns Broad Rental Market Area', () => {
    // Given
    const field = FIELD_BRMA;

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe(EXPECTED_LABEL_BRMA);
  });

  test('given local_authority then returns Local Authority', () => {
    // Given
    const field = FIELD_LOCAL_AUTHORITY;

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe(EXPECTED_LABEL_LOCAL_AUTHORITY);
  });

  test('given age then returns Age', () => {
    // Given
    const field = FIELD_AGE;

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe(EXPECTED_LABEL_AGE);
  });

  test('given employment_income then returns Employment Income', () => {
    // Given
    const field = FIELD_EMPLOYMENT_INCOME;

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe(EXPECTED_LABEL_EMPLOYMENT_INCOME);
  });

  test('given unknown field then returns formatted field name', () => {
    // Given
    const field = FIELD_CUSTOM;

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe(EXPECTED_LABEL_CUSTOM);
  });

  test('given field with underscores then capitalizes each word', () => {
    // Given
    const field = 'test_field_with_underscores';

    // When
    const label = getFieldLabel(field);

    // Then
    expect(label).toBe('Test Field With Underscores');
  });
});

describe('transformMetadataPayload', () => {
  test('given valid payload and country then transforms to metadata state', () => {
    // Given
    const payload = createMockMetadataApiPayload();
    const country = EXPECTED_COUNTRY;

    // When
    const transformed = transformMetadataPayload(payload, country);

    // Then
    expect(transformed).toEqual(EXPECTED_TRANSFORMED_METADATA);
  });

  test('given payload with null values then uses default values', () => {
    // Given
    const payload = createMockMetadataApiPayload({
      variables: null as any,
      parameters: null as any,
      entities: null as any,
      variableModules: null as any,
      economy_options: null as any,
      current_law_id: null as any,
      basicInputs: null as any,
      modelled_policies: null as any,
      version: null as any,
    });
    const country = EXPECTED_COUNTRY;

    // When
    const transformed = transformMetadataPayload(payload, country);

    // Then
    expect(transformed.currentCountry).toBe(EXPECTED_COUNTRY);
    expect(transformed.variables).toEqual({});
    expect(transformed.parameters).toEqual({});
    expect(transformed.entities).toEqual({});
    expect(transformed.variableModules).toEqual({});
    expect(transformed.economyOptions).toEqual({
      region: [],
      time_period: [],
      datasets: [],
    });
    expect(transformed.currentLawId).toBe(0);
    expect(transformed.basicInputs).toEqual([]);
    expect(transformed.modelledPolicies).toEqual({ core: {}, filtered: {} });
    expect(transformed.version).toBeNull();
    expect(transformed.parameterTree).toBeNull();
  });

  test('given different country then uses provided country', () => {
    // Given
    const payload = createMockMetadataApiPayload();
    const country = 'uk';

    // When
    const transformed = transformMetadataPayload(payload, country);

    // Then
    expect(transformed.currentCountry).toBe('uk');
  });

  test('given partial economy options then merges with defaults', () => {
    // Given
    const payload = createMockMetadataApiPayload({
      economy_options: {
        region: MOCK_REGIONS,
        // Missing time_period and datasets
      } as any,
    });
    const country = EXPECTED_COUNTRY;

    // When
    const transformed = transformMetadataPayload(payload, country);

    // Then
    expect(transformed.economyOptions.region).toEqual(MOCK_REGIONS);
    expect(transformed.economyOptions.time_period).toBeUndefined();
    expect(transformed.economyOptions.datasets).toBeUndefined();
  });

  test('given partial modelled policies then merges with defaults', () => {
    // Given
    const payload = createMockMetadataApiPayload({
      modelled_policies: {
        core: { test: 'value' },
        // Missing filtered
      } as any,
    });
    const country = EXPECTED_COUNTRY;

    // When
    const transformed = transformMetadataPayload(payload, country);

    // Then
    expect(transformed.modelledPolicies.core).toEqual({ test: 'value' });
    expect(transformed.modelledPolicies.filtered).toBeUndefined();
  });
});
