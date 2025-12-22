import { describe, expect, it } from 'vitest';
import { getBasicInputs, US_BASIC_INPUTS, UK_BASIC_INPUTS } from '@/data/static/basicInputs';
import {
  TEST_COUNTRIES,
  EXPECTED_US_BASIC_INPUTS,
  EXPECTED_UK_BASIC_INPUTS,
} from '@/tests/fixtures/data/static/staticDataMocks';

describe('basicInputs', () => {
  describe('US_BASIC_INPUTS', () => {
    it('given US basic inputs then contains expected fields', () => {
      // Then
      expect(US_BASIC_INPUTS).toEqual([...EXPECTED_US_BASIC_INPUTS]);
    });

    it('given US basic inputs then includes age and employment_income', () => {
      // Then
      expect(US_BASIC_INPUTS).toContain('age');
      expect(US_BASIC_INPUTS).toContain('employment_income');
    });

    it('given US basic inputs then includes state_name for geographic selection', () => {
      // Then
      expect(US_BASIC_INPUTS).toContain('state_name');
    });
  });

  describe('UK_BASIC_INPUTS', () => {
    it('given UK basic inputs then contains expected fields', () => {
      // Then
      expect(UK_BASIC_INPUTS).toEqual([...EXPECTED_UK_BASIC_INPUTS]);
    });

    it('given UK basic inputs then includes age and employment_income', () => {
      // Then
      expect(UK_BASIC_INPUTS).toContain('age');
      expect(UK_BASIC_INPUTS).toContain('employment_income');
    });

    it('given UK basic inputs then includes region for geographic selection', () => {
      // Then
      expect(UK_BASIC_INPUTS).toContain('region');
    });
  });

  describe('getBasicInputs', () => {
    it('given US country code then returns US basic inputs', () => {
      // When
      const inputs = getBasicInputs(TEST_COUNTRIES.US);

      // Then
      expect(inputs).toBe(US_BASIC_INPUTS);
    });

    it('given UK country code then returns UK basic inputs', () => {
      // When
      const inputs = getBasicInputs(TEST_COUNTRIES.UK);

      // Then
      expect(inputs).toBe(UK_BASIC_INPUTS);
    });

    it('given unknown country code then returns empty array', () => {
      // When
      const inputs = getBasicInputs(TEST_COUNTRIES.UNKNOWN);

      // Then
      expect(inputs).toEqual([]);
    });
  });
});
