import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import {
  mockBoolMetadata,
  mockEmptyHousehold,
  mockFloatMetadata,
  mockHouseholdMissingAge,
  mockIntMetadata,
  mockReduxStateNoMetadata,
  mockReduxStateWithMetadata,
  mockStringMetadata,
  mockValidUKHousehold,
  mockValidUSHousehold,
  VALIDATION_DATA_TYPES,
  VALIDATION_TEST_VALUES,
  VALIDATION_VARIABLE_NAMES,
  verifyHasErrors,
  verifyNoErrors,
} from '@/tests/fixtures/utils/householdValidationMocks';
import { Household } from '@/types/ingredients/Household';
import * as HouseholdQueries from '@/utils/HouseholdQueries';
import { HouseholdValidation, ValidationResult } from '@/utils/HouseholdValidation';

// Mock HouseholdQueries
vi.mock('@/utils/HouseholdQueries', () => ({
  getPersonCount: vi.fn(),
  isUSHousehold: vi.fn(),
  isUKHousehold: vi.fn(),
}));

// ============= ERROR AND WARNING CODES =============

const ERROR_CODES = {
  MODEL_MISMATCH: 'MODEL_MISMATCH',
  INVALID_TYPE: 'INVALID_TYPE',
  NOT_INTEGER: 'NOT_INTEGER',
  NO_PEOPLE: 'NO_PEOPLE',
  INVALID_PEOPLE: 'INVALID_PEOPLE',
  MISSING_YEAR: 'MISSING_YEAR',
  NO_YEAR: 'NO_YEAR',
  NO_MODEL: 'NO_MODEL',
} as const;

const WARNING_CODES = {
  MISSING_AGE: 'MISSING_AGE',
  NO_TAX_UNIT: 'NO_TAX_UNIT',
  NO_HOUSEHOLD_UNIT: 'NO_HOUSEHOLD_UNIT',
  UNUSUAL_AGE: 'UNUSUAL_AGE',
  UNUSUAL_YEAR: 'UNUSUAL_YEAR',
} as const;

