import { vi } from 'vitest';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { UserGeographicAssociation } from '@/types/userIngredientAssociations';

// Test IDs and labels
export const TEST_USER_ID = 'test-user-123';
export const TEST_HOUSEHOLD_ID = 'household-456';
export const TEST_POPULATION_LABEL = 'Test Population 2024';
export const EMPTY_LABEL = '';
export const LONG_LABEL = 'A'.repeat(101); // Over 100 char limit

// Test text constants for assertions
export const UI_TEXT = {
  // Common
  CONTINUE_BUTTON: /Continue/i,
  BACK_BUTTON: /Back/i,

  // GeographicConfirmationFrame
  CONFIRM_GEOGRAPHIC_TITLE: 'Confirm Geographic Selection',
  CREATE_ASSOCIATION_BUTTON: /Create Geographic Association/i,
  SCOPE_NATIONAL: 'National',
  SCOPE_STATE: 'State',
  SCOPE_CONSTITUENCY: 'Constituency',
  COUNTRY_US: 'United States',
  COUNTRY_UK: 'United Kingdom',
  STATE_CALIFORNIA: 'California',
  CONSTITUENCY_LONDON: 'London',

  // HouseholdBuilderFrame
  BUILD_HOUSEHOLD_TITLE: 'Build Your Household',
  CREATE_HOUSEHOLD_BUTTON: /Create household/i,
  TAX_YEAR_LABEL: 'Tax Year',
  MARITAL_STATUS_LABEL: 'Marital Status',
  NUM_CHILDREN_LABEL: 'Number of Children',
  YOU_LABEL: 'You',
  YOUR_PARTNER_LABEL: 'Your Partner',
  CHILD_LABEL: (n: number) => `Child ${n}`,
  MARITAL_SINGLE: 'Single',
  MARITAL_MARRIED: 'Married',
  ERROR_LOAD_DATA: 'Failed to Load Required Data',
  ERROR_LOAD_MESSAGE: /Unable to load household configuration data/,

  // SelectGeographicScopeFrame
  CHOOSE_SCOPE_TITLE: 'Choose Geographic Scope',
  SCOPE_NATIONAL_LABEL: 'National',
  SCOPE_STATE_LABEL: 'State',
  SCOPE_HOUSEHOLD_LABEL: 'Custom Household',
  SELECT_STATE_PLACEHOLDER: 'Select a state',
  SELECT_UK_COUNTRY_PLACEHOLDER: 'Select a UK country',
  SELECT_CONSTITUENCY_PLACEHOLDER: 'Select a constituency',
  COUNTRY_ENGLAND: 'England',
  COUNTRY_SCOTLAND: 'Scotland',
  STATE_NEW_YORK: 'New York',
  STATE_TEXAS: 'Texas',
  CONSTITUENCY_MANCHESTER: 'Manchester',

  // SetPopulationLabelFrame
  NAME_POPULATION_TITLE: 'Name Your Population',
  POPULATION_LABEL: 'Population Label',
  LABEL_PLACEHOLDER: 'e.g., My Family 2024, California Low Income, UK National Average',
  LABEL_DESCRIPTION: 'Give your population a descriptive name to help identify it later.',
  LABEL_HELP_TEXT: 'This label will help you identify this population when creating simulations.',
  ERROR_EMPTY_LABEL: 'Please enter a label for your population',
  ERROR_LONG_LABEL: 'Label must be less than 100 characters',
  DEFAULT_NATIONAL_LABEL: 'National Population',
  DEFAULT_HOUSEHOLD_LABEL: 'Custom Household',
  DEFAULT_STATE_LABEL: (state: string) => `${state} Population`,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  FAILED_CREATE_ASSOCIATION: 'Failed to create geographic association:',
  FAILED_CREATE_HOUSEHOLD: 'Failed to create household:',
  STATE_NO_REGION: 'State selected but no region chosen',
  VALIDATION_FAILED: 'Household validation failed:',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
} as const;

// Input field placeholders
export const PLACEHOLDERS = {
  AGE: 'Age',
  EMPLOYMENT_INCOME: 'Employment Income',
  STATE_CODE: 'State',
} as const;

