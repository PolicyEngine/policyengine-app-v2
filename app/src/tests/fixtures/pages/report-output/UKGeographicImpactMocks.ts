/**
 * Mock data for UKGeographicImpact tests
 */

import { Geography } from '@/types/ingredients/Geography';

/**
 * Mock UK economy output with constituency data
 */
export const mockUKEconomyOutput = {
  budget: {
    budgetary_impact: 1000000,
  },
  poverty: {
    poverty: {
      all: {
        baseline: 0.15,
        reform: 0.12,
      },
    },
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.2,
      'Gain less than 5%': 0.3,
      'Lose more than 5%': 0.1,
      'Lose less than 5%': 0.15,
      'No change': 0.25,
    },
  },
  constituency_impact: {
    by_constituency: {
      'Brighton Kemptown and Peacehaven': {
        average_household_income_change: 1250.5,
        relative_household_income_change: 0.025,
      },
      Aldershot: {
        average_household_income_change: -500.75,
        relative_household_income_change: -0.015,
      },
    },
    outcomes_by_region: {
      england: {
        'Gain less than 5%': 150,
        'Gain more than 5%': 120,
        'Lose less than 5%': 80,
        'Lose more than 5%': 30,
        'No change': 170,
      },
      scotland: {
        'Gain less than 5%': 30,
        'Gain more than 5%': 25,
        'Lose less than 5%': 10,
        'Lose more than 5%': 5,
        'No change': 30,
      },
      wales: {
        'Gain less than 5%': 20,
        'Gain more than 5%': 15,
        'Lose less than 5%': 8,
        'Lose more than 5%': 2,
        'No change': 10,
      },
      northern_ireland: {
        'Gain less than 5%': 10,
        'Gain more than 5%': 8,
        'Lose less than 5%': 4,
        'Lose more than 5%': 1,
        'No change': 5,
      },
    },
  },
} as any;

/**
 * Mock US economy output (no constituency data)
 */
export const mockUSEconomyOutput = {
  budget: {
    budgetary_impact: 1000000,
  },
  poverty: {
    poverty: {
      all: {
        baseline: 0.15,
        reform: 0.12,
      },
    },
  },
  intra_decile: {
    all: {
      'Gain more than 5%': 0.2,
      'Gain less than 5%': 0.3,
      'Lose more than 5%': 0.1,
      'Lose less than 5%': 0.15,
      'No change': 0.25,
    },
  },
} as any;

/**
 * Mock geography selections
 */
export const mockGeographies = {
  ukNational: {
    id: 'uk',
    countryId: 'uk',
    scope: 'national',
    geographyId: 'uk',
  } as Geography,

  brightonConstituency: {
    id: 'uk-constituency-Brighton Kemptown and Peacehaven',
    countryId: 'uk',
    scope: 'subnational',
    geographyId: 'constituency/Brighton Kemptown and Peacehaven',
  } as Geography,

  aldershotConstituency: {
    id: 'uk-constituency-Aldershot',
    countryId: 'uk',
    scope: 'subnational',
    geographyId: 'constituency/Aldershot',
  } as Geography,

  englandCountry: {
    id: 'uk-country-england',
    countryId: 'uk',
    scope: 'subnational',
    geographyId: 'country/england',
  } as Geography,

  scotlandCountry: {
    id: 'uk-country-scotland',
    countryId: 'uk',
    scope: 'subnational',
    geographyId: 'country/scotland',
  } as Geography,

  unknownConstituency: {
    id: 'uk-constituency-Unknown',
    countryId: 'uk',
    scope: 'subnational',
    geographyId: 'constituency/Unknown',
  } as Geography,
};
