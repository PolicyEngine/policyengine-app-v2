import { describe, expect, it } from 'vitest';
import { getFieldLabel, getFieldOptions, isDropdownField } from '@/libs/metadataUtils';
import type { RootState } from '@/store';
import {
  EXPECTED_LABELS,
  mockStateWithVariables,
  TEST_FIELD_NAMES,
} from '@/tests/fixtures/libs/metadataUtilsMocks';

describe('metadataUtils', () => {
  describe('isDropdownField', () => {
    it('given state_name with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithVariables() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.STATE_NAME);

      // Then
      expect(result).toBe(true);
    });

    it('given region with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithVariables() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.REGION);

      // Then
      expect(result).toBe(true);
    });

    it('given brma with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithVariables() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.BRMA);

      // Then
      expect(result).toBe(true);
    });

    it('given local_authority with possibleValues then returns true', () => {
      // Given
      const state = mockStateWithVariables() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.LOCAL_AUTHORITY);

      // Then
      expect(result).toBe(true);
    });

    it('given age without possibleValues then returns false', () => {
      // Given
      const state = mockStateWithVariables() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.AGE);

      // Then
      expect(result).toBe(false);
    });

    it('given employment_income without possibleValues then returns false', () => {
      // Given
      const state = mockStateWithVariables() as RootState;

      // When
      const result = isDropdownField(state, TEST_FIELD_NAMES.EMPLOYMENT_INCOME);

      // Then
      expect(result).toBe(false);
    });

    it('given unknown field then returns false', () => {
      // Given
      const state = mockStateWithVariables() as RootState;

      // When
      const result = isDropdownField(state, 'unknown_field');

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getFieldOptions', () => {
    it('given field with possibleValues then returns options array', () => {
      // Given
      const state = mockStateWithVariables() as RootState;
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
      const state = mockStateWithVariables() as RootState;
      const fieldName = TEST_FIELD_NAMES.AGE;

      // When
      const result = getFieldOptions(state, fieldName);

      // Then
      expect(result).toEqual([]);
    });

    it('given region field then returns region options from possibleValues', () => {
      // Given
      const state = mockStateWithVariables() as RootState;
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
      const state = mockStateWithVariables() as RootState;
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

    it('given employment_income then returns Employment Income', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.EMPLOYMENT_INCOME)).toBe(
        EXPECTED_LABELS.EMPLOYMENT_INCOME
      );
    });

    it('given brma then returns Broad Rental Market Area', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.BRMA)).toBe(EXPECTED_LABELS.BRMA);
    });

    it('given unmapped field then title-cases it', () => {
      expect(getFieldLabel(TEST_FIELD_NAMES.HOUSEHOLD_INCOME)).toBe(
        EXPECTED_LABELS.HOUSEHOLD_INCOME
      );
    });

    it('given snake_case then converts to Title Case', () => {
      expect(getFieldLabel('some_field_name')).toBe('Some Field Name');
    });
  });
});
