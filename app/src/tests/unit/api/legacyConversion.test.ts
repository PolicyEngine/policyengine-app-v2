import { describe, expect, test } from 'vitest';
import {
  householdToV1CreationPayload,
  householdToV1Request,
  v1ResponseToHousehold,
} from '@/api/legacyConversion';
import {
  MOCK_V1_US_SINGLE_PERSON,
  MOCK_V1_UK_SINGLE_PERSON,
  MOCK_V1_US_FAMILY,
  MOCK_V1_US_YEAR_2025,
  MOCK_V1_US_EMPTY_ENTITIES,
  MOCK_V2_US_SINGLE_PERSON,
  MOCK_V2_US_COUPLE_WITH_CHILD,
  MOCK_V2_UK_SINGLE_PERSON,
  MOCK_V2_US_MULTIPLE_DEPENDENTS,
  MOCK_V2_US_WITH_LABEL,
  MOCK_V2_US_ROUND_TRIP,
} from '@/tests/fixtures/api/legacyConversionMocks';

describe('legacyConversion', () => {
  describe('v1ResponseToHousehold', () => {
    test('given US v1 response with one person then converts to v2 format', () => {
      const result = v1ResponseToHousehold(MOCK_V1_US_SINGLE_PERSON, 'us', 2024);

      expect(result.tax_benefit_model_name).toBe('policyengine_us');
      expect(result.year).toBe(2024);
      expect(result.people).toHaveLength(1);
      expect(result.people[0].age).toBe(30);
      expect(result.people[0].employment_income).toBe(50000);
      expect(result.people[0]).not.toHaveProperty('person_id');
      expect(result.people[0]).not.toHaveProperty('name');
      expect(result.household).toEqual({ state_name: 'CA' });
      expect(result.tax_unit).toEqual({});
      expect(result.family).toEqual({});
    });

    test('given UK v1 response then converts to v2 format with benunit', () => {
      const result = v1ResponseToHousehold(MOCK_V1_UK_SINGLE_PERSON, 'uk', 2024);

      expect(result.tax_benefit_model_name).toBe('policyengine_uk');
      expect(result.people).toHaveLength(1);
      expect(result.people[0].age).toBe(40);
      expect(result.benunit).toEqual({ is_married: false });
      expect(result.household).toEqual({ region: 'london' });
    });

    test('given multiple people then preserves all in array', () => {
      const result = v1ResponseToHousehold(MOCK_V1_US_FAMILY, 'us', 2024);

      expect(result.people).toHaveLength(3);
      expect(result.people[0].age).toBe(35);
      expect(result.people[1].age).toBe(33);
      expect(result.people[2].age).toBe(8);
    });

    test('given no year parameter then extracts year from data', () => {
      const result = v1ResponseToHousehold(MOCK_V1_US_YEAR_2025, 'us');

      expect(result.year).toBe(2025);
    });

    test('given empty entity then returns empty dict', () => {
      const result = v1ResponseToHousehold(MOCK_V1_US_EMPTY_ENTITIES, 'us', 2024);

      expect(result.tax_unit).toEqual({});
    });
  });

  describe('householdToV1Request', () => {
    test('given v2 household with one person then converts to v1 format', () => {
      const result = householdToV1Request(MOCK_V2_US_SINGLE_PERSON);

      expect(result.people.you.age).toEqual({ '2024': 30 });
      expect(result.people.you.employment_income).toEqual({ '2024': 50000 });
      expect(result.tax_units['your tax unit'].members).toEqual(['you']);
      expect(result.households['your household'].state_name).toEqual({ '2024': 'CA' });
    });

    test('given household with couple and child then generates correct v1 names', () => {
      const result = householdToV1Request(MOCK_V2_US_COUPLE_WITH_CHILD);

      expect(Object.keys(result.people)).toEqual([
        'you',
        'your partner',
        'your first dependent',
      ]);
      expect(result.people.you.age).toEqual({ '2024': 35 });
      expect(result.people['your partner'].age).toEqual({ '2024': 33 });
      expect(result.people['your first dependent'].age).toEqual({ '2024': 8 });
    });

    test('given UK household then converts benunit', () => {
      const result = householdToV1Request(MOCK_V2_UK_SINGLE_PERSON);

      expect(result.benunits['your benunit'].is_married).toEqual({ '2024': false });
      expect(result.households['your household'].region).toEqual({ '2024': 'london' });
    });

    test('given multiple dependents then generates ordinal names', () => {
      const result = householdToV1Request(MOCK_V2_US_MULTIPLE_DEPENDENTS);

      expect(Object.keys(result.people)).toEqual([
        'you',
        'your first dependent',
        'your second dependent',
        'your third dependent',
      ]);
    });
  });

  describe('householdToV1CreationPayload', () => {
    test('given v2 household then wraps in creation payload', () => {
      const result = householdToV1CreationPayload(MOCK_V2_US_WITH_LABEL);

      expect(result.country_id).toBe('us');
      expect(result.label).toBe('My Household');
      expect(result.data.people.you.age).toEqual({ '2024': 30 });
    });
  });

  describe('round-trip conversion', () => {
    test('given v2 household then v1 round-trip preserves data', () => {
      const v1 = householdToV1Request(MOCK_V2_US_ROUND_TRIP);
      const roundTripped = v1ResponseToHousehold(v1, 'us', 2024);

      expect(roundTripped.people).toHaveLength(2);
      expect(roundTripped.people[0].age).toBe(35);
      expect(roundTripped.people[0].employment_income).toBe(50000);
      expect(roundTripped.people[1].age).toBe(10);
      expect(roundTripped.people[1].is_tax_unit_dependent).toBe(true);
      expect(roundTripped.household).toEqual({ state_name: 'CA' });
    });
  });
});