// Numeric test values
export const TEST_VALUES = {
  DEFAULT_AGE: 30,
  DEFAULT_INCOME: 50000,
  UPDATED_AGE: 35,
  UPDATED_INCOME: 75000,
  PARTNER_AGE: 28,
  PARTNER_INCOME: 45000,
  CHILD_DEFAULT_AGE: 10,
  MIN_ADULT_AGE: 18,
  MAX_ADULT_AGE: 120,
  MIN_CHILD_AGE: 0,
  MAX_CHILD_AGE: 17,
  LABEL_MAX_LENGTH: 100,
} as const;

// Geographic constants
export const GEOGRAPHIC_SCOPES = {
  NATIONAL: 'national',
  STATE: 'state',
  HOUSEHOLD: 'household',
} as const;

export const TEST_COUNTRIES = {
  US: 'us',
  UK: 'uk',
} as const;

export const TEST_REGIONS = {
  US_CALIFORNIA: 'state/ca',
  US_NEW_YORK: 'state/ny',
  UK_LONDON: 'constituency/london',
  UK_MANCHESTER: 'constituency/manchester',
} as const;

// Mock geography objects
export const mockNationalGeography: Geography = {
  id: TEST_COUNTRIES.US,
  countryId: TEST_COUNTRIES.US as any,
  scope: 'national',
  geographyId: TEST_COUNTRIES.US,
};

export const mockStateGeography: Geography = {
  id: `${TEST_COUNTRIES.US}-ca`,
  countryId: TEST_COUNTRIES.US as any,
  scope: 'subnational',
  geographyId: 'ca',
};

// Mock household - using a function to return a fresh mutable object each time
  id: TEST_HOUSEHOLD_ID,
  countryId: TEST_COUNTRIES.US as any,
  householdData: {
    people: {
      you: {
        age: { 2024: 30 },
        employment_income: { 2024: 50000 },
      },
    },
    families: {},
    spm_units: {},
    households: {
      'your household': {
        members: ['you'],
      },
    },
    marital_units: {},
    tax_units: {
      'your tax unit': {
        members: ['you'],
      },
    },
  },
});


// Mock Redux state
export const mockPopulationState = {
  type: 'geographic' as const,
  id: null,
  label: TEST_POPULATION_LABEL,
  geography: mockNationalGeography,
  household: null,
  isCreated: false,
};

export const getMockHouseholdPopulationState = () => ({
  type: 'household' as const,
  id: TEST_HOUSEHOLD_ID,
  label: TEST_POPULATION_LABEL,
  geography: null,
  household: getMockHousehold(),
  isCreated: false,
});

export const mockHouseholdPopulationState = getMockHouseholdPopulationState();

export const mockMetadataState = {
  currentCountry: TEST_COUNTRIES.US,
  entities: {
    person: { plural: 'people', label: 'Person' },
    tax_unit: { plural: 'tax_units', label: 'Tax unit' },
    household: { plural: 'households', label: 'Household' },
  },
  variables: {
    age: { defaultValue: 30 },
    employment_income: { defaultValue: 0 },
  },
  basic_inputs: {
    person: ['age', 'employment_income'],
    household: ['state_code'],
  },
  variable_metadata: {
    state_code: {
      possibleValues: [
        { value: 'CA', label: 'California' },
        { value: 'NY', label: 'New York' },
      ],
    },
  },
  loading: false,
  error: null,
};

export const mockRootState: Partial<RootState> = {
  population: mockPopulationState,
  metadata: mockMetadataState as any,
};

// Mock geographic association
export const mockGeographicAssociation: UserGeographicAssociation = {
  id: `${TEST_USER_ID}-${Date.now()}`,
  userId: TEST_USER_ID,
  countryCode: TEST_COUNTRIES.US,
  geographyType: 'national',
  geographyIdentifier: TEST_COUNTRIES.US,
  label: 'United States',
  createdAt: new Date().toISOString(),
};

