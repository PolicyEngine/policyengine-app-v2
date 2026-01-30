import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';
import { VariableMetadata } from '@/types/metadata';
import * as HouseholdQueries from '@/utils/HouseholdQueries';
import { HouseholdValidation, ValidationResult } from '@/utils/HouseholdValidation';

// Mock HouseholdQueries
vi.mock('@/utils/HouseholdQueries', () => ({
  getPersonCount: vi.fn(),
  isUSHousehold: vi.fn(),
  isUKHousehold: vi.fn(),
}));

// ============= TEST CONSTANTS =============

const TEST_PERSON_IDS = {
  ADULT_1: 0,
  ADULT_2: 1,
  CHILD_1: 2,
  PERSON_NO_AGE: 3,
  ORPHAN_PERSON: 4,
} as const;

const TEST_UNIT_IDS = {
  TAX_UNIT: 0,
  FAMILY: 0,
  SPM_UNIT: 0,
  MARITAL_UNIT: 0,
  HOUSEHOLD: 0,
  BENUNIT: 0,
  INVALID_MARITAL_UNIT: 1,
  EMPTY_BENUNIT: 1,
} as const;

const ERROR_CODES = {
  MODEL_MISMATCH: 'MODEL_MISMATCH',
  INVALID_MARITAL_UNIT: 'INVALID_MARITAL_UNIT',
  EMPTY_BENUNIT: 'EMPTY_BENUNIT',
  INVALID_TYPE: 'INVALID_TYPE',
  NOT_INTEGER: 'NOT_INTEGER',
  NO_PEOPLE: 'NO_PEOPLE',
  MISSING_PERSON_ID: 'MISSING_PERSON_ID',
  DUPLICATE_PERSON_IDS: 'DUPLICATE_PERSON_IDS',
} as const;

const WARNING_CODES = {
  MISSING_AGE: 'MISSING_AGE',
  NO_TAX_UNITS: 'NO_TAX_UNITS',
  PEOPLE_WITHOUT_TAX_UNIT: 'PEOPLE_WITHOUT_TAX_UNIT',
  UNUSUAL_AGE: 'UNUSUAL_AGE',
} as const;

// ============= MOCK DATA =============

const mockValidUSHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
      person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
      person_family_id: TEST_UNIT_IDS.FAMILY,
      person_spm_unit_id: TEST_UNIT_IDS.SPM_UNIT,
      person_marital_unit_id: TEST_UNIT_IDS.MARITAL_UNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
    {
      person_id: TEST_PERSON_IDS.ADULT_2,
      name: 'Adult 2',
      age: 32,
      person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
      person_family_id: TEST_UNIT_IDS.FAMILY,
      person_spm_unit_id: TEST_UNIT_IDS.SPM_UNIT,
      person_marital_unit_id: TEST_UNIT_IDS.MARITAL_UNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
  ],
  tax_unit: [{ tax_unit_id: TEST_UNIT_IDS.TAX_UNIT }],
  family: [{ family_id: TEST_UNIT_IDS.FAMILY }],
  spm_unit: [{ spm_unit_id: TEST_UNIT_IDS.SPM_UNIT }],
  marital_unit: [{ marital_unit_id: TEST_UNIT_IDS.MARITAL_UNIT }],
  household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
};

const mockValidUKHousehold: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
      person_benunit_id: TEST_UNIT_IDS.BENUNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
    {
      person_id: TEST_PERSON_IDS.CHILD_1,
      name: 'Child 1',
      age: 10,
      person_benunit_id: TEST_UNIT_IDS.BENUNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
  ],
  benunit: [{ benunit_id: TEST_UNIT_IDS.BENUNIT }],
  household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
};

const mockHouseholdMissingAge: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
      person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
    {
      person_id: TEST_PERSON_IDS.PERSON_NO_AGE,
      name: 'Person No Age',
      // age is missing
      person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
  ],
  tax_unit: [{ tax_unit_id: TEST_UNIT_IDS.TAX_UNIT }],
  household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
};

const mockUSHouseholdOrphanPerson: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
      person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
    {
      person_id: TEST_PERSON_IDS.ADULT_2,
      name: 'Adult 2',
      age: 32,
      person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
    {
      person_id: TEST_PERSON_IDS.ORPHAN_PERSON,
      name: 'Orphan Person',
      age: 25,
      // Missing person_tax_unit_id
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
  ],
  tax_unit: [{ tax_unit_id: TEST_UNIT_IDS.TAX_UNIT }],
  household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
};

const mockUSHouseholdNoTaxUnits: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
  ],
  // No tax_unit array
  household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
};

