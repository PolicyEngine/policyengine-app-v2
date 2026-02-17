import { describe, expect, it } from 'vitest';
import {
  MOCK_HOUSEHOLD_COMPLEX,
  MOCK_HOUSEHOLD_EMPTY,
  MOCK_HOUSEHOLD_SIMPLE,
  MOCK_HOUSEHOLD_SIMPLE_CLONE,
} from '@/tests/fixtures/utils/householdTableDataMocks';
import {
  extractHouseholdInputs,
  HouseholdInputRow,
  householdsAreEqual,
} from '@/utils/householdTableData';

describe('householdTableData', () => {
  describe('extractHouseholdInputs', () => {
    it('extracts person-level inputs from simple household', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_SIMPLE);

      // Should have 4 person inputs (2 people × 2 params each) + household inputs
      expect(rows.length).toBeGreaterThan(0);

      // Check "You" (person at index 0) inputs
      const person1Age = rows.find((r) => r.category === 'You' && r.paramName === 'age');
      expect(person1Age).toBeDefined();
      expect(person1Age?.value).toBe(35);
      expect(person1Age?.label).toBe('Age');

      const person1Income = rows.find(
        (r) => r.category === 'You' && r.paramName === 'employment_income'
      );
      expect(person1Income).toBeDefined();
      expect(person1Income?.value).toBe(50000);
      expect(person1Income?.label).toBe('Employment income');
    });

    it('extracts household-level inputs', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_SIMPLE);

      const householdState = rows.find(
        (r) => r.category === 'Household' && r.paramName === 'state_name'
      );
      expect(householdState).toBeDefined();
      expect(householdState?.value).toBe('CA');
      expect(householdState?.label).toBe('State name');
    });

    it('handles complex household with multiple parameters', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_COMPLEX);

      // Should extract all person inputs
      const youAge = rows.find((r) => r.category === 'You' && r.paramName === 'age');
      expect(youAge?.value).toBe(45);

      const youEmployment = rows.find(
        (r) => r.category === 'You' && r.paramName === 'employment_income'
      );
      expect(youEmployment?.value).toBe(75000);

      const youSelfEmployment = rows.find(
        (r) => r.category === 'You' && r.paramName === 'self_employment_income'
      );
      expect(youSelfEmployment?.value).toBe(10000);

      // Check children
      const child1Age = rows.find(
        (r) => r.category === 'Your first dependent' && r.paramName === 'age'
      );
      expect(child1Age?.value).toBe(12);

      // Check household-level vars
      const rent = rows.find((r) => r.category === 'Household' && r.paramName === 'rent');
      expect(rent?.value).toBe(24000);
    });

    it('returns empty array for empty household', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_EMPTY);
      expect(rows).toEqual([]);
    });

    it('formats parameter labels correctly', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_SIMPLE);

      const employmentIncome = rows.find((r) => r.paramName === 'employment_income');
      expect(employmentIncome?.label).toBe('Employment income');

      const stateName = rows.find((r) => r.paramName === 'state_name');
      expect(stateName?.label).toBe('State name');
    });

    it('returns structured row objects', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_SIMPLE);

      rows.forEach((row: HouseholdInputRow) => {
        expect(row).toHaveProperty('category');
        expect(row).toHaveProperty('label');
        expect(row).toHaveProperty('paramName');
        expect(row).toHaveProperty('value');
        expect(typeof row.category).toBe('string');
        expect(typeof row.label).toBe('string');
        expect(typeof row.paramName).toBe('string');
      });
    });
  });

  describe('householdsAreEqual', () => {
    it('returns false when either household is undefined', () => {
      expect(householdsAreEqual(undefined, MOCK_HOUSEHOLD_SIMPLE)).toBe(false);
      expect(householdsAreEqual(MOCK_HOUSEHOLD_SIMPLE, undefined)).toBe(false);
      expect(householdsAreEqual(undefined, undefined)).toBe(false);
    });

    it('returns true when households have the same ID', () => {
      expect(householdsAreEqual(MOCK_HOUSEHOLD_SIMPLE, MOCK_HOUSEHOLD_SIMPLE)).toBe(true);
    });

    it('returns true when households have identical data', () => {
      expect(householdsAreEqual(MOCK_HOUSEHOLD_SIMPLE, MOCK_HOUSEHOLD_SIMPLE_CLONE)).toBe(true);
    });

    it('returns false when households have different data', () => {
      expect(householdsAreEqual(MOCK_HOUSEHOLD_SIMPLE, MOCK_HOUSEHOLD_COMPLEX)).toBe(false);
    });

    it('returns false when comparing with empty household', () => {
      expect(householdsAreEqual(MOCK_HOUSEHOLD_SIMPLE, MOCK_HOUSEHOLD_EMPTY)).toBe(false);
    });

    it('returns true for two empty households', () => {
      expect(householdsAreEqual(MOCK_HOUSEHOLD_EMPTY, MOCK_HOUSEHOLD_EMPTY)).toBe(true);
    });
  });
});
