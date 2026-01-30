import { describe, expect, test } from 'vitest';
import {
  createHouseholdWithPeople,
  createPersonWithAge,
  mockEmptyHousehold,
  mockHouseholdTwoAdultsTwoChildren,
  mockUKHousehold,
  QUERY_AGES,
  QUERY_EXPECTED_COUNTS,
  QUERY_PERSON_IDS,
  QUERY_PERSON_NAMES,
  QUERY_VARIABLE_NAMES,
  QUERY_VARIABLE_VALUES,
} from '@/tests/fixtures/utils/householdQueriesMocks';
import {
  getAdultCount,
  getAdults,
  getAllPeople,
  getBenunitById,
  getBenunits,
  getChildCount,
  getChildren,
  getDefaultHouseholdUnit,
  getEntitiesByType,
  getEntityVariable,
  getFamilies,
  getFamilyById,
  getHouseholdUnitById,
  getHouseholdUnits,
  getMaritalUnitById,
  getMaritalUnits,
  getModelName,
  getPeopleInBenunit,
  getPeopleInEntity,
  getPeopleInFamily,
  getPeopleInHouseholdUnit,
  getPeopleInMaritalUnit,
  getPeopleInSpmUnit,
  getPeopleInTaxUnit,
  getPersonById,
  getPersonByName,
  getPersonCount,
  getPersonTaxUnit,
  getPersonVariable,
  getRegion,
  getSpmUnitById,
  getSpmUnits,
  getStateCode,
  getStateFips,
  getTaxUnitById,
  getTaxUnits,
  getYear,
  hasPeople,
  isEmpty,
  isUKHousehold,
  isUSHousehold,
} from '@/utils/HouseholdQueries';