const mockUSHouseholdInvalidMaritalUnit: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
      person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
  ],
  tax_unit: [{ tax_unit_id: TEST_UNIT_IDS.TAX_UNIT }],
  marital_unit: [
    { marital_unit_id: TEST_UNIT_IDS.INVALID_MARITAL_UNIT },
    // This marital unit has no members (person doesn't reference it)
  ],
  household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
};

const mockUKHouseholdEmptyBenunit: Household = {
  tax_benefit_model_name: 'policyengine_uk',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
      person_benunit_id: TEST_UNIT_IDS.BENUNIT,
      person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
    },
  ],
  benunit: [
    { benunit_id: TEST_UNIT_IDS.BENUNIT },
    { benunit_id: TEST_UNIT_IDS.EMPTY_BENUNIT }, // No person references this benunit
  ],
  household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
};

const mockEmptyHousehold: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [],
};

const mockHouseholdInvalidPeopleArray: Partial<Household> = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: 'not an array' as any,
};

const mockHouseholdMissingPersonId: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      name: 'Person without ID',
      age: 30,
      // Missing person_id
    },
  ],
};

const mockHouseholdDuplicatePersonIds: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: TEST_PERSON_IDS.ADULT_1,
      name: 'Adult 1',
      age: 30,
    },
    {
      person_id: TEST_PERSON_IDS.ADULT_1, // Duplicate ID
      name: 'Adult 2',
      age: 32,
    },
  ],
};

// Mock variable metadata
const mockFloatMetadata: VariableMetadata = {
  entity: 'person',
  data_type: 'float',
  name: 'employment_income',
  description: 'Employment income',
  label: 'Employment income',
};

const mockIntMetadata: VariableMetadata = {
  entity: 'household',
  data_type: 'int',
  name: 'household_size',
  description: 'Household size',
  label: 'Household size',
};

const mockBoolMetadata: VariableMetadata = {
  entity: 'person',
  data_type: 'bool',
  name: 'is_married',
  description: 'Is married',
  label: 'Is married',
};

const mockStringMetadata: VariableMetadata = {
  entity: 'household',
  data_type: 'string',
  name: 'state_code',
  description: 'State code',
  label: 'State code',
};

const mockReduxStateWithMetadata = {
  metadata: {
    variables: {
      employment_income: mockFloatMetadata,
      state_code: mockStringMetadata,
    },
  },
} as any;

const mockReduxStateNoMetadata = {} as any;

// ============= TEST HELPERS =============

function verifyNoErrors(result: ValidationResult): void {
  expect(result.errors).toHaveLength(0);
  expect(result.isValid).toBe(true);
}

function verifyHasErrors(result: ValidationResult, errorCount: number): void {
  expect(result.errors).toHaveLength(errorCount);
  expect(result.isValid).toBe(false);
}

function verifyValidationError(
  result: ValidationResult,
  expectedCode: string,
  expectedField?: string
): void {
  const error = result.errors.find((e) => e.code === expectedCode);
  expect(error).toBeDefined();
  if (expectedField !== undefined) {
    expect(error?.field).toBe(expectedField);
  }
}

function verifyValidationWarning(
  result: ValidationResult,
  expectedCode: string,
  expectedField?: string
): void {
  const warning = result.warnings.find((w) => w.code === expectedCode);
  expect(warning).toBeDefined();
  if (expectedField !== undefined) {
    expect(warning?.field).toBe(expectedField);
  }
}

function verifyWarningCount(result: ValidationResult, warningCount: number): void {
  expect(result.warnings).toHaveLength(warningCount);
}

// ============= TESTS =============

