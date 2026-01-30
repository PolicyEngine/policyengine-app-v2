import { CURRENT_YEAR } from '@/constants';
import { RootState } from '@/store';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';
import { VariableMetadata } from '@/types/metadata';
import { ValidationError, ValidationResult, ValidationWarning } from '@/utils/HouseholdValidation';

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

// Variable data types (V2 API format)
export const VALIDATION_DATA_TYPES = {
  FLOAT: 'float',
  INT: 'int',
  BOOL: 'bool',
  STRING: 'string',
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
  person_id: 0,
  age: VALIDATION_TEST_VALUES.VALID_AGE,
};

export const mockPersonNoAge: HouseholdPerson = {
  person_id: 0,
  employment_income: VALIDATION_TEST_VALUES.VALID_INCOME,
};

export const mockPersonMissingYear: HouseholdPerson = {
  person_id: 0,
  employment_income: VALIDATION_TEST_VALUES.VALID_INCOME,
};

// Valid US household
export const mockValidUSHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      person_tax_unit_id: 0,
    },
    {
      person_id: 1,
      name: VALIDATION_PERSON_NAMES.ADULT_2,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      person_tax_unit_id: 0,
    },
  ],
  household: [{ household_id: 0 }],
  tax_unit: [{ tax_unit_id: 0 }],
};

// US household with orphan person (not in tax unit)
export const mockUSHouseholdOrphanPerson: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      person_tax_unit_id: 0,
    },
    {
      person_id: 1,
      name: VALIDATION_PERSON_NAMES.ADULT_2,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      person_tax_unit_id: 0,
    },
    {
      person_id: 2,
      name: VALIDATION_PERSON_NAMES.PERSON_ORPHAN,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      // No person_tax_unit_id - orphan!
    },
  ],
  household: [{ household_id: 0 }],
  tax_unit: [{ tax_unit_id: 0 }],
};

// US household with no tax units
export const mockUSHouseholdNoTaxUnits: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      // No person_tax_unit_id
    },
  ],
  household: [{ household_id: 0 }],
  // No tax_unit array
};

// US household with invalid marital unit (0 members - empty is invalid)
export const mockUSHouseholdInvalidMaritalUnit: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
    },
  ],
  household: [{ household_id: 0 }],
  marital_unit: [{ marital_unit_id: 0 }], // Unit exists but no one assigned to it
};

// Valid UK household
export const mockValidUKHousehold: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      person_benunit_id: 0,
    },
    {
      person_id: 1,
      name: VALIDATION_PERSON_NAMES.CHILD_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      person_benunit_id: 0,
    },
  ],
  household: [{ household_id: 0 }],
  benunit: [{ benunit_id: 0 }],
};

// UK household with empty benefit unit
export const mockUKHouseholdEmptyBenUnit: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
      person_benunit_id: 0,
    },
  ],
  household: [{ household_id: 0 }],
  benunit: [
    { benunit_id: 0 },
    { benunit_id: 1 }, // Empty benunit - no one assigned to it
  ],
};

// Household with country mismatch
export const mockHouseholdCountryMismatch: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
    },
  ],
  household: [{ household_id: 0 }],
};

// Household with missing age
export const mockHouseholdMissingAge: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
    },
    {
      person_id: 1,
      name: VALIDATION_PERSON_NAMES.PERSON_NO_AGE,
      employment_income: VALIDATION_TEST_VALUES.VALID_INCOME,
      person_household_id: 0,
      // No age property
    },
  ],
  household: [{ household_id: 0 }],
};

// Household with invalid group structure (missing members array)
// In v2, this would be a household entity without proper structure
export const mockHouseholdInvalidGroupStructure: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [
    {
      person_id: 0,
      name: VALIDATION_PERSON_NAMES.ADULT_1,
      age: VALIDATION_TEST_VALUES.VALID_AGE,
      person_household_id: 0,
    },
  ],
  household: [
    {} as any, // Invalid - missing household_id
  ],
};

// Empty household
export const mockEmptyHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT),
  people: [],
};

// ============= MOCK VARIABLE METADATA =============

export const mockFloatMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.PEOPLE,
  data_type: VALIDATION_DATA_TYPES.FLOAT,
  name: VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME,
  description: 'Employment income',
  label: 'Employment Income',
};

export const mockIntMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.HOUSEHOLDS,
  data_type: VALIDATION_DATA_TYPES.INT,
  name: VALIDATION_VARIABLE_NAMES.HOUSEHOLD_SIZE,
  description: 'Household size',
  label: 'Household Size',
};

export const mockBoolMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.PEOPLE,
  data_type: VALIDATION_DATA_TYPES.BOOL,
  name: VALIDATION_VARIABLE_NAMES.IS_MARRIED,
  description: 'Is married',
  label: 'Is Married',
};

export const mockStringMetadata: VariableMetadata = {
  entity: VALIDATION_ENTITY_NAMES.HOUSEHOLDS,
  data_type: VALIDATION_DATA_TYPES.STRING,
  name: VALIDATION_VARIABLE_NAMES.STATE_CODE,
  description: 'State code',
  label: 'State Code',
};

// ============= MOCK REDUX STATE =============

export const mockReduxStateWithMetadata: Partial<RootState> = {
  metadata: {
    variables: {
      [VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME]: {
        entity: VALIDATION_ENTITY_NAMES.PEOPLE,
        data_type: VALIDATION_DATA_TYPES.FLOAT,
        name: VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME,
        description: 'Employment income',
        label: 'Employment Income',
      },
      [VALIDATION_VARIABLE_NAMES.STATE_CODE]: {
        entity: VALIDATION_ENTITY_NAMES.HOUSEHOLDS,
        data_type: VALIDATION_DATA_TYPES.STRING,
        name: VALIDATION_VARIABLE_NAMES.STATE_CODE,
        description: 'State code',
        label: 'State Code',
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
