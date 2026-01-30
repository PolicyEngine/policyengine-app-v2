import { Population } from '@/types/ingredients/Population';

/**
 * Creates a mock population with a complex household structure
 * including nested people and family data
 */
export function mockPopulationWithComplexHousehold(): Population {
  return {
    label: 'Test Household',
    isCreated: true,
    household: {
      id: '12345',
      tax_benefit_model_name: 'policyengine_us',
      year: 2024,
      people: [
        {
          person_id: 0,
          name: 'John Doe',
          age: 35,
          employment_income: 50000,
          person_family_id: 0,
          person_tax_unit_id: 0,
          person_household_id: 0,
        },
        {
          person_id: 1,
          name: 'Jane Doe',
          age: 33,
          employment_income: 45000,
          person_family_id: 0,
          person_tax_unit_id: 0,
          person_household_id: 0,
        },
      ],
      family: [{ family_id: 0 }],
      tax_unit: [{ tax_unit_id: 0 }],
      household: [{ household_id: 0 }],
    },
    geography: null,
  };
}

/**
 * Creates a mock population with a geography
 */
export function mockPopulationWithGeography(): Population {
  return {
    label: 'California Analysis',
    isCreated: true,
    household: null,
    geography: {
      countryId: 'us',
      regionCode: 'ca',
    },
  };
}

/**
 * Creates a mock population with just a label
 */
export function mockPopulationWithLabel(label: string): Population {
  return {
    label,
    isCreated: true,
    household: null,
    geography: null,
  };
}
