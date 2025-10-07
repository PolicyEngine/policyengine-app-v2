import { CURRENT_YEAR } from '@/constants';
import { RootState } from '@/store';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';
import {
  ValidationError,
  ValidationResult,
  ValidationWarning,
  VariableMetadata,
} from '@/utils/HouseholdValidation';

// ============= TEST CONSTANTS =============

// Validation codes
export const VALIDATION_ERROR_CODES = {
  COUNTRY_MISMATCH: 'COUNTRY_MISMATCH',
  INVALID_GROUP_STRUCTURE: 'INVALID_GROUP_STRUCTURE',
  INVALID_MARITAL_UNIT: 'INVALID_MARITAL_UNIT',
  EMPTY_BENUNIT: 'EMPTY_BENUNIT',
  INVALID_TYPE: 'INVALID_TYPE',
  NOT_INTEGER: 'NOT_INTEGER',
  NO_PEOPLE: 'NO_PEOPLE',
} as const;

export const VALIDATION_WARNING_CODES = {
  MISSING_AGE: 'MISSING_AGE',
  NO_TAX_UNITS: 'NO_TAX_UNITS',
  PERSON_NOT_IN_TAX_UNIT: 'PERSON_NOT_IN_TAX_UNIT',
} as const;

// Person names
export const VALIDATION_PERSON_NAMES = {
  ADULT_1: 'adult1',
  ADULT_2: 'adult2',
  CHILD_1: 'child1',
  PERSON_NO_AGE: 'personNoAge',
  PERSON_ORPHAN: 'orphanPerson',
} as const;

// Countries
export const VALIDATION_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  WRONG: 'wrong',
} as const;

// Years
export const VALIDATION_YEARS = {
  DEFAULT: CURRENT_YEAR,
  PAST: '2023',
  FUTURE: '2026',
  MISSING: '2027',
} as const;

// Entity names
export const VALIDATION_ENTITY_NAMES = {
  PEOPLE: 'people',
  HOUSEHOLDS: 'households',
  TAX_UNITS: 'taxUnits',
  MARITAL_UNITS: 'maritalUnits',
  BEN_UNITS: 'benunits',
  FAMILIES: 'families',
  SPM_UNITS: 'spmUnits',
} as const;

// Group keys
export const VALIDATION_GROUP_KEYS = {
  DEFAULT_HOUSEHOLD: 'household1',
  DEFAULT_TAX_UNIT: 'taxUnit1',
  DEFAULT_MARITAL_UNIT: 'maritalUnit1',
  INVALID_MARITAL_UNIT: 'invalidMaritalUnit',
  DEFAULT_BEN_UNIT: 'benUnit1',
  EMPTY_BEN_UNIT: 'emptyBenUnit',
} as const;

// Variable names
export const VALIDATION_VARIABLE_NAMES = {
  EMPLOYMENT_INCOME: 'employment_income',
  AGE: 'age',
  IS_MARRIED: 'is_married',
  STATE_CODE: 'state_code',
  HOUSEHOLD_SIZE: 'household_size',
} as const;

// Variable metadata
export const VALIDATION_VALUE_TYPES = {
  FLOAT: 'float',
  INT: 'int',
  BOOL: 'bool',
  STRING: 'string',
} as const;

export const VALIDATION_DEFINITION_PERIODS = {
  YEAR: 'year',
  MONTH: 'month',
  DAY: 'day',
  ETERNITY: 'eternity',
} as const;

// Test values
export const VALIDATION_TEST_VALUES = {
  VALID_AGE: 30,
  VALID_INCOME: 50000,
  INVALID_STRING_FOR_NUMBER: 'not a number',
  INVALID_NUMBER_FOR_BOOL: 123,
  INVALID_BOOL_FOR_STRING: true,
  VALID_FLOAT: 123.45,
  INVALID_FLOAT_FOR_INT: 123.45,
  VALID_INT: 123,
  VALID_BOOL: true,
  VALID_STRING: 'CA',
} as const;

// ============= MOCK DATA OBJECTS =============

// Mock persons
export const mockPersonWithAge: HouseholdPerson = {
  age: { [VALIDATION_YEARS.DEFAULT]: VALIDATION_TEST_VALUES.VALID_AGE },
};

export const mockPersonNoAge: HouseholdPerson = {
  employment_income: { [VALIDATION_YEARS.DEFAULT]: VALIDATION_TEST_VALUES.VALID_INCOME },
};

export const mockPersonMissingYear: HouseholdPerson = {
  age: { [VALIDATION_YEARS.PAST]: VALIDATION_TEST_VALUES.VALID_AGE },
};

// Valid US household
export const mockValidUSHousehold: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
      [VALIDATION_PERSON_NAMES.ADULT_2]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1, VALIDATION_PERSON_NAMES.ADULT_2],
      },
    },
    taxUnits: {
      [VALIDATION_GROUP_KEYS.DEFAULT_TAX_UNIT]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1, VALIDATION_PERSON_NAMES.ADULT_2],
      },
    },
  },
};

