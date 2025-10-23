import { describe, it, expect } from 'vitest';
import {
  isDropdownField,
  getFieldLabel,
  transformMetadataPayload,
} from '@/libs/metadataUtils';
import {
  mockMetadataPayload,
  mockMinimalPayload,
  TEST_FIELD_NAMES,
  EXPECTED_LABELS,
} from '@/tests/fixtures/libs/metadataUtilsMocks';

describe('metadataUtils', () => {
  describe('isDropdownField', () => {
    it('given state_name then returns true', () => {
      expect(isDropdownField(TEST_FIELD_NAMES.STATE_NAME)).toBe(true);
    });

    it('given region then returns true', () => {
      expect(isDropdownField(TEST_FIELD_NAMES.REGION)).toBe(true);
    });

    it('given brma then returns true', () => {
      expect(isDropdownField(TEST_FIELD_NAMES.BRMA)).toBe(true);
    });

    it('given local_authority then returns true', () => {
      expect(isDropdownField(TEST_FIELD_NAMES.LOCAL_AUTHORITY)).toBe(true);
    });

    it('given age then returns false', () => {
      expect(isDropdownField(TEST_FIELD_NAMES.AGE)).toBe(false);
    });

    it('given employment_income then returns false', () => {
      expect(isDropdownField(TEST_FIELD_NAMES.EMPLOYMENT_INCOME)).toBe(false);
    });

    it('given unknown field then returns false', () => {
      expect(isDropdownField('unknown_field')).toBe(false);
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

    it('given employment_income then returns Employment Income', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.EMPLOYMENT_INCOME)).toBe(EXPECTED_LABELS.EMPLOYMENT_INCOME);
    });

    it('given brma then returns Broad Rental Market Area', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.BRMA)).toBe(EXPECTED_LABELS.BRMA);
    });

    it('given unmapped field then title-cases it', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.HOUSEHOLD_INCOME)).toBe(EXPECTED_LABELS.HOUSEHOLD_INCOME);
    });

    it('given snake_case then converts to Title Case', () => {
      expect(getFieldLabel('some_field_name')).toBe('Some Field Name');
    });
  });

  describe('transformMetadataPayload', () => {
    it('given valid payload then transforms correctly', () => {
      // Given
      const payload = mockMetadataPayload();

      // When
      const result = transformMetadataPayload(payload, 'us');

      // Then
      expect(result).toEqual({
        currentCountry: 'us',
        variables: { age: { label: 'Age' } },
        parameters: { tax_rate: {} },
        entities: { person: {} },
        variableModules: { household: ['age'] },
        economyOptions: {
          region: [{ name: 'us', label: 'United States' }],
          time_period: [{ name: 2024, label: '2024' }],
          datasets: [],
        },
        currentLawId: 1,
        basicInputs: ['age', 'employment_income'],
        modelledPolicies: {
          core: { '1': 'Policy 1' },
          filtered: {},
        },
        version: '1.0.0',
        parameterTree: null,
      });
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
