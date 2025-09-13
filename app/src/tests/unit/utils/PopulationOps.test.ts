import { beforeEach, describe, expect, test } from 'vitest';
import {
  API_PAYLOAD_KEYS,
  createGeographyPopRef,
  createHouseholdPopRef,
  createUserGeographyPop,
  EXPECTED_LABELS,
  expectedGeographyAPIPayload,
  expectedGeographyCacheKey,
  expectedGeographyLabel,
  expectedHouseholdAPIPayload,
  expectedHouseholdCacheKey,
  expectedHouseholdLabel,
  expectedUserGeographyLabel,
  expectedUserGeographyNationalLabel,
  expectedUserHouseholdDefaultLabel,
  expectedUserHouseholdLabel,
  mockGeographyPopRef1,
  mockGeographyPopRef2,
  mockGeographyPopRefEmpty,
  mockHandlers,
  mockHouseholdPopRef1,
  mockHouseholdPopRef2,
  mockHouseholdPopRefEmpty,
  mockUserGeographyPop,
  mockUserGeographyPopInvalid,
  mockUserGeographyPopNational,
  mockUserHouseholdPop,
  mockUserHouseholdPopInvalid,
  mockUserHouseholdPopNoLabel,
  mockUserHouseholdPopNoUser,
  POPULATION_COUNTRIES,
  POPULATION_IDS,
  POPULATION_SCOPES,
  resetMockHandlers,
  setupMockHandlerReturns,
  verifyAPIPayload,
} from '@/tests/fixtures/utils/populationOpsMocks';
import {
  matchPopulation,
  matchUserPopulation,
  PopulationOps,
  UserPopulationOps,
} from '@/utils/PopulationOps';

