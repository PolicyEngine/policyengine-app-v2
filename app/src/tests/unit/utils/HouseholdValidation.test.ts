import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  mockBoolMetadata,
  mockEmptyHousehold,
  mockFloatMetadata,
  mockHouseholdCountryMismatch,
  mockHouseholdInvalidGroupStructure,
  mockHouseholdMissingAge,
  mockIntMetadata,
  mockReduxStateNoMetadata,
  mockReduxStateWithMetadata,
  mockStringMetadata,
  mockUKHouseholdEmptyBenUnit,
  mockUSHouseholdInvalidMaritalUnit,
  mockUSHouseholdNoTaxUnits,
  mockUSHouseholdOrphanPerson,
  mockValidUKHousehold,
  mockValidUSHousehold,
  VALIDATION_COUNTRIES,
  VALIDATION_ENTITY_NAMES,
  VALIDATION_ERROR_CODES,
  VALIDATION_GROUP_KEYS,
  VALIDATION_PERSON_NAMES,
  VALIDATION_TEST_VALUES,
  VALIDATION_VARIABLE_NAMES,
  VALIDATION_WARNING_CODES,
  VALIDATION_YEARS,
  verifyHasErrors,
  verifyNoErrors,
  verifyValidationError,
  verifyValidationWarning,
  verifyWarningCount,
} from '@/tests/fixtures/utils/householdValidationMocks';
import * as HouseholdQueries from '@/utils/HouseholdQueries';
import { HouseholdValidation } from '@/utils/HouseholdValidation';

// Mock HouseholdQueries
vi.mock('@/utils/HouseholdQueries', () => ({
  getPersonCount: vi.fn(),
}));

