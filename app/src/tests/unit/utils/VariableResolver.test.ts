import { describe, expect, it } from 'vitest';
import type { Household } from '@/types/ingredients/Household';
import { getValue, setValue } from '@/utils/VariableResolver';

const TEST_METADATA = {
  variables: {
    state_name: {
      name: 'state_name',
      label: 'State name',
      entity: 'household',
      valueType: 'str',
      defaultValue: '',
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'household',
    },
    taxable_income: {
      name: 'taxable_income',
      label: 'Taxable income',
      entity: 'tax_unit',
      valueType: 'float',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'tax_unit',
    },
  },
  entities: {
    household: {
      plural: 'households',
      label: 'Household',
      is_person: false,
    },
    tax_unit: {
      plural: 'tax_units',
      label: 'Tax Unit',
      is_person: false,
    },
  },
};

function createNonDefaultGroupHousehold(): Household {
  return {
    id: 'household-1',
    countryId: 'us',
    householdData: {
      people: {
        adult: { age: { '2026': 35 } },
      },
      households: {
        household2: {
          members: ['adult'],
          state_name: { '2026': 'ca' },
        },
      },
      taxUnits: {
        taxUnit2: {
          members: ['adult'],
          taxable_income: { '2026': 50000 },
        },
      },
    },
  };
}

describe('VariableResolver', () => {
  it('reads household-level values from the first available real group name', () => {
    const household = createNonDefaultGroupHousehold();

    expect(getValue(household, 'state_name', TEST_METADATA, '2026')).toBe('ca');
    expect(getValue(household, 'taxable_income', TEST_METADATA, '2026')).toBe(50000);
  });

  it('writes household-level values to the first available real group name', () => {
    const household = createNonDefaultGroupHousehold();

    const updatedHousehold = setValue(household, 'state_name', 'ny', TEST_METADATA, '2026');
    const updatedTaxUnitHousehold = setValue(
      household,
      'taxable_income',
      75000,
      TEST_METADATA,
      '2026'
    );

    expect(updatedHousehold.householdData.households?.household2?.state_name).toEqual({
      '2026': 'ny',
    });
    expect(updatedTaxUnitHousehold.householdData.taxUnits?.taxUnit2?.taxable_income).toEqual({
      '2026': 75000,
    });
    expect(household.householdData.households?.household2?.state_name).toEqual({
      '2026': 'ca',
    });
    expect(household.householdData.taxUnits?.taxUnit2?.taxable_income).toEqual({
      '2026': 50000,
    });
  });
});
