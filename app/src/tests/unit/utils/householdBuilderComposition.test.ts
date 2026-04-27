import { describe, expect, test } from 'vitest';
import { Household } from '@/models/Household';
import {
  deriveHouseholdBuilderComposition,
  updateHouseholdBuilderChildCount,
  updateHouseholdBuilderMaritalStatus,
} from '@/utils/householdBuilderComposition';

const YEAR = '2026';

describe('householdBuilderComposition', () => {
  test('derives partner and child composition without relying on canonical labels', () => {
    const household = Household.empty('us', YEAR)
      .addAdult('alex', 34, { employment_income: 0 })
      .addAdult('sam', 33, { employment_income: 0 })
      .setMaritalStatus('alex', 'sam')
      .addChild('morgan', 12, ['alex', 'sam'], { employment_income: 0 });

    const composition = deriveHouseholdBuilderComposition(household, YEAR);

    expect(composition.primaryPersonKey).toBe('alex');
    expect(composition.partnerKey).toBe('sam');
    expect(composition.maritalStatus).toBe('married');
    expect(composition.childKeys).toEqual(['morgan']);
    expect(composition.numChildren).toBe(1);
  });

  test('removes the actual partner when toggling back to single', () => {
    const household = Household.empty('us', YEAR)
      .addAdult('alex', 34, { employment_income: 0 })
      .addAdult('sam', 33, { employment_income: 0 })
      .setMaritalStatus('alex', 'sam');

    const updatedHousehold = updateHouseholdBuilderMaritalStatus(household, YEAR, 'single');
    const updatedHouseholdInput = updatedHousehold.toAppInput();

    expect(updatedHouseholdInput.householdData.people.alex).toBeDefined();
    expect(updatedHouseholdInput.householdData.people.sam).toBeUndefined();
    expect(
      updatedHouseholdInput.householdData.maritalUnits?.['your marital unit']?.members
    ).toEqual(['alex']);
  });

  test('preserves existing children when increasing the child count', () => {
    const household = Household.empty('us', YEAR)
      .addAdult('alex', 34, { employment_income: 0 })
      .addChild('morgan', 12, ['alex'], { employment_income: 0 });

    const updatedHousehold = updateHouseholdBuilderChildCount(household, YEAR, 2);
    const people = Object.keys(updatedHousehold.toAppInput().householdData.people);

    expect(people).toContain('morgan');
    expect(people).toContain('your second dependent');
    expect(deriveHouseholdBuilderComposition(updatedHousehold, YEAR).numChildren).toBe(2);
  });
});