// US household with orphan person (not in tax unit)
export const mockUSHouseholdOrphanPerson: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
      [VALIDATION_PERSON_NAMES.ADULT_2]: mockPersonWithAge,
      [VALIDATION_PERSON_NAMES.PERSON_ORPHAN]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [
          VALIDATION_PERSON_NAMES.ADULT_1,
          VALIDATION_PERSON_NAMES.ADULT_2,
          VALIDATION_PERSON_NAMES.PERSON_ORPHAN,
        ],
      },
    },
    taxUnits: {
      [VALIDATION_GROUP_KEYS.DEFAULT_TAX_UNIT]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1, VALIDATION_PERSON_NAMES.ADULT_2],
      },
    },
  },
};

// US household with no tax units
export const mockUSHouseholdNoTaxUnits: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1],
      },
    },
    taxUnits: {},
  },
};

// US household with invalid marital unit (1 person)
export const mockUSHouseholdInvalidMaritalUnit: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1],
      },
    },
    maritalUnits: {
      [VALIDATION_GROUP_KEYS.INVALID_MARITAL_UNIT]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1],
      },
    },
  },
};

// Valid UK household
export const mockValidUKHousehold: Household = {
  countryId: VALIDATION_COUNTRIES.UK,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
      [VALIDATION_PERSON_NAMES.CHILD_1]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1, VALIDATION_PERSON_NAMES.CHILD_1],
      },
    },
    benunits: {
      [VALIDATION_GROUP_KEYS.DEFAULT_BEN_UNIT]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1, VALIDATION_PERSON_NAMES.CHILD_1],
      },
    },
  },
};

// UK household with empty benefit unit
export const mockUKHouseholdEmptyBenUnit: Household = {
  countryId: VALIDATION_COUNTRIES.UK,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1],
      },
    },
    benunits: {
      [VALIDATION_GROUP_KEYS.DEFAULT_BEN_UNIT]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1],
      },
      [VALIDATION_GROUP_KEYS.EMPTY_BEN_UNIT]: {
        members: [],
      },
    },
  },
};

// Household with country mismatch
export const mockHouseholdCountryMismatch: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1],
      },
    },
  },
};

// Household with missing age
export const mockHouseholdMissingAge: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
      [VALIDATION_PERSON_NAMES.PERSON_NO_AGE]: mockPersonNoAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        members: [VALIDATION_PERSON_NAMES.ADULT_1, VALIDATION_PERSON_NAMES.PERSON_NO_AGE],
      },
    },
  },
};

// Household with invalid group structure (missing members array)
export const mockHouseholdInvalidGroupStructure: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {
      [VALIDATION_PERSON_NAMES.ADULT_1]: mockPersonWithAge,
    },
    households: {
      [VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD]: {
        // Missing members array
      } as any,
    },
  },
};

// Empty household
export const mockEmptyHousehold: Household = {
  countryId: VALIDATION_COUNTRIES.US,
  householdData: {
    people: {},
    households: {},
  },
};

// ============= MOCK VARIABLE METADATA =============

export const mockFloatMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.PEOPLE,
  valueType: VALIDATION_VALUE_TYPES.FLOAT as any,
  definitionPeriod: VALIDATION_DEFINITION_PERIODS.YEAR as any,
  name: VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME,
  label: 'Employment Income',
  unit: 'USD',
  isInputVariable: true,
  defaultValue: 0,
};

export const mockIntMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.HOUSEHOLDS,
  valueType: VALIDATION_VALUE_TYPES.INT as any,
  definitionPeriod: VALIDATION_DEFINITION_PERIODS.YEAR as any,
  name: VALIDATION_VARIABLE_NAMES.HOUSEHOLD_SIZE,
  label: 'Household Size',
  isInputVariable: false,
  defaultValue: 1,
};

export const mockBoolMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.PEOPLE,
  valueType: VALIDATION_VALUE_TYPES.BOOL as any,
  definitionPeriod: VALIDATION_DEFINITION_PERIODS.ETERNITY as any,
  name: VALIDATION_VARIABLE_NAMES.IS_MARRIED,
  label: 'Is Married',
  isInputVariable: true,
  defaultValue: false,
};

export const mockStringMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.HOUSEHOLDS,
  valueType: VALIDATION_VALUE_TYPES.STRING as any,
  definitionPeriod: VALIDATION_DEFINITION_PERIODS.YEAR as any,
  name: VALIDATION_VARIABLE_NAMES.STATE_CODE,
  label: 'State Code',
  isInputVariable: true,
  defaultValue: '',
};

// ============= MOCK REDUX STATE =============

