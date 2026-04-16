import { describe, expect, test } from 'vitest';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import {
  deriveHouseholdBuilderComposition,
  updateHouseholdBuilderChildCount,
  updateHouseholdBuilderMaritalStatus,
} from '@/utils/householdBuilderComposition';

const YEAR = '2026';

describe('householdBuilderComposition', () => {
  test('derives partner and child composition without relying on canonical labels', () => {
    const builder = new HouseholdBuilder('us', YEAR);
    builder.addAdult('alex', 34, { employment_income: 0 });
    builder.addAdult('sam', 33, { employment_income: 0 });
    builder.setMaritalStatus('alex', 'sam');
    builder.addChild('morgan', 12, ['alex', 'sam'], { employment_income: 0 });

    const composition = deriveHouseholdBuilderComposition(builder.build(), YEAR);

    expect(composition.primaryPersonKey).toBe('alex');
    expect(composition.partnerKey).toBe('sam');
    expect(composition.maritalStatus).toBe('married');
    expect(composition.childKeys).toEqual(['morgan']);
    expect(composition.numChildren).toBe(1);
  });

  test('removes the actual partner when toggling back to single', () => {
    const builder = new HouseholdBuilder('us', YEAR);
    builder.addAdult('alex', 34, { employment_income: 0 });
    builder.addAdult('sam', 33, { employment_income: 0 });
    builder.setMaritalStatus('alex', 'sam');

    const updatedHousehold = updateHouseholdBuilderMaritalStatus(builder.build(), YEAR, 'single');

    expect(updatedHousehold.householdData.people.alex).toBeDefined();
    expect(updatedHousehold.householdData.people.sam).toBeUndefined();
    expect(updatedHousehold.householdData.maritalUnits?.['your marital unit']?.members).toEqual([
      'alex',
    ]);
  });

  test('preserves existing children when increasing the child count', () => {
    const builder = new HouseholdBuilder('us', YEAR);
    builder.addAdult('alex', 34, { employment_income: 0 });
    builder.addChild('morgan', 12, ['alex'], { employment_income: 0 });

    const updatedHousehold = updateHouseholdBuilderChildCount(builder.build(), YEAR, 2);
    const people = Object.keys(updatedHousehold.householdData.people);

    expect(people).toContain('morgan');
    expect(people).toContain('your second dependent');
    expect(deriveHouseholdBuilderComposition(updatedHousehold, YEAR).numChildren).toBe(2);
  });
});
