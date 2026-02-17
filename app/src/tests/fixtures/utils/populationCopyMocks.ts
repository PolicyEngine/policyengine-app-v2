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
      countryId: 'us',
      householdData: {
        people: {
          person1: {
            name: 'John Doe',
            age: { '2024': 35 },
            employment_income: { '2024': 50000 },
          },
          person2: {
            name: 'Jane Doe',
            age: { '2024': 33 },
            employment_income: { '2024': 45000 },
          },
        },
        families: {
          family1: {
            members: ['person1', 'person2'],
          },
        },
        tax_units: {
          tax_unit1: {
            members: ['person1', 'person2'],
          },
        },
        households: {
          household1: {
            members: ['person1', 'person2'],
          },
        },
      },
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