export const mockReduxStateWithMetadata: Partial<RootState> = {
  metadata: {
    variables: {
      [VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME]: {
        entity: VALIDATION_ENTITY_NAMES.PEOPLE,
        valueType: VALIDATION_VALUE_TYPES.FLOAT,
        definitionPeriod: VALIDATION_DEFINITION_PERIODS.YEAR,
        name: VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME,
        label: 'Employment Income',
        unit: 'USD',
        isInputVariable: true,
        defaultValue: 0,
      },
      [VALIDATION_VARIABLE_NAMES.STATE_CODE]: {
        entity: VALIDATION_ENTITY_NAMES.HOUSEHOLDS,
        valueType: VALIDATION_VALUE_TYPES.STRING,
        definitionPeriod: VALIDATION_DEFINITION_PERIODS.YEAR,
        name: VALIDATION_VARIABLE_NAMES.STATE_CODE,
        label: 'State Code',
        isInputVariable: true,
        defaultValue: '',
      },
    },
  },
} as any;

export const mockReduxStateNoMetadata: Partial<RootState> = {} as any;

// ============= EXPECTED RESULTS =============

export const expectedValidResult: ValidationResult = {
  isValid: true,
  errors: [],
  warnings: [],
};

export const expectedCountryMismatchError: ValidationError = {
  code: VALIDATION_ERROR_CODES.COUNTRY_MISMATCH,
  message: `Household country ${VALIDATION_COUNTRIES.US} does not match expected ${VALIDATION_COUNTRIES.UK}`,
  field: 'countryId',
};

export const expectedMissingAgeWarning: ValidationWarning = {
  code: VALIDATION_WARNING_CODES.MISSING_AGE,
  message: `Person ${VALIDATION_PERSON_NAMES.PERSON_NO_AGE} is missing age for year ${VALIDATION_YEARS.DEFAULT}`,
  field: `people.${VALIDATION_PERSON_NAMES.PERSON_NO_AGE}.age`,
};

export const expectedNoTaxUnitsWarning: ValidationWarning = {
  code: VALIDATION_WARNING_CODES.NO_TAX_UNITS,
  message: 'US households with people typically have at least one tax unit',
  field: 'taxUnits',
};

export const expectedOrphanPersonWarning: ValidationWarning = {
  code: VALIDATION_WARNING_CODES.PERSON_NOT_IN_TAX_UNIT,
  message: `Person ${VALIDATION_PERSON_NAMES.PERSON_ORPHAN} is not assigned to any tax unit`,
  field: `people.${VALIDATION_PERSON_NAMES.PERSON_ORPHAN}`,
};

export const expectedInvalidMaritalUnitError: ValidationError = {
  code: VALIDATION_ERROR_CODES.INVALID_MARITAL_UNIT,
  message: `Marital unit ${VALIDATION_GROUP_KEYS.INVALID_MARITAL_UNIT} must have exactly 2 members`,
  field: `maritalUnits.${VALIDATION_GROUP_KEYS.INVALID_MARITAL_UNIT}`,
};

export const expectedEmptyBenUnitError: ValidationError = {
  code: VALIDATION_ERROR_CODES.EMPTY_BENUNIT,
  message: `Benefit unit ${VALIDATION_GROUP_KEYS.EMPTY_BEN_UNIT} has no members`,
  field: `benunits.${VALIDATION_GROUP_KEYS.EMPTY_BEN_UNIT}`,
};

export const expectedInvalidGroupStructureError: ValidationError = {
  code: VALIDATION_ERROR_CODES.INVALID_GROUP_STRUCTURE,
  message: `Group ${VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD} in households must have a members array`,
  field: `households.${VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD}.members`,
};

export const expectedNoPeopleError: ValidationError = {
  code: VALIDATION_ERROR_CODES.NO_PEOPLE,
  message: 'Household must have at least one person for simulation',
  field: 'people',
};

// ============= TEST HELPERS =============

export const verifyValidationError = (
  errors: ValidationError[],
  expectedCode: string,
  expectedField?: string
): void => {
  const error = errors.find((e) => e.code === expectedCode);
  expect(error).toBeDefined();
  if (expectedField) {
    expect(error?.field).toBe(expectedField);
  }
};

export const verifyValidationWarning = (
  warnings: ValidationWarning[],
  expectedCode: string,
  expectedField?: string
): void => {
  const warning = warnings.find((w) => w.code === expectedCode);
  expect(warning).toBeDefined();
  if (expectedField) {
    expect(warning?.field).toBe(expectedField);
  }
};

export const verifyNoErrors = (result: ValidationResult): void => {
  expect(result.errors).toHaveLength(0);
  expect(result.isValid).toBe(true);
};

export const verifyHasErrors = (result: ValidationResult, errorCount: number): void => {
  expect(result.errors).toHaveLength(errorCount);
  expect(result.isValid).toBe(false);
};

export const verifyWarningCount = (result: ValidationResult, warningCount: number): void => {
  expect(result.warnings).toHaveLength(warningCount);
};
