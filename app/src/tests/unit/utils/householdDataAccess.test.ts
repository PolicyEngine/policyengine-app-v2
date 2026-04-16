import { describe, expect, it } from 'vitest';
import type { AppHouseholdInputData } from '@/models/household/appTypes';
import {
  ensureHouseholdGroupInstance,
  getPreferredHouseholdGroupName,
} from '@/utils/householdDataAccess';

function createHouseholdData(): AppHouseholdInputData {
  return {
    people: {
      adult: { age: { '2026': 35 } },
      child: { age: { '2026': 8 } },
    },
  };
}

describe('householdDataAccess', () => {
  it('creates an entity-specific default group instead of using legacy household naming', () => {
    const householdData = createHouseholdData();

    const taxUnitName = ensureHouseholdGroupInstance(householdData, 'tax_units');
    const maritalUnitName = ensureHouseholdGroupInstance(householdData, 'maritalUnits');

    expect(taxUnitName).toBe('taxUnit1');
    expect(maritalUnitName).toBe('maritalUnit1');
    expect(householdData.taxUnits?.taxUnit1).toEqual({
      members: ['adult', 'child'],
    });
    expect(householdData.maritalUnits?.maritalUnit1).toEqual({
      members: ['adult', 'child'],
    });
  });

  it('reuses the first existing group name when one is already present', () => {
    const householdData = createHouseholdData();
    householdData.households = {
      household2: {
        members: ['adult', 'child'],
      },
    };

    expect(ensureHouseholdGroupInstance(householdData, 'households')).toBe('household2');
    expect(getPreferredHouseholdGroupName(householdData, 'households')).toBe('household2');
  });
});