describe('HouseholdValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateForModel', () => {
    test('given valid US household when validating then returns valid result', () => {
      // Given
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(true);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(false);
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      const result = HouseholdValidation.validateForModel(mockValidUSHousehold, 'policyengine_us');

      // Then
      verifyNoErrors(result);
      expect(result.warnings).toHaveLength(0);
    });

    test('given valid UK household when validating then returns valid result', () => {
      // Given
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(false);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(true);
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      const result = HouseholdValidation.validateForModel(mockValidUKHousehold, 'policyengine_uk');

      // Then
      verifyNoErrors(result);
    });

    test('given model mismatch when validating then returns error', () => {
      // Given
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(false);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(true);

      // When
      const result = HouseholdValidation.validateForModel(mockValidUKHousehold, 'policyengine_us');

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.MODEL_MISMATCH, 'tax_benefit_model_name');
      expect(result.errors[0].message).toContain('policyengine_uk');
      expect(result.errors[0].message).toContain('policyengine_us');
    });

    test('given household with missing age when validating then returns warning', () => {
      // Given
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(true);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(false);
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      const result = HouseholdValidation.validateForModel(
        mockHouseholdMissingAge,
        'policyengine_us'
      );

      // Then
      verifyNoErrors(result);
      expect(result.warnings.length).toBeGreaterThan(0);
      verifyValidationWarning(result, WARNING_CODES.MISSING_AGE);
    });
  });

  describe('validateGenericHousehold', () => {
    test('given household with all required fields when validating then no errors or warnings', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(mockValidUSHousehold, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    test('given person without age when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(mockHouseholdMissingAge, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
      const ageWarning = warnings.find((w) => w.code === WARNING_CODES.MISSING_AGE);
      expect(ageWarning).toBeDefined();
    });

    test('given household without people array when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(
        mockHouseholdInvalidPeopleArray as Household,
        errors,
        warnings
      );

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const error = errors.find((e) => e.code === 'INVALID_PEOPLE');
      expect(error).toBeDefined();
    });

    test('given person without person_id when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(mockHouseholdMissingPersonId, errors, warnings);

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const error = errors.find((e) => e.code === ERROR_CODES.MISSING_PERSON_ID);
      expect(error).toBeDefined();
    });

    test('given duplicate person IDs when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(
        mockHouseholdDuplicatePersonIds,
        errors,
        warnings
      );

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const error = errors.find((e) => e.code === ERROR_CODES.DUPLICATE_PERSON_IDS);
      expect(error).toBeDefined();
    });

    test('given person with unusual age when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR),
        people: [
          {
            person_id: 0,
            name: 'Old person',
            age: 150, // Unusual age
          },
        ],
      };

      // When
      HouseholdValidation.validateGenericHousehold(household, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
      const ageWarning = warnings.find((w) => w.code === WARNING_CODES.UNUSUAL_AGE);
      expect(ageWarning).toBeDefined();
    });
  });

  describe('validateUSHousehold', () => {
    test('given US household with all people in tax units when validating then no warnings', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      HouseholdValidation.validateUSHousehold(mockValidUSHousehold, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    test('given US household with person not in tax unit when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(3);

      // When
      HouseholdValidation.validateUSHousehold(mockUSHouseholdOrphanPerson, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
      const warning = warnings.find((w) => w.code === WARNING_CODES.PEOPLE_WITHOUT_TAX_UNIT);
      expect(warning).toBeDefined();
    });

    test('given US household with no tax units when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUSHousehold(mockUSHouseholdNoTaxUnits, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
      const warning = warnings.find((w) => w.code === WARNING_CODES.NO_TAX_UNITS);
      expect(warning).toBeDefined();
    });

    test('given US household with empty marital unit when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUSHousehold(mockUSHouseholdInvalidMaritalUnit, errors, warnings);

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const error = errors.find((e) => e.code === ERROR_CODES.INVALID_MARITAL_UNIT);
      expect(error).toBeDefined();
    });

    test('given marital unit with exactly 2 members when validating then no error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR),
        people: [
          {
            person_id: TEST_PERSON_IDS.ADULT_1,
            name: 'Adult 1',
            age: 30,
            person_marital_unit_id: TEST_UNIT_IDS.MARITAL_UNIT,
            person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
            person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
          },
          {
            person_id: TEST_PERSON_IDS.ADULT_2,
            name: 'Adult 2',
            age: 32,
            person_marital_unit_id: TEST_UNIT_IDS.MARITAL_UNIT,
            person_tax_unit_id: TEST_UNIT_IDS.TAX_UNIT,
            person_household_id: TEST_UNIT_IDS.HOUSEHOLD,
          },
        ],
        marital_unit: [{ marital_unit_id: TEST_UNIT_IDS.MARITAL_UNIT }],
        tax_unit: [{ tax_unit_id: TEST_UNIT_IDS.TAX_UNIT }],
        household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      HouseholdValidation.validateUSHousehold(household, errors, warnings);

      // Then
      const maritalError = errors.find((e) => e.code === ERROR_CODES.INVALID_MARITAL_UNIT);
      expect(maritalError).toBeUndefined();
    });

    test('given household without tax units entity when validating then warns appropriately', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUSHousehold(mockUSHouseholdNoTaxUnits, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      const noTaxUnitsWarning = warnings.find((w) => w.code === WARNING_CODES.NO_TAX_UNITS);
      expect(noTaxUnitsWarning).toBeDefined();
    });
  });

  describe('validateUKHousehold', () => {
    test('given UK household with valid benefit units when validating then no errors', () => {
      // Given
      const errors: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      HouseholdValidation.validateUKHousehold(mockValidUKHousehold, errors);

      // Then
      expect(errors).toHaveLength(0);
    });

    test('given UK household with empty benefit unit when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUKHousehold(mockUKHouseholdEmptyBenunit, errors);

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const error = errors.find((e) => e.code === ERROR_CODES.EMPTY_BENUNIT);
      expect(error).toBeDefined();
    });

    test('given UK household without benefit units entity when validating then no errors', () => {
      // Given
      const errors: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_uk',
        year: parseInt(CURRENT_YEAR),
        people: [
          {
            person_id: TEST_PERSON_IDS.ADULT_1,
            name: 'Adult 1',
            age: 30,
          },
        ],
        household: [{ household_id: TEST_UNIT_IDS.HOUSEHOLD }],
        // No benunit property
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUKHousehold(household, errors);

      // Then
      expect(errors).toHaveLength(0);
    });
  });

  describe('canAddVariable', () => {
    test('given matching entity type when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable('person', mockFloatMetadata);

      // Then
      expect(result).toBe(true);
    });

    test('given mismatched entity type when checking can add variable then returns false', () => {
      // When
      const result = HouseholdValidation.canAddVariable('household', mockFloatMetadata);

      // Then
      expect(result).toBe(false);
    });

    test('given no metadata when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable('family');

      // Then
      expect(result).toBe(true);
    });

    test('given custom entity type when checking can add variable then returns false', () => {
      // When
      const result = HouseholdValidation.canAddVariable('customEntity');

      // Then
      expect(result).toBe(false);
    });
  });

  describe('validateVariableValue', () => {
    test('given valid float value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(123.45, mockFloatMetadata);

      // Then
      verifyNoErrors(result);
    });

    test('given valid integer value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(123, mockIntMetadata);

      // Then
      verifyNoErrors(result);
    });

    test('given float for integer type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(123.45, mockIntMetadata);

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.NOT_INTEGER);
    });

    test('given string for number type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue('not a number', mockFloatMetadata);

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.INVALID_TYPE);
    });

    test('given valid boolean value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(true, mockBoolMetadata);

      // Then
      verifyNoErrors(result);
    });

    test('given number for boolean type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(123, mockBoolMetadata);

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.INVALID_TYPE);
    });

    test('given valid string value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue('CA', mockStringMetadata);

      // Then
      verifyNoErrors(result);
    });

    test('given boolean for string type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(true, mockStringMetadata);

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.INVALID_TYPE);
    });
  });

  describe('isReadyForSimulation', () => {
    test('given valid household when checking ready for simulation then returns valid', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(true);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(false);

      // When
      const result = HouseholdValidation.isReadyForSimulation(mockValidUSHousehold);

      // Then
      verifyNoErrors(result);
    });

    test('given empty household when checking ready for simulation then returns error', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(0);

      // When
      const result = HouseholdValidation.isReadyForSimulation(mockEmptyHousehold);

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.NO_PEOPLE, 'people');
    });

    test('given household with structural errors when checking ready then includes those errors', () => {
      // Given
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR),
        people: [
          {
            person_id: TEST_PERSON_IDS.ADULT_1,
            name: 'Adult 1',
            age: 30,
          },
          {
            person_id: TEST_PERSON_IDS.ADULT_1, // Duplicate ID
            name: 'Adult 2',
            age: 32,
          },
        ],
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(true);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(false);

      // When
      const result = HouseholdValidation.isReadyForSimulation(household);

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.DUPLICATE_PERSON_IDS);
    });

    test('given household with warnings when checking ready then includes warnings', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(true);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(false);

      // When
      const result = HouseholdValidation.isReadyForSimulation(mockHouseholdMissingAge);

      // Then
      verifyNoErrors(result);
      expect(result.warnings.length).toBeGreaterThan(0);
      verifyValidationWarning(result, WARNING_CODES.MISSING_AGE);
    });
  });

  describe('getVariableMetadata', () => {
    test('given existing variable when getting metadata then returns metadata', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateWithMetadata,
        'employment_income'
      );

      // Then
      expect(result).toBeDefined();
      expect(result?.name).toBe('employment_income');
      expect(result?.entity).toBe('person');
      expect(result?.data_type).toBe('float');
    });

    test('given non-existent variable when getting metadata then returns undefined', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateWithMetadata,
        'non_existent_variable'
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given state without metadata when getting metadata then returns undefined', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateNoMetadata,
        'employment_income'
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given state with metadata when getting different variable then returns correct metadata', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateWithMetadata,
        'state_code'
      );

      // Then
      expect(result).toBeDefined();
      expect(result?.name).toBe('state_code');
      expect(result?.entity).toBe('household');
      expect(result?.data_type).toBe('string');
    });
  });
});
