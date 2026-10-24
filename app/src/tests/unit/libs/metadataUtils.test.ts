import { describe, expect, it } from 'vitest';
import {
  getFieldLabel,
  getFieldOptions,
  isDropdownField,
  selectSearchableParameters,
  transformMetadataPayload,
} from '@/libs/metadataUtils';
import type { RootState } from '@/store';
import {
  EXPECTED_LABELS,
  INELIGIBLE_SEARCH_PARAMETERS,
  mockMetadataPayload,
  mockMinimalPayload,
  mockStateWithMetadata,
  SAME_LABEL_SEARCH_PARAMETERS,
  SEARCH_VISIBILITY_CASES,
  searchVisibilityState,
  SORTED_SEARCH_PARAMETERS,
  TEST_FIELD_NAMES,
  VISIBLE_SEARCH_PARAMETER,
} from '@/tests/fixtures/libs/metadataUtilsMocks';

describe('metadataUtils', () => {
  describe('isDropdownField', () => {
    it('given state_name with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.STATE_NAME);

      // Then
      expect(result).toBe(true);
    });

    it('given region with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.REGION);

      // Then
      expect(result).toBe(true);
    });

    it('given brma with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.BRMA);

      // Then
      expect(result).toBe(true);
    });

    it('given local_authority with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.LOCAL_AUTHORITY);

      // Then
      expect(result).toBe(true);
    });

    it('given age without possibleValues then returns false', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.AGE);

      // Then
      expect(result).toBe(false);
    });

    it('given employment_income without possibleValues then returns false', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.EMPLOYMENT_INCOME);

      // Then
      expect(result).toBe(false);
    });

    it('given unknown field then returns false', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;

      // When
      const result = isDropdownField(state, 'unknown_field');

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getFieldOptions', () => {
    it('given field with possibleValues then returns options array', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;
      const fieldName = TEST_FIELD_NAMES.STATE_NAME;

      // When
      const result = getFieldOptions(state, fieldName);

      // Then
      expect(result).toEqual([
        { value: 'CA', label: 'California' },
        { value: 'NY', label: 'New York' },
      ]);
    });

    it('given field without possibleValues then returns empty array', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;
      const fieldName = TEST_FIELD_NAMES.AGE;

      // When
      const result = getFieldOptions(state, fieldName);

      // Then
      expect(result).toEqual([]);
    });

    it('given region field then returns region options from possibleValues', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;
      const fieldName = TEST_FIELD_NAMES.REGION;

      // When
      const result = getFieldOptions(state, fieldName);

      // Then
      expect(result).toEqual([
        { value: 'NORTH_EAST', label: 'North East' },
        { value: 'SOUTH', label: 'South' },
      ]);
    });

    it('given nonexistent field then returns empty array', () => {
      // Given
      const state = mockStateWithMetadata() as RootState;
      const fieldName = 'nonexistent_field';

      // When
      const result = getFieldOptions(state, fieldName);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getFieldLabel', () => {
    it('given state_name then returns State', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.STATE_NAME)).toBe(EXPECTED_LABELS.STATE);
    });

    it('given region then returns Region', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.REGION)).toBe(EXPECTED_LABELS.REGION);
    });

    it('given age then returns Age', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.AGE)).toBe(EXPECTED_LABELS.AGE);
    });

    it('given employment_income then returns Employment income', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.EMPLOYMENT_INCOME)).toBe(
        EXPECTED_LABELS.EMPLOYMENT_INCOME
      );
    });

    it('given brma then returns Broad Rental Market Area', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.BRMA)).toBe(EXPECTED_LABELS.BRMA);
    });

    it('given unmapped field then converts it to sentence case', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.HOUSEHOLD_INCOME)).toBe(
        EXPECTED_LABELS.HOUSEHOLD_INCOME
      );
    });

    it('given snake_case then converts to sentence case', () => {
      expect(getFieldLabel('some_field_name')).toBe('Some field name');
    });
  });

  describe('transformMetadataPayload', () => {
    it('given valid payload then transforms correctly', () => {
      // Given
      const payload = mockMetadataPayload();

      // When
      const result = transformMetadataPayload(payload, 'us');

      // Then
      expect(result.currentCountry).toBe('us');
      expect(result.currentLawId).toBe(1);
      expect(result.basicInputs).toEqual(['age', 'employment_income']);
      expect(result.version).toBe('1.0.0');
      expect(result.parameterTree).toBeNull();
      expect(result.variables).toHaveProperty('age');
      expect(result.variables).toHaveProperty('state_name');
      expect(result.variables.state_name.possibleValues).toBeDefined();
    });

    it('given missing economy_options then uses default', () => {
      // Given
      const payload = mockMinimalPayload();

      // When
      const result = transformMetadataPayload(payload, 'us');

      // Then
      expect(result.economyOptions).toEqual({
        region: [],
        time_period: [],
        datasets: [],
      });
    });

    it('given missing basicInputs then uses empty array', () => {
      // Given
      const payload = mockMinimalPayload();

      // When
      const result = transformMetadataPayload(payload, 'us');

      // Then
      expect(result.basicInputs).toEqual([]);
    });

    it('given missing currentLawId then uses 0', () => {
      // Given
      const payload = mockMinimalPayload();

      // When
      const result = transformMetadataPayload(payload, 'us');

      // Then
      expect(result.currentLawId).toBe(0);
    });

    it('given missing modelledPolicies then uses empty core and filtered', () => {
      // Given
      const payload = mockMinimalPayload();

      // When
      const result = transformMetadataPayload(payload, 'us');

      // Then
      expect(result.modelledPolicies).toEqual({
        core: {},
        filtered: {},
      });
    });

    it('given parameterTree in payload then sets to null', () => {
      // Given
      const payload = mockMinimalPayload();

      // When
      const result = transformMetadataPayload(payload, 'us');

      // Then
      expect(result.parameterTree).toBeNull();
    });
  });
});

