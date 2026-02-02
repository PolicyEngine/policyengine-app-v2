import { CURRENT_YEAR } from '@/constants';
import { RootState } from '@/store';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';
import { VariableMetadata } from '@/types/metadata';
import { ValidationError, ValidationResult, ValidationWarning } from '@/utils/HouseholdValidation';

// ============= TEST CONSTANTS =============

// Validation codes
export const VALIDATION_ERROR_CODES = {
  COUNTRY_MISMATCH: 'COUNTRY_MISMATCH',
  NO_PEOPLE: 'NO_PEOPLE',
} as const;

export const VALIDATION_WARNING_CODES = {
  MISSING_AGE: 'MISSING_AGE',
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

// Mock persons (v2 Alpha: no person_id, name, or person_*_id)
export const mockPersonWithAge: HouseholdPerson = {
  age: VALIDATION_TEST_VALUES.VALID_AGE,
};

export const mockPersonNoAge: HouseholdPerson = {
  employment_income: VALIDATION_TEST_VALUES.VALID_INCOME,
};

// Valid US household (entity groups are single dicts)
export const mockValidUSHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT, 10),
  people: [
    {
      age: VALIDATION_TEST_VALUES.VALID_AGE,
    },
    {
      age: VALIDATION_TEST_VALUES.VALID_AGE,
    },
  ],
  household: {},
  tax_unit: {},
};

// Valid UK household
export const mockValidUKHousehold: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(VALIDATION_YEARS.DEFAULT, 10),
  people: [
    {
      age: VALIDATION_TEST_VALUES.VALID_AGE,
    },
    {
      age: VALIDATION_TEST_VALUES.VALID_AGE,
    },
  ],
  household: {},
  benunit: {},
};

// Household with country mismatch
export const mockHouseholdCountryMismatch: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT, 10),
  people: [
    {
      age: VALIDATION_TEST_VALUES.VALID_AGE,
    },
  ],
  household: {},
};

// Household with missing age
export const mockHouseholdMissingAge: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT, 10),
  people: [
    {
      age: VALIDATION_TEST_VALUES.VALID_AGE,
    },
    {
      employment_income: VALIDATION_TEST_VALUES.VALID_INCOME,
      // No age property
    },
  ],
  household: {},
};

// Empty household
export const mockEmptyHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(VALIDATION_YEARS.DEFAULT, 10),
  people: [],
};

// ============= MOCK VARIABLE METADATA =============

export const mockFloatMetadata: VariableMetadata = {
  entity: 'person',
  data_type: VALIDATION_DATA_TYPES.FLOAT,
  name: VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME,
  description: 'Employment income',
  label: 'Employment Income',
};

export const mockIntMetadata: VariableMetadata = {
  entity: 'household',
  data_type: VALIDATION_DATA_TYPES.INT,
  name: VALIDATION_VARIABLE_NAMES.HOUSEHOLD_SIZE,
  description: 'Household size',
  label: 'Household Size',
};

export const mockBoolMetadata: VariableMetadata = {
  entity: 'person',
  data_type: VALIDATION_DATA_TYPES.BOOL,
  name: VALIDATION_VARIABLE_NAMES.IS_MARRIED,
  description: 'Is married',
  label: 'Is Married',
};

export const mockStringMetadata: VariableMetadata = {
  entity: 'household',
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
        entity: 'person',
        data_type: VALIDATION_DATA_TYPES.FLOAT,
        name: VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME,
        description: 'Employment income',
        label: 'Employment Income',
      },
      [VALIDATION_VARIABLE_NAMES.STATE_CODE]: {
        entity: 'household',
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