// ============= TEST HELPERS =============

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
      expect(ageWarning?.field).toContain('people[1].age');
    });

    test('given household without people array when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: 'not an array',
      } as any;

      // When
      HouseholdValidation.validateGenericHousehold(household, errors, warnings);

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const error = errors.find((e) => e.code === ERROR_CODES.INVALID_PEOPLE);
      expect(error).toBeDefined();
    });

    test('given person with unusual age when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [
          {
            age: 150,
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

    test('given household without year when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household = {
        tax_benefit_model_name: 'policyengine_us',
        people: [{ age: 30 }],
      } as any;

      // When
      HouseholdValidation.validateGenericHousehold(household, errors, warnings);

      // Then
      expect(errors.length).toBeGreaterThan(0);
      const error = errors.find((e) => e.code === ERROR_CODES.MISSING_YEAR);
      expect(error).toBeDefined();
    });

    test('given household with unusual year when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: 1999,
        people: [{ age: 30 }],
      };

      // When
      HouseholdValidation.validateGenericHousehold(household, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings.length).toBeGreaterThan(0);
      const yearWarning = warnings.find((w) => w.code === WARNING_CODES.UNUSUAL_YEAR);
      expect(yearWarning).toBeDefined();
    });
  });

  describe('validateUSHousehold', () => {
    test('given US household with people when validating then no warnings', () => {
      // Given
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      HouseholdValidation.validateUSHousehold(mockValidUSHousehold, warnings);

      // Then
      expect(warnings).toHaveLength(0);
    });

    test('given US household with people but no tax unit when validating then adds warning', () => {
      // Given
      const warnings: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
        household: {},
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUSHousehold(household, warnings);

      // Then
      expect(warnings.length).toBeGreaterThan(0);
      const warning = warnings.find((w) => w.code === WARNING_CODES.NO_TAX_UNIT);
      expect(warning).toBeDefined();
    });

    test('given US household with people but no household entity when validating then adds warning', () => {
      // Given
      const warnings: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
        tax_unit: {},
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUSHousehold(household, warnings);

      // Then
      expect(warnings.length).toBeGreaterThan(0);
      const warning = warnings.find((w) => w.code === WARNING_CODES.NO_HOUSEHOLD_UNIT);
      expect(warning).toBeDefined();
    });

    test('given US household with no people when validating then no warnings', () => {
      // Given
      const warnings: any[] = [];
      const household: Household = {
        tax_benefit_model_name: 'policyengine_us',
        year: parseInt(CURRENT_YEAR, 10),
        people: [],
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(0);

      // When
      HouseholdValidation.validateUSHousehold(household, warnings);

      // Then
      expect(warnings).toHaveLength(0);
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

    test('given valid person entity when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable('person');

      // Then
      expect(result).toBe(true);
    });

    test('given valid tax unit entity when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable('tax_unit');

      // Then
      expect(result).toBe(true);
    });

    test('given valid benunit entity when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable('benunit');

      // Then
      expect(result).toBe(true);
    });
  });

  describe('validateVariableValue', () => {
    test('given valid float value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.VALID_FLOAT,
        mockFloatMetadata
      );

      // Then
      verifyNoErrors(result);
    });

    test('given valid integer value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.VALID_INT,
        mockIntMetadata
      );

      // Then
      verifyNoErrors(result);
    });

    test('given float for integer type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.INVALID_FLOAT_FOR_INT,
        mockIntMetadata
      );

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.NOT_INTEGER);
    });

    test('given string for number type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.INVALID_STRING_FOR_NUMBER,
        mockFloatMetadata
      );

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.INVALID_TYPE);
    });

    test('given valid boolean value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.VALID_BOOL,
        mockBoolMetadata
      );

      // Then
      verifyNoErrors(result);
    });

    test('given number for boolean type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.INVALID_NUMBER_FOR_BOOL,
        mockBoolMetadata
      );

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result, ERROR_CODES.INVALID_TYPE);
    });

    test('given valid string value when validating then returns valid', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.VALID_STRING,
        mockStringMetadata
      );

      // Then
      verifyNoErrors(result);
    });

    test('given boolean for string type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.INVALID_BOOL_FOR_STRING,
        mockStringMetadata
      );

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

    test('given household without year when checking ready then returns error', () => {
      // Given
      const household = {
        tax_benefit_model_name: 'policyengine_us',
        people: [{ age: 30 }],
      } as any;
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(true);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(false);

      // When
      const result = HouseholdValidation.isReadyForSimulation(household);

      // Then
      expect(result.isValid).toBe(false);
      verifyValidationError(result, ERROR_CODES.NO_YEAR, 'year');
    });

    test('given household without model when checking ready then returns error', () => {
      // Given
      const household = {
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
      } as any;
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      const result = HouseholdValidation.isReadyForSimulation(household);

      // Then
      expect(result.isValid).toBe(false);
      verifyValidationError(result, ERROR_CODES.NO_MODEL, 'tax_benefit_model_name');
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

    test('given household with model mismatch when checking ready then returns error', () => {
      // Given
      const household: Household = {
        tax_benefit_model_name: 'policyengine_uk',
        year: parseInt(CURRENT_YEAR, 10),
        people: [{ age: 30 }],
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);
      vi.mocked(HouseholdQueries.isUSHousehold).mockReturnValue(false);
      vi.mocked(HouseholdQueries.isUKHousehold).mockReturnValue(true);

      // When
      const result = HouseholdValidation.isReadyForSimulation(household);

      // Then
      verifyNoErrors(result);
    });
  });

  describe('getVariableMetadata', () => {
    test('given existing variable when getting metadata then returns metadata', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateWithMetadata as any,
        VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBeDefined();
      expect(result?.name).toBe(VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME);
      expect(result?.entity).toBe('person');
      expect(result?.data_type).toBe(VALIDATION_DATA_TYPES.FLOAT);
    });

    test('given non-existent variable when getting metadata then returns undefined', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateWithMetadata as any,
        'non_existent_variable'
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given state without metadata when getting metadata then returns undefined', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateNoMetadata as any,
        VALIDATION_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given state with metadata when getting different variable then returns correct metadata', () => {
      // When
      const result = HouseholdValidation.getVariableMetadata(
        mockReduxStateWithMetadata as any,
        VALIDATION_VARIABLE_NAMES.STATE_CODE
      );

      // Then
      expect(result).toBeDefined();
      expect(result?.name).toBe(VALIDATION_VARIABLE_NAMES.STATE_CODE);
      expect(result?.entity).toBe('household');
      expect(result?.data_type).toBe(VALIDATION_DATA_TYPES.STRING);
    });
  });
});
