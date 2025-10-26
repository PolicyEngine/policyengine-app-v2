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

      // Check person-1 inputs
      const person1Age = rows.find((r) => r.category === 'person-1' && r.paramName === 'age');
      expect(person1Age).toBeDefined();
      expect(person1Age?.value).toBe(35);
      expect(person1Age?.label).toBe('Age');

      const person1Income = rows.find(
        (r) => r.category === 'person-1' && r.paramName === 'employment_income'
      );
      expect(person1Income).toBeDefined();
      expect(person1Income?.value).toBe(50000);
      expect(person1Income?.label).toBe('Employment Income');
    });

    it('extracts household-level inputs', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_SIMPLE);

      const householdState = rows.find(
        (r) => r.category === 'Household' && r.paramName === 'state_name'
      );
      expect(householdState).toBeDefined();
      expect(householdState?.value).toBe('CA');
      expect(householdState?.label).toBe('State Name');
    });

    it('handles complex household with multiple parameters', () => {
      const rows = extractHouseholdInputs(MOCK_HOUSEHOLD_COMPLEX);

      // Should extract all person inputs
      const adult1Age = rows.find((r) => r.category === 'adult1' && r.paramName === 'age');
      expect(adult1Age?.value).toBe(45);

      const adult1Employment = rows.find(
        (r) => r.category === 'adult1' && r.paramName === 'employment_income'
      );
      expect(adult1Employment?.value).toBe(75000);

      const adult1SelfEmployment = rows.find(
        (r) => r.category === 'adult1' && r.paramName === 'self_employment_income'
      );
      expect(adult1SelfEmployment?.value).toBe(10000);

      // Check children
      const child1Age = rows.find((r) => r.category === 'child1' && r.paramName === 'age');
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
      expect(employmentIncome?.label).toBe('Employment Income');

      const stateName = rows.find((r) => r.paramName === 'state_name');
      expect(stateName?.label).toBe('State Name');
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