describe('HouseholdValidation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateForCountry', () => {
    test('given valid US household when validating then returns valid result', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      const result = HouseholdValidation.validateForCountry(
        mockValidUSHousehold,
        VALIDATION_COUNTRIES.US
      );

      // Then
      verifyNoErrors(result);
      expect(result.warnings).toHaveLength(0);
    });

    test('given valid UK household when validating then returns valid result', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      const result = HouseholdValidation.validateForCountry(
        mockValidUKHousehold,
        VALIDATION_COUNTRIES.UK
      );

      // Then
      verifyNoErrors(result);
    });

    test('given country mismatch when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateForCountry(
        mockHouseholdCountryMismatch,
        VALIDATION_COUNTRIES.UK
      );

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.COUNTRY_MISMATCH, 'countryId');
      expect(result.errors[0].message).toContain(VALIDATION_COUNTRIES.US);
      expect(result.errors[0].message).toContain(VALIDATION_COUNTRIES.UK);
    });

    test('given household with missing age when validating then returns warning', () => {
      // When
      const result = HouseholdValidation.validateForCountry(
        mockHouseholdMissingAge,
        VALIDATION_COUNTRIES.US
      );

      // Then
      verifyNoErrors(result);
      verifyWarningCount(result, 1);
      verifyValidationWarning(
        result.warnings,
        VALIDATION_WARNING_CODES.MISSING_AGE,
        `people.${VALIDATION_PERSON_NAMES.PERSON_NO_AGE}.age`
      );
    });

    test('given household with invalid group structure when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateForCountry(
        mockHouseholdInvalidGroupStructure,
        VALIDATION_COUNTRIES.US
      );

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(
        result.errors,
        VALIDATION_ERROR_CODES.INVALID_GROUP_STRUCTURE,
        `households.${VALIDATION_GROUP_KEYS.DEFAULT_HOUSEHOLD}.members`
      );
    });

    test('given Canada household when validating then performs generic validation only', () => {
      // When
      const result = HouseholdValidation.validateForCountry(
        mockValidUSHousehold,
        VALIDATION_COUNTRIES.CA
      );

      // Then
      // Should have country mismatch error but no US-specific warnings
      verifyHasErrors(result, 1);
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.COUNTRY_MISMATCH);
      expect(result.warnings).toHaveLength(0);
    });
  });

  describe('validateGenericHousehold', () => {
    test('given household with all required fields when validating then no errors or warnings', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(
        mockValidUSHousehold,
        errors,
        warnings,
        VALIDATION_YEARS.DEFAULT
      );

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });

    test('given person without age for current year when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(
        mockHouseholdMissingAge,
        errors,
        warnings,
        VALIDATION_YEARS.DEFAULT
      );

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(1);
      verifyValidationWarning(warnings, VALIDATION_WARNING_CODES.MISSING_AGE);
    });

    test('given group without members array when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(
        mockHouseholdInvalidGroupStructure,
        errors,
        warnings,
        VALIDATION_YEARS.DEFAULT
      );

      // Then
      expect(errors).toHaveLength(1);
      verifyValidationError(errors, VALIDATION_ERROR_CODES.INVALID_GROUP_STRUCTURE);
    });

    test('given different year when validating then uses that year for age check', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(
        mockValidUSHousehold,
        errors,
        warnings,
        VALIDATION_YEARS.FUTURE
      );

      // Then
      // Should have warnings for missing age in future year
      expect(warnings.length).toBeGreaterThan(0);
      const ageWarning = warnings.find((w) => w.code === VALIDATION_WARNING_CODES.MISSING_AGE);
      expect(ageWarning?.message).toContain(VALIDATION_YEARS.FUTURE);
    });

    test('given no year parameter when validating then uses default year', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];

      // When
      HouseholdValidation.validateGenericHousehold(mockValidUSHousehold, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      // No warnings since the mock has age for default year
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

    test('given US household with orphan person when validating then adds warning', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(3);

      // When
      HouseholdValidation.validateUSHousehold(mockUSHouseholdOrphanPerson, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      verifyWarningCount({ warnings, errors, isValid: true }, 1);
      verifyValidationWarning(
        warnings,
        VALIDATION_WARNING_CODES.PERSON_NOT_IN_TAX_UNIT,
        `people.${VALIDATION_PERSON_NAMES.PERSON_ORPHAN}`
      );
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
      verifyWarningCount({ warnings, errors, isValid: true }, 2); // No tax units + person not in tax unit
      verifyValidationWarning(warnings, VALIDATION_WARNING_CODES.NO_TAX_UNITS, 'taxUnits');
    });

    test('given US household with invalid marital unit when validating then adds error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      HouseholdValidation.validateUSHousehold(mockUSHouseholdInvalidMaritalUnit, errors, warnings);

      // Then
      verifyValidationError(
        errors,
        VALIDATION_ERROR_CODES.INVALID_MARITAL_UNIT,
        `maritalUnits.${VALIDATION_GROUP_KEYS.INVALID_MARITAL_UNIT}`
      );
    });

    test('given marital unit with exactly 2 members when validating then no error', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household = {
        ...mockValidUSHousehold,
        householdData: {
          ...mockValidUSHousehold.householdData,
          maritalUnits: {
            [VALIDATION_GROUP_KEYS.DEFAULT_MARITAL_UNIT]: {
              members: [VALIDATION_PERSON_NAMES.ADULT_1, VALIDATION_PERSON_NAMES.ADULT_2],
            },
          },
        },
      };
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      HouseholdValidation.validateUSHousehold(household, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
    });

    test('given household without tax units entity when validating then no warnings', () => {
      // Given
      const errors: any[] = [];
      const warnings: any[] = [];
      const household = {
        ...mockValidUSHousehold,
        householdData: {
          people: mockValidUSHousehold.householdData.people,
          households: mockValidUSHousehold.householdData.households,
          // No taxUnits property
        },
      };

      // When
      HouseholdValidation.validateUSHousehold(household, errors, warnings);

      // Then
      expect(errors).toHaveLength(0);
      expect(warnings).toHaveLength(0);
    });
  });

  describe('validateUKHousehold', () => {
    test('given UK household with valid benefit units when validating then no errors', () => {
      // Given
      const errors: any[] = [];

      // When
      HouseholdValidation.validateUKHousehold(mockValidUKHousehold, errors);

      // Then
      expect(errors).toHaveLength(0);
    });

    test('given UK household with empty benefit unit when validating then adds error', () => {
      // Given
      const errors: any[] = [];

      // When
      HouseholdValidation.validateUKHousehold(mockUKHouseholdEmptyBenUnit, errors);

      // Then
      verifyValidationError(
        errors,
        VALIDATION_ERROR_CODES.EMPTY_BENUNIT,
        `benunits.${VALIDATION_GROUP_KEYS.EMPTY_BEN_UNIT}`
      );
    });

    test('given UK household without benefit units entity when validating then no errors', () => {
      // Given
      const errors: any[] = [];
      const household = {
        ...mockValidUKHousehold,
        householdData: {
          people: mockValidUKHousehold.householdData.people,
          households: mockValidUKHousehold.householdData.households,
          // No benunits property
        },
      };

      // When
      HouseholdValidation.validateUKHousehold(household, errors);

      // Then
      expect(errors).toHaveLength(0);
    });
  });

  describe('canAddVariable', () => {
    test('given matching entity type when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable(
        VALIDATION_ENTITY_NAMES.PEOPLE,
        mockFloatMetadata
      );

      // Then
      expect(result).toBe(true);
    });

    test('given mismatched entity type when checking can add variable then returns false', () => {
      // When
      const result = HouseholdValidation.canAddVariable(
        VALIDATION_ENTITY_NAMES.HOUSEHOLDS,
        mockFloatMetadata // This is for 'people' entity
      );

      // Then
      expect(result).toBe(false);
    });

    test('given no metadata when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable(VALIDATION_ENTITY_NAMES.FAMILIES);

      // Then
      expect(result).toBe(true);
    });

    test('given custom entity type when checking can add variable then returns true', () => {
      // When
      const result = HouseholdValidation.canAddVariable('customEntity');

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
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.NOT_INTEGER);
    });

    test('given string for number type when validating then returns error', () => {
      // When
      const result = HouseholdValidation.validateVariableValue(
        VALIDATION_TEST_VALUES.INVALID_STRING_FOR_NUMBER,
        mockFloatMetadata
      );

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.INVALID_TYPE);
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
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.INVALID_TYPE);
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
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.INVALID_TYPE);
    });
  });

  describe('isReadyForSimulation', () => {
    test('given valid household when checking ready for simulation then returns valid', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

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
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.NO_PEOPLE, 'people');
    });

    test('given household with structural errors when checking ready then includes those errors', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(1);

      // When
      const result = HouseholdValidation.isReadyForSimulation(mockHouseholdInvalidGroupStructure);

      // Then
      verifyHasErrors(result, 1);
      verifyValidationError(result.errors, VALIDATION_ERROR_CODES.INVALID_GROUP_STRUCTURE);
    });

    test('given household with warnings when checking ready then includes warnings', () => {
      // Given
      vi.mocked(HouseholdQueries.getPersonCount).mockReturnValue(2);

      // When
      const result = HouseholdValidation.isReadyForSimulation(mockHouseholdMissingAge);

      // Then
      verifyNoErrors(result);
      verifyWarningCount(result, 1);
      verifyValidationWarning(result.warnings, VALIDATION_WARNING_CODES.MISSING_AGE);
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
      expect(result?.entity).toBe(VALIDATION_ENTITY_NAMES.PEOPLE);
      expect(result?.valueType).toBe('float');
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
      expect(result?.entity).toBe(VALIDATION_ENTITY_NAMES.HOUSEHOLDS);
      expect(result?.valueType).toBe('string');
    });
  });
});
