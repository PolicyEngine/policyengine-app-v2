import { Population } from '@/types/ingredients/Population';

/**
 * Creates a mock population with a complex household structure
 * v2 Alpha: no person_id/name/person_*_id, entity groups are single dicts
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
          age: 35,
          employment_income: 50000,
        },
        {
          age: 33,
          employment_income: 45000,
        },
      ],
      family: {},
      tax_unit: {},
      household: {},
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
