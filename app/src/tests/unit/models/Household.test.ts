import { describe, expect, it } from 'vitest';
import { Household } from '@/models/Household';
import {
  createMockEmptyHouseholdData,
  createMockHouseholdData,
  createMockHouseholdV2Response,
  createMockHouseholdV2ResponseMinimal,
  TEST_COUNTRY_ID,
  TEST_HOUSEHOLD_ID,
  TEST_HOUSEHOLD_IDS,
  TEST_HOUSEHOLD_LABEL,
} from '@/tests/fixtures/models/shared';

describe('Household', () => {
  // ========================================================================
  // Constructor
  // ========================================================================

  describe('constructor', () => {
    it('given valid HouseholdData then sets id, countryId, label, and data', () => {
      // Given
      const data = createMockHouseholdData();

      // When
      const household = new Household(data);

      // Then
      expect(household.id).toBe(TEST_HOUSEHOLD_ID);
      expect(household.countryId).toBe(TEST_COUNTRY_ID);
      expect(household.label).toBe(TEST_HOUSEHOLD_LABEL);
      expect(household.data).toBeDefined();
      expect(household.data.people).toBeDefined();
    });

    it('given null label then label is null', () => {
      // Given
      const data = createMockHouseholdData({ label: null });

      // When
      const household = new Household(data);

      // Then
      expect(household.label).toBeNull();
    });
  });

  // ========================================================================
  // label getter / setter
  // ========================================================================

  describe('label', () => {
    it('given label set via setter then getter returns new value', () => {
      // Given
      const household = new Household(createMockHouseholdData());

      // When
      household.label = 'Renamed household';

      // Then
      expect(household.label).toBe('Renamed household');
    });

    it('given label set to null then getter returns null', () => {
      // Given
      const household = new Household(createMockHouseholdData());

      // When
      household.label = null;

      // Then
      expect(household.label).toBeNull();
    });
  });

  // ========================================================================
  // data getter
  // ========================================================================

  describe('data', () => {
    it('given household with data then returns the data object', () => {
      // Given
      const inputData = createMockHouseholdData();

      // When
      const household = new Household(inputData);

      // Then
      expect(household.data).toEqual(inputData.data);
      expect(household.data).toHaveProperty('people');
      expect(household.data).toHaveProperty('tax_unit');
    });

    it('given household with empty data then returns empty object', () => {
      // Given
      const inputData = createMockEmptyHouseholdData();

      // When
      const household = new Household(inputData);

      // Then
      expect(household.data).toEqual({});
    });
  });

  // ========================================================================
  // people getter
  // ========================================================================

  describe('people', () => {
    it('given household with people then extracts people from data', () => {
      // Given
      const household = new Household(createMockHouseholdData());

      // When
      const people = household.people;

      // Then
      expect(people).toHaveProperty('adult');
      expect(people).toHaveProperty('child');
    });

    it('given household with no people key then returns empty object', () => {
      // Given
      const household = new Household(createMockEmptyHouseholdData());

      // When
      const people = household.people;

      // Then
      expect(people).toEqual({});
    });

    it('given household with people set to null then returns empty object', () => {
      // Given
      const household = new Household(createMockHouseholdData({ data: { people: null } }));

      // When
      const people = household.people;

      // Then
      expect(people).toEqual({});
    });
  });

  // ========================================================================
  // personCount
  // ========================================================================

  describe('personCount', () => {
    it('given household with two people then returns 2', () => {
      // Given
      const household = new Household(createMockHouseholdData());

      // When
      const count = household.personCount;

      // Then
      expect(count).toBe(2);
    });

    it('given household with no people then returns 0', () => {
      // Given
      const household = new Household(createMockEmptyHouseholdData());

      // When
      const count = household.personCount;

      // Then
      expect(count).toBe(0);
    });
  });

  // ========================================================================
  // personNames
  // ========================================================================

  describe('personNames', () => {
    it('given household with people then returns keys of people', () => {
      // Given
      const household = new Household(createMockHouseholdData());

      // When
      const names = household.personNames;

      // Then
      expect(names).toEqual(['adult', 'child']);
    });

    it('given household with no people then returns empty array', () => {
      // Given
      const household = new Household(createMockEmptyHouseholdData());

      // When
      const names = household.personNames;

      // Then
      expect(names).toEqual([]);
    });
  });

  // ========================================================================
  // fromV2Response()
  // ========================================================================

  describe('fromV2Response', () => {
    it('given HouseholdV2Response then maps id and country_id correctly', () => {
      // Given
      const response = createMockHouseholdV2Response();

      // When
      const household = Household.fromV2Response(response);

      // Then
      expect(household.id).toBe(TEST_HOUSEHOLD_IDS.HOUSEHOLD_A);
      expect(household.countryId).toBe(TEST_COUNTRY_ID);
    });

    it('given HouseholdV2Response with label then maps label', () => {
      // Given
      const response = createMockHouseholdV2Response({
        label: 'Custom household',
      });

      // When
      const household = Household.fromV2Response(response);

      // Then
      expect(household.label).toBe('Custom household');
    });

    it('given HouseholdV2Response with null label then label is null', () => {
      // Given
      const response = createMockHouseholdV2Response({ label: null });

      // When
      const household = Household.fromV2Response(response);

      // Then
      expect(household.label).toBeNull();
    });

    it('given HouseholdV2Response then maps entity groups into data', () => {
      // Given
      const response = createMockHouseholdV2Response();

      // When
      const household = Household.fromV2Response(response);
      const data = household.data;

      // Then
      expect(data.people).toEqual(response.people);
      expect(data.tax_unit).toEqual(response.tax_unit);
      expect(data.family).toEqual(response.family);
      expect(data.spm_unit).toEqual(response.spm_unit);
      expect(data.marital_unit).toEqual(response.marital_unit);
      expect(data.household).toEqual(response.household);
      expect(data.benunit).toBeNull();
    });

    it('given minimal HouseholdV2Response then maps null groups into data', () => {
      // Given
      const response = createMockHouseholdV2ResponseMinimal();

      // When
      const household = Household.fromV2Response(response);
      const data = household.data;

      // Then
      expect(data.tax_unit).toBeNull();
      expect(data.family).toBeNull();
      expect(data.spm_unit).toBeNull();
      expect(data.marital_unit).toBeNull();
      expect(data.household).toBeNull();
      expect(data.benunit).toBeNull();
    });

    it('given HouseholdV2Response with country_id then casts to CountryId', () => {
      // Given
      const response = createMockHouseholdV2Response({ country_id: 'uk' });

      // When
      const household = Household.fromV2Response(response);

      // Then
      expect(household.countryId).toBe('uk');
    });
  });

  // ========================================================================
  // toJSON() roundtrip
  // ========================================================================

  describe('toJSON', () => {
    it('given household created from data then toJSON deep equals original data', () => {
      // Given
      const data = createMockHouseholdData();

      // When
      const household = new Household(data);
      const json = household.toJSON();

      // Then
      expect(json).toEqual(data);
    });

    it('given household with updated label then toJSON reflects the update', () => {
      // Given
      const data = createMockHouseholdData();
      const household = new Household(data);

      // When
      household.label = 'Updated household';
      const json = household.toJSON();

      // Then
      expect(json.label).toBe('Updated household');
      expect(json.id).toBe(TEST_HOUSEHOLD_ID);
    });

    it('given empty household then toJSON roundtrips correctly', () => {
      // Given
      const data = createMockEmptyHouseholdData();

      // When
      const household = new Household(data);
      const json = household.toJSON();

      // Then
      expect(json).toEqual(data);
      expect(json.data).toEqual({});
    });
  });

  // ========================================================================
  // isEqual
  // ========================================================================

  describe('isEqual', () => {
    it('given same id then returns true', () => {
      // Given
      const householdA = new Household(createMockHouseholdData());
      const householdB = new Household(createMockHouseholdData());

      // When / Then
      expect(householdA.isEqual(householdB)).toBe(true);
    });

    it('given different id then returns false', () => {
      // Given
      const householdA = new Household(createMockHouseholdData());
      const householdB = new Household(createMockHouseholdData({ id: 'different-id-999' }));

      // When / Then
      expect(householdA.isEqual(householdB)).toBe(false);
    });

    it('given same id but different label then returns false', () => {
      // Given
      const householdA = new Household(createMockHouseholdData());
      const householdB = new Household(createMockHouseholdData({ label: 'Different label' }));

      // When / Then
      expect(householdA.isEqual(householdB)).toBe(false);
    });

    it('given same id but different data then returns false', () => {
      // Given
      const householdA = new Household(createMockHouseholdData());
      const householdB = new Household(
        createMockHouseholdData({ data: { people: { solo: { age: 99 } } } })
      );

      // When / Then
      expect(householdA.isEqual(householdB)).toBe(false);
    });
  });
});