describe('PopulationOps', () => {
  describe('matchPopulation', () => {
    beforeEach(() => {
      resetMockHandlers();
    });

    test('given household population when matching then calls household handler', () => {
      // Given
      setupMockHandlerReturns('household result', 'geography result');

      // When
      const result = matchPopulation(mockHouseholdPopRef1, mockHandlers);

      // Then
      expect(mockHandlers.household).toHaveBeenCalledWith(mockHouseholdPopRef1);
      expect(mockHandlers.household).toHaveBeenCalledTimes(1);
      expect(mockHandlers.geography).not.toHaveBeenCalled();
      expect(result).toBe('household result');
    });

    test('given geography population when matching then calls geography handler', () => {
      // Given
      setupMockHandlerReturns('household result', 'geography result');

      // When
      const result = matchPopulation(mockGeographyPopRef1, mockHandlers);

      // Then
      expect(mockHandlers.geography).toHaveBeenCalledWith(mockGeographyPopRef1);
      expect(mockHandlers.geography).toHaveBeenCalledTimes(1);
      expect(mockHandlers.household).not.toHaveBeenCalled();
      expect(result).toBe('geography result');
    });
  });

  describe('matchUserPopulation', () => {
    beforeEach(() => {
      resetMockHandlers();
    });

    test('given household user population when matching then calls household handler', () => {
      // Given
      setupMockHandlerReturns('household user result', 'geography user result');

      // When
      const result = matchUserPopulation(mockUserHouseholdPop, mockHandlers);

      // Then
      expect(mockHandlers.household).toHaveBeenCalledWith(mockUserHouseholdPop);
      expect(mockHandlers.household).toHaveBeenCalledTimes(1);
      expect(mockHandlers.geography).not.toHaveBeenCalled();
      expect(result).toBe('household user result');
    });

    test('given geography user population when matching then calls geography handler', () => {
      // Given
      setupMockHandlerReturns('household user result', 'geography user result');

      // When
      const result = matchUserPopulation(mockUserGeographyPop, mockHandlers);

      // Then
      expect(mockHandlers.geography).toHaveBeenCalledWith(mockUserGeographyPop);
      expect(mockHandlers.geography).toHaveBeenCalledTimes(1);
      expect(mockHandlers.household).not.toHaveBeenCalled();
      expect(result).toBe('geography user result');
    });
  });

  describe('PopulationOps.getId', () => {
    test('given household population when getting ID then returns household ID', () => {
      // When
      const result = PopulationOps.getId(mockHouseholdPopRef1);

      // Then
      expect(result).toBe(POPULATION_IDS.HOUSEHOLD_1);
    });

    test('given geography population when getting ID then returns geography ID', () => {
      // When
      const result = PopulationOps.getId(mockGeographyPopRef1);

      // Then
      expect(result).toBe(POPULATION_IDS.GEOGRAPHY_1);
    });

    test('given empty household ID when getting ID then returns empty string', () => {
      // When
      const result = PopulationOps.getId(mockHouseholdPopRefEmpty);

      // Then
      expect(result).toBe(POPULATION_IDS.HOUSEHOLD_EMPTY);
    });
  });

  describe('PopulationOps.getLabel', () => {
    test('given household population when getting label then returns formatted label', () => {
      // When
      const result = PopulationOps.getLabel(mockHouseholdPopRef1);

      // Then
      expect(result).toBe(expectedHouseholdLabel);
    });

    test('given geography population when getting label then returns formatted label', () => {
      // When
      const result = PopulationOps.getLabel(mockGeographyPopRef1);

      // Then
      expect(result).toBe(expectedGeographyLabel);
    });
  });

  describe('PopulationOps.getTypeLabel', () => {
    test('given household population when getting type label then returns Household', () => {
      // When
      const result = PopulationOps.getTypeLabel(mockHouseholdPopRef1);

      // Then
      expect(result).toBe(EXPECTED_LABELS.HOUSEHOLD_TYPE);
    });

    test('given geography population when getting type label then returns Geography', () => {
      // When
      const result = PopulationOps.getTypeLabel(mockGeographyPopRef1);

      // Then
      expect(result).toBe(EXPECTED_LABELS.GEOGRAPHY_TYPE);
    });
  });

  describe('PopulationOps.toAPIPayload', () => {
    test('given household population when converting to API payload then returns correct format', () => {
      // When
      const result = PopulationOps.toAPIPayload(mockHouseholdPopRef1);

      // Then
      expect(result).toEqual(expectedHouseholdAPIPayload);
      verifyAPIPayload(
        result,
        [API_PAYLOAD_KEYS.POPULATION_ID, API_PAYLOAD_KEYS.HOUSEHOLD_ID],
        expectedHouseholdAPIPayload
      );
    });

    test('given geography population when converting to API payload then returns correct format', () => {
      // When
      const result = PopulationOps.toAPIPayload(mockGeographyPopRef1);

      // Then
      expect(result).toEqual(expectedGeographyAPIPayload);
      verifyAPIPayload(
        result,
        [API_PAYLOAD_KEYS.GEOGRAPHY_ID, API_PAYLOAD_KEYS.REGION],
        expectedGeographyAPIPayload
      );
    });
  });

  describe('PopulationOps.getCacheKey', () => {
    test('given household population when getting cache key then returns prefixed key', () => {
      // When
      const result = PopulationOps.getCacheKey(mockHouseholdPopRef1);

      // Then
      expect(result).toBe(expectedHouseholdCacheKey);
    });

    test('given geography population when getting cache key then returns prefixed key', () => {
      // When
      const result = PopulationOps.getCacheKey(mockGeographyPopRef1);

      // Then
      expect(result).toBe(expectedGeographyCacheKey);
    });
  });

  describe('PopulationOps.isValid', () => {
    test('given household with valid ID when checking validity then returns true', () => {
      // When
      const result = PopulationOps.isValid(mockHouseholdPopRef1);

      // Then
      expect(result).toBe(true);
    });

    test('given household with empty ID when checking validity then returns false', () => {
      // When
      const result = PopulationOps.isValid(mockHouseholdPopRefEmpty);

      // Then
      expect(result).toBe(false);
    });

    test('given geography with valid ID when checking validity then returns true', () => {
      // When
      const result = PopulationOps.isValid(mockGeographyPopRef1);

      // Then
      expect(result).toBe(true);
    });

    test('given geography with empty ID when checking validity then returns false', () => {
      // When
      const result = PopulationOps.isValid(mockGeographyPopRefEmpty);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('PopulationOps.fromUserPopulation', () => {
    test('given household user population when converting then returns household ref', () => {
      // When
      const result = PopulationOps.fromUserPopulation(mockUserHouseholdPop);

      // Then
      expect(result.type).toBe('household');
      expect((result as any).householdId).toBe(POPULATION_IDS.HOUSEHOLD_1);
    });

    test('given geography user population when converting then returns geography ref', () => {
      // When
      const result = PopulationOps.fromUserPopulation(mockUserGeographyPop);

      // Then
      expect(result.type).toBe('geography');
      expect((result as any).geographyId).toBe(POPULATION_IDS.GEOGRAPHY_1);
    });
  });

  describe('PopulationOps.isEqual', () => {
    test('given same household populations when comparing then returns true', () => {
      // Given
      const pop1 = createHouseholdPopRef(POPULATION_IDS.HOUSEHOLD_1);
      const pop2 = createHouseholdPopRef(POPULATION_IDS.HOUSEHOLD_1);

      // When
      const result = PopulationOps.isEqual(pop1, pop2);

      // Then
      expect(result).toBe(true);
    });

    test('given different household populations when comparing then returns false', () => {
      // When
      const result = PopulationOps.isEqual(mockHouseholdPopRef1, mockHouseholdPopRef2);

      // Then
      expect(result).toBe(false);
    });

    test('given same geography populations when comparing then returns true', () => {
      // Given
      const pop1 = createGeographyPopRef(POPULATION_IDS.GEOGRAPHY_1);
      const pop2 = createGeographyPopRef(POPULATION_IDS.GEOGRAPHY_1);

      // When
      const result = PopulationOps.isEqual(pop1, pop2);

      // Then
      expect(result).toBe(true);
    });

    test('given different geography populations when comparing then returns false', () => {
      // When
      const result = PopulationOps.isEqual(mockGeographyPopRef1, mockGeographyPopRef2);

      // Then
      expect(result).toBe(false);
    });

    test('given household and geography populations when comparing then returns false', () => {
      // When
      const result = PopulationOps.isEqual(mockHouseholdPopRef1, mockGeographyPopRef1);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('PopulationOps.household', () => {
    test('given household ID when creating household ref then returns correct structure', () => {
      // When
      const result = PopulationOps.household(POPULATION_IDS.HOUSEHOLD_1);

      // Then
      expect(result).toEqual({
        type: 'household',
        householdId: POPULATION_IDS.HOUSEHOLD_1,
      });
    });

    test('given empty household ID when creating household ref then still creates ref', () => {
      // When
      const result = PopulationOps.household('');

      // Then
      expect(result).toEqual({
        type: 'household',
        householdId: '',
      });
    });
  });

  describe('PopulationOps.geography', () => {
    test('given geography ID when creating geography ref then returns correct structure', () => {
      // When
      const result = PopulationOps.geography(POPULATION_IDS.GEOGRAPHY_1);

      // Then
      expect(result).toEqual({
        type: 'geography',
        geographyId: POPULATION_IDS.GEOGRAPHY_1,
      });
    });

    test('given empty geography ID when creating geography ref then still creates ref', () => {
      // When
      const result = PopulationOps.geography('');

      // Then
      expect(result).toEqual({
        type: 'geography',
        geographyId: '',
      });
    });
  });
});

describe('UserPopulationOps', () => {
  describe('UserPopulationOps.getId', () => {
    test('given household user population when getting ID then returns household ID', () => {
      // When
      const result = UserPopulationOps.getId(mockUserHouseholdPop);

      // Then
      expect(result).toBe(POPULATION_IDS.HOUSEHOLD_1);
    });

    test('given geography user population when getting ID then returns geography ID', () => {
      // When
      const result = UserPopulationOps.getId(mockUserGeographyPop);

      // Then
      expect(result).toBe(POPULATION_IDS.GEOGRAPHY_1);
    });
  });

  describe('UserPopulationOps.getLabel', () => {
    test('given user population with label when getting label then returns custom label', () => {
      // When
      const result = UserPopulationOps.getLabel(mockUserHouseholdPop);

      // Then
      expect(result).toBe(expectedUserHouseholdLabel);
    });

    test('given household user population without label when getting label then returns default', () => {
      // When
      const result = UserPopulationOps.getLabel(mockUserHouseholdPopNoLabel);

      // Then
      expect(result).toBe(expectedUserHouseholdDefaultLabel);
    });

    test('given geography user population with label when getting label then returns custom label', () => {
      // When
      const result = UserPopulationOps.getLabel(mockUserGeographyPop);

      // Then
      expect(result).toBe(expectedUserGeographyLabel);
    });

    test('given national geography without label when getting label then returns national format', () => {
      // When
      const result = UserPopulationOps.getLabel(mockUserGeographyPopNational);

      // Then
      expect(result).toBe(expectedUserGeographyNationalLabel);
    });

    test('given subnational geography without label when getting label then returns regional format', () => {
      // Given
      const subNationalPop = createUserGeographyPop(
        POPULATION_IDS.GEOGRAPHY_1,
        POPULATION_COUNTRIES.US,
        POPULATION_SCOPES.SUBNATIONAL as any,
        POPULATION_IDS.USER_1
      );

      // When
      const result = UserPopulationOps.getLabel(subNationalPop);

      // Then
      expect(result).toBe(`Regional: ${POPULATION_IDS.GEOGRAPHY_1}`);
    });
  });

  describe('UserPopulationOps.toPopulationRef', () => {
    test('given household user population when converting then returns household ref', () => {
      // When
      const result = UserPopulationOps.toPopulationRef(mockUserHouseholdPop);

      // Then
      expect(result.type).toBe('household');
      expect((result as any).householdId).toBe(POPULATION_IDS.HOUSEHOLD_1);
    });

    test('given geography user population when converting then returns geography ref', () => {
      // When
      const result = UserPopulationOps.toPopulationRef(mockUserGeographyPop);

      // Then
      expect(result.type).toBe('geography');
      expect((result as any).geographyId).toBe(POPULATION_IDS.GEOGRAPHY_1);
    });
  });

  describe('UserPopulationOps.isValid', () => {
    test('given valid household user population when checking validity then returns true', () => {
      // When
      const result = UserPopulationOps.isValid(mockUserHouseholdPop);

      // Then
      expect(result).toBe(true);
    });

    test('given household with empty ID when checking validity then returns false', () => {
      // When
      const result = UserPopulationOps.isValid(mockUserHouseholdPopInvalid);

      // Then
      expect(result).toBe(false);
    });

    test('given household with no user ID when checking validity then returns false', () => {
      // When
      const result = UserPopulationOps.isValid(mockUserHouseholdPopNoUser);

      // Then
      expect(result).toBe(false);
    });

    test('given valid geography user population when checking validity then returns true', () => {
      // When
      const result = UserPopulationOps.isValid(mockUserGeographyPop);

      // Then
      expect(result).toBe(true);
    });

    test('given geography with empty ID when checking validity then returns false', () => {
      // When
      const result = UserPopulationOps.isValid(mockUserGeographyPopInvalid);

      // Then
      expect(result).toBe(false);
    });
  });
});