describe('HouseholdQueries', () => {
  describe('getAllPeople', () => {
    test('given empty household when getting all people then returns empty array', () => {
      // When
      const result = getAllPeople(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with people when getting all then returns all people', () => {
      // When
      const result = getAllPeople(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.TOTAL);

      // Verify people are returned
      const names = result.map((p) => p.name);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_1);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_2);
      expect(names).toContain(QUERY_PERSON_NAMES.CHILD_1);
      expect(names).toContain(QUERY_PERSON_NAMES.CHILD_2);
    });

    test('given single person household when getting all then returns one person', () => {
      // Given
      const household = createHouseholdWithPeople([
        { person_id: 0, name: QUERY_PERSON_NAMES.ADULT_1, age: QUERY_AGES.ADULT_30 },
      ]);

      // When
      const result = getAllPeople(household);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.ONE_ADULT.TOTAL);
      expect(result[0].name).toBe(QUERY_PERSON_NAMES.ADULT_1);
      expect(result[0].age).toBe(QUERY_AGES.ADULT_30);
    });
  });

  describe('getPersonById', () => {
    test('given existing person ID when getting person then returns person', () => {
      // When
      const result = getPersonById(mockHouseholdTwoAdultsTwoChildren, QUERY_PERSON_IDS.ADULT_1);

      // Then
      expect(result).toBeDefined();
      expect(result?.person_id).toBe(QUERY_PERSON_IDS.ADULT_1);
      expect(result?.name).toBe(QUERY_PERSON_NAMES.ADULT_1);
    });

    test('given non-existent person ID when getting person then returns undefined', () => {
      // When
      const result = getPersonById(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });

    test('given empty household when getting person then returns undefined', () => {
      // When
      const result = getPersonById(mockEmptyHousehold, QUERY_PERSON_IDS.ADULT_1);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getPersonByName', () => {
    test('given existing person name when getting person then returns person', () => {
      // When
      const result = getPersonByName(mockHouseholdTwoAdultsTwoChildren, QUERY_PERSON_NAMES.ADULT_1);

      // Then
      expect(result).toBeDefined();
      expect(result?.name).toBe(QUERY_PERSON_NAMES.ADULT_1);
      expect(result?.age).toBe(QUERY_AGES.ADULT_30);
    });

    test('given non-existent person name when getting person then returns undefined', () => {
      // When
      const result = getPersonByName(mockHouseholdTwoAdultsTwoChildren, 'NonExistent');

      // Then
      expect(result).toBeUndefined();
    });

    test('given empty household when getting person then returns undefined', () => {
      // When
      const result = getPersonByName(mockEmptyHousehold, QUERY_PERSON_NAMES.ADULT_1);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getAdults', () => {
    test('given household with adults and children when getting adults then returns only adults', () => {
      // When
      const result = getAdults(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.ADULTS);
      const names = result.map((p) => p.name);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_1);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_2);
    });

    test('given empty household when getting adults then returns empty array', () => {
      // When
      const result = getAdults(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with only children when getting adults then returns empty array', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.CHILD_1,
          QUERY_PERSON_NAMES.CHILD_1,
          QUERY_AGES.CHILD_10
        ),
        createPersonWithAge(
          QUERY_PERSON_IDS.CHILD_2,
          QUERY_PERSON_NAMES.CHILD_2,
          QUERY_AGES.CHILD_5
        ),
      ]);

      // When
      const result = getAdults(household);

      // Then
      expect(result).toEqual([]);
    });

    test('given 18-year-old when getting adults then includes them', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.TEEN,
          QUERY_PERSON_NAMES.TEEN,
          QUERY_AGES.ADULT_EXACTLY_18
        ),
      ]);

      // When
      const result = getAdults(household);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(QUERY_PERSON_NAMES.TEEN);
      expect(result[0].age).toBe(QUERY_AGES.ADULT_EXACTLY_18);
    });
  });

  describe('getChildren', () => {
    test('given household with adults and children when getting children then returns only children', () => {
      // When
      const result = getChildren(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.CHILDREN);
      const names = result.map((p) => p.name);
      expect(names).toContain(QUERY_PERSON_NAMES.CHILD_1);
      expect(names).toContain(QUERY_PERSON_NAMES.CHILD_2);
    });

    test('given empty household when getting children then returns empty array', () => {
      // When
      const result = getChildren(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });

    test('given household with only adults when getting children then returns empty array', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.ADULT_1,
          QUERY_PERSON_NAMES.ADULT_1,
          QUERY_AGES.ADULT_30
        ),
        createPersonWithAge(
          QUERY_PERSON_IDS.ADULT_2,
          QUERY_PERSON_NAMES.ADULT_2,
          QUERY_AGES.ADULT_25
        ),
      ]);

      // When
      const result = getChildren(household);

      // Then
      expect(result).toEqual([]);
    });

    test('given 17-year-old when getting children then includes them', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.TEEN,
          QUERY_PERSON_NAMES.TEEN,
          QUERY_AGES.CHILD_ALMOST_18
        ),
      ]);

      // When
      const result = getChildren(household);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe(QUERY_PERSON_NAMES.TEEN);
      expect(result[0].age).toBe(QUERY_AGES.CHILD_ALMOST_18);
    });
  });

  describe('getPersonVariable', () => {
    test('given existing person and variable when getting variable then returns value', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_IDS.ADULT_1,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.INCOME_50K);
    });

    test('given non-existent person when getting variable then returns undefined', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        999,
        QUERY_VARIABLE_NAMES.EMPLOYMENT_INCOME
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent variable when getting variable then returns undefined', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_IDS.ADULT_1,
        QUERY_VARIABLE_NAMES.NON_EXISTENT
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given boolean variable when getting variable then returns boolean value', () => {
      // When
      const result = getPersonVariable(
        mockHouseholdTwoAdultsTwoChildren,
        QUERY_PERSON_IDS.CHILD_1,
        QUERY_VARIABLE_NAMES.IS_TAX_UNIT_DEPENDENT
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.BOOLEAN_TRUE);
    });
  });

  describe('getPersonCount', () => {
    test('given empty household when counting people then returns zero', () => {
      // When
      const result = getPersonCount(mockEmptyHousehold);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.TOTAL);
    });

    test('given household with people when counting then returns correct count', () => {
      // When
      const result = getPersonCount(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.TOTAL);
    });

    test('given single person household when counting then returns one', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.ADULT_1,
          QUERY_PERSON_NAMES.ADULT_1,
          QUERY_AGES.ADULT_30
        ),
      ]);

      // When
      const result = getPersonCount(household);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.ONE_ADULT.TOTAL);
    });
  });

  describe('getAdultCount', () => {
    test('given household with adults and children when counting adults then returns adult count', () => {
      // When
      const result = getAdultCount(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.ADULTS);
    });

    test('given empty household when counting adults then returns zero', () => {
      // When
      const result = getAdultCount(mockEmptyHousehold);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.ADULTS);
    });

    test('given household with only children when counting adults then returns zero', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.CHILD_1,
          QUERY_PERSON_NAMES.CHILD_1,
          QUERY_AGES.CHILD_10
        ),
        createPersonWithAge(
          QUERY_PERSON_IDS.CHILD_2,
          QUERY_PERSON_NAMES.CHILD_2,
          QUERY_AGES.CHILD_5
        ),
      ]);

      // When
      const result = getAdultCount(household);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('getChildCount', () => {
    test('given household with adults and children when counting children then returns child count', () => {
      // When
      const result = getChildCount(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.TWO_ADULTS_TWO_CHILDREN.CHILDREN);
    });

    test('given empty household when counting children then returns zero', () => {
      // When
      const result = getChildCount(mockEmptyHousehold);

      // Then
      expect(result).toBe(QUERY_EXPECTED_COUNTS.EMPTY.CHILDREN);
    });

    test('given household with only adults when counting children then returns zero', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.ADULT_1,
          QUERY_PERSON_NAMES.ADULT_1,
          QUERY_AGES.ADULT_30
        ),
        createPersonWithAge(
          QUERY_PERSON_IDS.ADULT_2,
          QUERY_PERSON_NAMES.ADULT_2,
          QUERY_AGES.ADULT_25
        ),
      ]);

      // When
      const result = getChildCount(household);

      // Then
      expect(result).toBe(0);
    });
  });

  describe('isEmpty', () => {
    test('given empty household when checking if empty then returns true', () => {
      // When
      const result = isEmpty(mockEmptyHousehold);

      // Then
      expect(result).toBe(true);
    });

    test('given household with people when checking if empty then returns false', () => {
      // When
      const result = isEmpty(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(false);
    });

    test('given single person household when checking if empty then returns false', () => {
      // Given
      const household = createHouseholdWithPeople([
        createPersonWithAge(
          QUERY_PERSON_IDS.ADULT_1,
          QUERY_PERSON_NAMES.ADULT_1,
          QUERY_AGES.ADULT_30
        ),
      ]);

      // When
      const result = isEmpty(household);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('hasPeople', () => {
    test('given empty household when checking has people then returns false', () => {
      // When
      const result = hasPeople(mockEmptyHousehold);

      // Then
      expect(result).toBe(false);
    });

    test('given household with people when checking has people then returns true', () => {
      // When
      const result = hasPeople(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(true);
    });
  });

  describe('getTaxUnits', () => {
    test('given household with tax units when getting tax units then returns all tax units', () => {
      // When
      const result = getTaxUnits(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].tax_unit_id).toBe(0);
    });

    test('given household without tax units when getting tax units then returns empty array', () => {
      // When
      const result = getTaxUnits(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getTaxUnitById', () => {
    test('given existing tax unit ID when getting tax unit then returns tax unit', () => {
      // When
      const result = getTaxUnitById(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toBeDefined();
      expect(result?.tax_unit_id).toBe(0);
    });

    test('given non-existent tax unit ID when getting tax unit then returns undefined', () => {
      // When
      const result = getTaxUnitById(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getPeopleInTaxUnit', () => {
    test('given existing tax unit when getting people then returns all people in tax unit', () => {
      // When
      const result = getPeopleInTaxUnit(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toHaveLength(4);
      const names = result.map((p) => p.name);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_1);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_2);
      expect(names).toContain(QUERY_PERSON_NAMES.CHILD_1);
      expect(names).toContain(QUERY_PERSON_NAMES.CHILD_2);
    });

    test('given non-existent tax unit when getting people then returns empty array', () => {
      // When
      const result = getPeopleInTaxUnit(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getPersonTaxUnit', () => {
    test('given person in tax unit when getting tax unit then returns tax unit', () => {
      // When
      const result = getPersonTaxUnit(mockHouseholdTwoAdultsTwoChildren, QUERY_PERSON_IDS.ADULT_1);

      // Then
      expect(result).toBeDefined();
      expect(result?.tax_unit_id).toBe(0);
    });

    test('given person not in tax unit when getting tax unit then returns undefined', () => {
      // Given
      const household = createHouseholdWithPeople([
        { person_id: 0, name: QUERY_PERSON_NAMES.ADULT_1, age: QUERY_AGES.ADULT_30 },
      ]);

      // When
      const result = getPersonTaxUnit(household, 0);

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent person when getting tax unit then returns undefined', () => {
      // When
      const result = getPersonTaxUnit(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getFamilies', () => {
    test('given household with families when getting families then returns all families', () => {
      // When
      const result = getFamilies(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].family_id).toBe(0);
    });

    test('given household without families when getting families then returns empty array', () => {
      // When
      const result = getFamilies(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getFamilyById', () => {
    test('given existing family ID when getting family then returns family', () => {
      // When
      const result = getFamilyById(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toBeDefined();
      expect(result?.family_id).toBe(0);
    });

    test('given non-existent family ID when getting family then returns undefined', () => {
      // When
      const result = getFamilyById(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getPeopleInFamily', () => {
    test('given existing family when getting people then returns all people in family', () => {
      // When
      const result = getPeopleInFamily(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toHaveLength(4);
    });

    test('given non-existent family when getting people then returns empty array', () => {
      // When
      const result = getPeopleInFamily(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getSpmUnits', () => {
    test('given household with SPM units when getting SPM units then returns all SPM units', () => {
      // When
      const result = getSpmUnits(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].spm_unit_id).toBe(0);
    });

    test('given household without SPM units when getting SPM units then returns empty array', () => {
      // When
      const result = getSpmUnits(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getSpmUnitById', () => {
    test('given existing SPM unit ID when getting SPM unit then returns SPM unit', () => {
      // When
      const result = getSpmUnitById(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toBeDefined();
      expect(result?.spm_unit_id).toBe(0);
    });

    test('given non-existent SPM unit ID when getting SPM unit then returns undefined', () => {
      // When
      const result = getSpmUnitById(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getPeopleInSpmUnit', () => {
    test('given existing SPM unit when getting people then returns all people in SPM unit', () => {
      // When
      const result = getPeopleInSpmUnit(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toHaveLength(4);
    });

    test('given non-existent SPM unit when getting people then returns empty array', () => {
      // When
      const result = getPeopleInSpmUnit(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getMaritalUnits', () => {
    test('given household with marital units when getting marital units then returns all marital units', () => {
      // When
      const result = getMaritalUnits(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].marital_unit_id).toBe(0);
    });

    test('given household without marital units when getting marital units then returns empty array', () => {
      // When
      const result = getMaritalUnits(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getMaritalUnitById', () => {
    test('given existing marital unit ID when getting marital unit then returns marital unit', () => {
      // When
      const result = getMaritalUnitById(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toBeDefined();
      expect(result?.marital_unit_id).toBe(0);
    });

    test('given non-existent marital unit ID when getting marital unit then returns undefined', () => {
      // When
      const result = getMaritalUnitById(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getPeopleInMaritalUnit', () => {
    test('given existing marital unit when getting people then returns all people in marital unit', () => {
      // When
      const result = getPeopleInMaritalUnit(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toHaveLength(2);
      const names = result.map((p) => p.name);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_1);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_2);
    });

    test('given non-existent marital unit when getting people then returns empty array', () => {
      // When
      const result = getPeopleInMaritalUnit(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getHouseholdUnits', () => {
    test('given household with household units when getting household units then returns all household units', () => {
      // When
      const result = getHouseholdUnits(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].household_id).toBe(0);
    });

    test('given household without household units when getting household units then returns empty array', () => {
      // When
      const result = getHouseholdUnits(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getHouseholdUnitById', () => {
    test('given existing household unit ID when getting household unit then returns household unit', () => {
      // When
      const result = getHouseholdUnitById(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toBeDefined();
      expect(result?.household_id).toBe(0);
    });

    test('given non-existent household unit ID when getting household unit then returns undefined', () => {
      // When
      const result = getHouseholdUnitById(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getPeopleInHouseholdUnit', () => {
    test('given existing household unit when getting people then returns all people in household unit', () => {
      // When
      const result = getPeopleInHouseholdUnit(mockHouseholdTwoAdultsTwoChildren, 0);

      // Then
      expect(result).toHaveLength(4);
    });

    test('given non-existent household unit when getting people then returns empty array', () => {
      // When
      const result = getPeopleInHouseholdUnit(mockHouseholdTwoAdultsTwoChildren, 999);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getDefaultHouseholdUnit', () => {
    test('given household with household units when getting default then returns first household unit', () => {
      // When
      const result = getDefaultHouseholdUnit(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBeDefined();
      expect(result?.household_id).toBe(0);
    });

    test('given household without household units when getting default then returns undefined', () => {
      // When
      const result = getDefaultHouseholdUnit(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getBenunits', () => {
    test('given UK household with benefit units when getting benefit units then returns all benefit units', () => {
      // When
      const result = getBenunits(mockUKHousehold);

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].benunit_id).toBe(0);
    });

    test('given household without benefit units when getting benefit units then returns empty array', () => {
      // When
      const result = getBenunits(mockEmptyHousehold);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getBenunitById', () => {
    test('given existing benefit unit ID when getting benefit unit then returns benefit unit', () => {
      // When
      const result = getBenunitById(mockUKHousehold, 0);

      // Then
      expect(result).toBeDefined();
      expect(result?.benunit_id).toBe(0);
    });

    test('given non-existent benefit unit ID when getting benefit unit then returns undefined', () => {
      // When
      const result = getBenunitById(mockUKHousehold, 999);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getPeopleInBenunit', () => {
    test('given existing benefit unit when getting people then returns all people in benefit unit', () => {
      // When
      const result = getPeopleInBenunit(mockUKHousehold, 0);

      // Then
      expect(result).toHaveLength(2);
      const names = result.map((p) => p.name);
      expect(names).toContain(QUERY_PERSON_NAMES.ADULT_1);
      expect(names).toContain(QUERY_PERSON_NAMES.CHILD_1);
    });

    test('given non-existent benefit unit when getting people then returns empty array', () => {
      // When
      const result = getPeopleInBenunit(mockUKHousehold, 999);

      // Then
      expect(result).toEqual([]);
    });
  });

  describe('getEntitiesByType', () => {
    test('given person entity type when getting entities then returns people', () => {
      // When
      const result = getEntitiesByType(mockHouseholdTwoAdultsTwoChildren, 'person');

      // Then
      expect(result).toHaveLength(4);
    });

    test('given tax unit entity type when getting entities then returns tax units', () => {
      // When
      const result = getEntitiesByType(mockHouseholdTwoAdultsTwoChildren, 'tax_unit');

      // Then
      expect(result).toHaveLength(1);
    });

    test('given family entity type when getting entities then returns families', () => {
      // When
      const result = getEntitiesByType(mockHouseholdTwoAdultsTwoChildren, 'family');

      // Then
      expect(result).toHaveLength(1);
    });

    test('given household entity type when getting entities then returns households', () => {
      // When
      const result = getEntitiesByType(mockHouseholdTwoAdultsTwoChildren, 'household');

      // Then
      expect(result).toHaveLength(1);
    });

    test('given benunit entity type when getting entities then returns benunits', () => {
      // When
      const result = getEntitiesByType(mockUKHousehold, 'benunit');

      // Then
      expect(result).toHaveLength(1);
    });
  });

  describe('getPeopleInEntity', () => {
    test('given person entity type when getting people then returns single person', () => {
      // When
      const result = getPeopleInEntity(
        mockHouseholdTwoAdultsTwoChildren,
        'person',
        QUERY_PERSON_IDS.ADULT_1
      );

      // Then
      expect(result).toHaveLength(1);
      expect(result[0].person_id).toBe(QUERY_PERSON_IDS.ADULT_1);
    });

    test('given tax unit entity type when getting people then returns people in tax unit', () => {
      // When
      const result = getPeopleInEntity(mockHouseholdTwoAdultsTwoChildren, 'tax_unit', 0);

      // Then
      expect(result).toHaveLength(4);
    });

    test('given family entity type when getting people then returns people in family', () => {
      // When
      const result = getPeopleInEntity(mockHouseholdTwoAdultsTwoChildren, 'family', 0);

      // Then
      expect(result).toHaveLength(4);
    });

    test('given household entity type when getting people then returns people in household', () => {
      // When
      const result = getPeopleInEntity(mockHouseholdTwoAdultsTwoChildren, 'household', 0);

      // Then
      expect(result).toHaveLength(4);
    });
  });

  describe('getEntityVariable', () => {
    test('given existing tax unit and variable when getting variable then returns value', () => {
      // When
      const result = getEntityVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'tax_unit',
        0,
        QUERY_VARIABLE_NAMES.STATE_CODE
      );

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.STATE_CA);
    });

    test('given non-existent entity when getting variable then returns undefined', () => {
      // When
      const result = getEntityVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'tax_unit',
        999,
        QUERY_VARIABLE_NAMES.STATE_CODE
      );

      // Then
      expect(result).toBeUndefined();
    });

    test('given non-existent variable when getting variable then returns undefined', () => {
      // When
      const result = getEntityVariable(
        mockHouseholdTwoAdultsTwoChildren,
        'tax_unit',
        0,
        QUERY_VARIABLE_NAMES.NON_EXISTENT
      );

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getYear', () => {
    test('given household when getting year then returns year', () => {
      // When
      const result = getYear(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(2024);
    });
  });

  describe('getModelName', () => {
    test('given US household when getting model name then returns policyengine_us', () => {
      // When
      const result = getModelName(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe('policyengine_us');
    });

    test('given UK household when getting model name then returns policyengine_uk', () => {
      // When
      const result = getModelName(mockUKHousehold);

      // Then
      expect(result).toBe('policyengine_uk');
    });
  });

  describe('isUSHousehold', () => {
    test('given US household when checking if US then returns true', () => {
      // When
      const result = isUSHousehold(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(true);
    });

    test('given UK household when checking if US then returns false', () => {
      // When
      const result = isUSHousehold(mockUKHousehold);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('isUKHousehold', () => {
    test('given UK household when checking if UK then returns true', () => {
      // When
      const result = isUKHousehold(mockUKHousehold);

      // Then
      expect(result).toBe(true);
    });

    test('given US household when checking if UK then returns false', () => {
      // When
      const result = isUKHousehold(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(false);
    });
  });

  describe('getStateFips', () => {
    test('given household with state FIPS when getting state FIPS then returns state FIPS', () => {
      // When
      const result = getStateFips(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(6);
    });

    test('given household without household units when getting state FIPS then returns undefined', () => {
      // When
      const result = getStateFips(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getStateCode', () => {
    test('given household with state code when getting state code then returns state code', () => {
      // When
      const result = getStateCode(mockHouseholdTwoAdultsTwoChildren);

      // Then
      expect(result).toBe(QUERY_VARIABLE_VALUES.STATE_CA);
    });

    test('given household without tax units when getting state code then returns undefined', () => {
      // When
      const result = getStateCode(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('getRegion', () => {
    test('given UK household with region when getting region then returns region', () => {
      // When
      const result = getRegion(mockUKHousehold);

      // Then
      expect(result).toBe('LONDON');
    });

    test('given household without household units when getting region then returns undefined', () => {
      // When
      const result = getRegion(mockEmptyHousehold);

      // Then
      expect(result).toBeUndefined();
    });
  });
});