// Mock region data
export const mockUSRegions = {
  result: {
    economy_options: {
      region: [
        { name: 'us', label: 'United States' },
        { name: 'state/ca', label: 'California' },
        { name: 'state/ny', label: 'New York' },
        { name: 'state/tx', label: 'Texas' },
      ],
    },
  },
};

export const mockUKRegions = {
  result: {
    economy_options: {
      region: [
        { name: 'uk', label: 'United Kingdom' },
        { name: 'country/england', label: 'England' },
        { name: 'country/scotland', label: 'Scotland' },
        { name: 'constituency/london', label: 'London' },
        { name: 'constituency/manchester', label: 'Manchester' },
      ],
    },
  },
};

// Mock flow props
export const mockFlowProps: FlowComponentProps = {
  onNavigate: vi.fn(),
  onReturn: vi.fn(),
  isInSubflow: false,
  flowConfig: {} as any,
  flowDepth: 0,
};

// ============= MOCKS FOR MODULES =============

// Mock regions data
export const mockRegions = {
  us_regions: mockUSRegions,
  uk_regions: mockUKRegions,
};

// Mock constants module
export const mockConstants = {
  MOCK_USER_ID: TEST_USER_ID,
};

// Mock hooks
export const mockCreateGeographicAssociation = vi.fn();
export const mockResetIngredient = vi.fn();
export const mockCreateHousehold = vi.fn();

export const mockUseCreateGeographicAssociation = () => ({
  mutateAsync: mockCreateGeographicAssociation,
  isPending: false,
});

export const mockUseIngredientReset = () => ({
  resetIngredient: mockResetIngredient,
});

export const mockUseCreateHousehold = () => ({
  createHousehold: mockCreateHousehold,
  isPending: false,
});

// Mock household utilities
export const mockHouseholdBuilder = vi.fn().mockImplementation((_countryId, _taxYear) => ({
  build: vi.fn(() => getMockHousehold()),
  loadHousehold: vi.fn(),
  addAdult: vi.fn(),
  addChild: vi.fn(),
  removePerson: vi.fn(),
  setMaritalStatus: vi.fn(),
  assignToGroupEntity: vi.fn(),
}));

export const mockHouseholdQueries = {
  getChildCount: vi.fn(() => 0),
  getChildren: vi.fn(() => []),
  getPersonVariable: vi.fn((_household, _person, variable, _year) => {
    if (variable === 'age') {
      return TEST_VALUES.DEFAULT_AGE;
    }
    if (variable === 'employment_income') {
      return TEST_VALUES.DEFAULT_INCOME;
    }
    return 0;
  }),
};

export const mockHouseholdValidation = {
  isReadyForSimulation: vi.fn(() => ({ isValid: true, errors: [] })),
};

export const mockHouseholdAdapter = {
  toCreationPayload: vi.fn(() => ({
    country_id: TEST_COUNTRIES.US,
    data: getMockHousehold().householdData,
  })),
};

// Mock metadata utilities
export const mockGetTaxYears = () => mockTaxYears;
export const mockGetBasicInputFields = () => ({
  person: ['age', 'employment_income'],
  household: ['state_code'],
});
export const mockGetFieldLabel = (field: string) => {
  const labels: Record<string, string> = {
    state_code: PLACEHOLDERS.STATE_CODE,
    age: PLACEHOLDERS.AGE,
    employment_income: PLACEHOLDERS.EMPLOYMENT_INCOME,
  };
  return labels[field] || field;
};
export const mockIsDropdownField = (field: string) => field === 'state_code';
export const mockGetFieldOptions = () => [
  { value: 'CA', label: UI_TEXT.STATE_CALIFORNIA },
  { value: 'NY', label: UI_TEXT.STATE_NEW_YORK },
];

// Mock household creation response
export const mockCreateHouseholdResponse = {
  result: {
    household_id: TEST_HOUSEHOLD_ID,
  },
};

// Helper functions for tests
export const createMockStore = (overrides?: Partial<RootState>) => ({
  getState: vi.fn(() => ({
    ...mockRootState,
    ...overrides,
  })),
  dispatch: vi.fn(),
  subscribe: vi.fn(),
  replaceReducer: vi.fn(),
});

export const mockTaxYears = [
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
];