describe('selectSearchableParameters visibility', () => {
  it.each(SEARCH_VISIBILITY_CASES)(
    'given $name visibility flags then search follows tree visibility',
    ({ flags, visible }) => {
      const parameter = { ...VISIBLE_SEARCH_PARAMETER };
      delete parameter.economy;
      delete parameter.household;
      Object.assign(parameter, flags);
      const state = searchVisibilityState({ [parameter.parameter]: parameter });
      expect(selectSearchableParameters(state)).toEqual(
        visible ? [{ value: parameter.parameter, label: parameter.label }] : []
      );
    }
  );
  it('given API default true visibility then the parameter remains searchable', () => {
    expect(
      selectSearchableParameters(searchVisibilityState({ rate: VISIBLE_SEARCH_PARAMETER }))
    ).toEqual([
      { value: VISIBLE_SEARCH_PARAMETER.parameter, label: VISIBLE_SEARCH_PARAMETER.label },
    ]);
  });
  it('given no parameters then search remains empty', () => {
    expect(selectSearchableParameters(searchVisibilityState({}))).toEqual([]);
    expect(selectSearchableParameters(searchVisibilityState(undefined))).toEqual([]);
  });
  it('given visible nodes or unlabelled or excluded paths then original filters still exclude them', () => {
    expect(selectSearchableParameters(searchVisibilityState(INELIGIBLE_SEARCH_PARAMETERS))).toEqual(
      []
    );
  });
  it('given distinct visible IDs with equal labels then both remain searchable', () => {
    expect(selectSearchableParameters(searchVisibilityState(SAME_LABEL_SEARCH_PARAMETERS))).toEqual(
      [
        { value: 'gov.income_tax.basic_rate', label: 'Basic tax rate' },
        { value: 'gov.capital_gains.basic_rate', label: 'Basic tax rate' },
      ]
    );
  });
  it('given labels in reverse order then original alphabetical sort remains', () => {
    expect(selectSearchableParameters(searchVisibilityState(SORTED_SEARCH_PARAMETERS))).toEqual([
      { value: 'gov.tax.alpha', label: 'Alpha rate' },
      { value: 'gov.tax.zulu', label: 'Zulu rate' },
    ]);
  });
});
