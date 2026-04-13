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
import {
  mockHouseholdMetadata,
  mockHouseholdMetadataWithUnknownEntity,
} from '@/tests/fixtures/models/v1HouseholdMocks';

function createHousehold(overrides?: Parameters<typeof createMockHouseholdData>[0]): Household {
  const data = createMockHouseholdData(overrides);

  return Household.fromCanonicalInput({
    id: data.id,
    countryId: data.countryId,
    label: data.label,
    year: data.year,
    householdData: data.data,
  });
}

function createEmptyHousehold(
  overrides?: Parameters<typeof createMockEmptyHouseholdData>[0]
): Household {
  const data = createMockEmptyHouseholdData(overrides);

  return Household.fromCanonicalInput({
    id: data.id,
    countryId: data.countryId,
    label: data.label,
    year: data.year,
    householdData: data.data,
  });
}

describe('Household', () => {
  describe('constructor and accessors', () => {
    it('stores the core household fields', () => {
      const household = createHousehold();

      expect(household.id).toBe(TEST_HOUSEHOLD_ID);
      expect(household.countryId).toBe(TEST_COUNTRY_ID);
      expect(household.label).toBe(TEST_HOUSEHOLD_LABEL);
      expect(household.year).toBe(2026);
      expect(household.data).toHaveProperty('taxUnits');
    });

    it('returns people, person count, and names from the canonical household shape', () => {
      const household = createHousehold();

      expect(household.people).toEqual({
        adult: { age: { 2026: 35 }, employment_income: { 2026: 50000 } },
        child: { age: { 2026: 8 } },
      });
      expect(household.personCount).toBe(2);
      expect(household.personNames).toEqual(['adult', 'child']);
    });

    it('handles households without people', () => {
      const household = createEmptyHousehold();

      expect(household.people).toEqual({});
      expect(household.personCount).toBe(0);
      expect(household.personNames).toEqual([]);
    });

    it('creates immutable copies when changing ids or labels', () => {
      const household = createHousehold();

      expect(household.withId('new-id').id).toBe('new-id');
      expect(household.withLabel('Renamed household').label).toBe('Renamed household');
      expect(household.id).toBe(TEST_HOUSEHOLD_ID);
      expect(household.label).toBe(TEST_HOUSEHOLD_LABEL);
    });

    it('rejects multiple groups of the same type at construction time', () => {
      expect(() =>
        createHousehold({
          data: {
            people: {
              adult: { age: { 2026: 35 } },
            },
            taxUnits: {
              taxUnit1: { members: ['adult'] },
              taxUnit2: { members: ['adult'] },
            },
          },
        })
      ).toThrow('expected at most one taxUnits entry');
    });
  });

  describe('fromCanonical', () => {
    it('stores only the canonical setup internally and still exposes the app household shape', () => {
      const household = Household.fromCanonical(
        {
          countryId: 'us',
          label: 'Canonical household',
          year: 2026,
          people: {
            adult: {
              values: {
                age: { 2026: 35 },
              },
            },
          },
          household: {
            members: ['adult'],
            values: {},
          },
        },
        { id: 'canonical-household' }
      );

      expect(household.id).toBe('canonical-household');
      expect(household.householdData.households).toEqual({
        household1: {
          members: ['adult'],
        },
      });
    });

    it('rejects canonical setups that reference unknown people', () => {
      expect(() =>
        Household.fromCanonical({
          countryId: 'us',
          label: null,
          year: 2026,
          people: {
            adult: { values: { age: { 2026: 35 } } },
          },
          taxUnit: {
            members: ['child'],
            values: {},
          },
        })
      ).toThrow('Canonical household taxUnits references unknown members: child');
    });
  });

  describe('fromV1Metadata', () => {
    it('maps snake_case v1 household_json into the app household shape', () => {
      const household = Household.fromV1Metadata(mockHouseholdMetadata);

      expect(household.id).toBe('12345');
      expect(household.countryId).toBe('us');
      expect(household.year).toBeGreaterThanOrEqual(2025);
      expect(household.data).toEqual({
        people: mockHouseholdMetadata.household_json.people,
        taxUnits: mockHouseholdMetadata.household_json.tax_units,
        maritalUnits: mockHouseholdMetadata.household_json.marital_units,
        spmUnits: mockHouseholdMetadata.household_json.spm_units,
        households: mockHouseholdMetadata.household_json.households,
        families: mockHouseholdMetadata.household_json.families,
      });
    });

    it('rejects unknown entities instead of silently accepting them', () => {
      expect(() => Household.fromV1Metadata(mockHouseholdMetadataWithUnknownEntity)).toThrow(
        'Unsupported household entities in v1 payload: unknown_entity'
      );
    });

    it('rejects v1 member groups that reference unknown people', () => {
      expect(() =>
        Household.fromV1Metadata({
          ...mockHouseholdMetadata,
          household_json: {
            ...mockHouseholdMetadata.household_json,
            tax_units: {
              taxUnit1: {
                members: ['person1', 'missing-person'],
              },
            },
          },
        })
      ).toThrow('references unknown members: missing-person');
    });
  });

  describe('fromV1CreationPayload', () => {
    it('builds a household model directly from a v1 create payload', () => {
      const household = Household.fromV1CreationPayload(
        {
          country_id: 'us',
          label: 'Created household',
          data: mockHouseholdMetadata.household_json,
        },
        { id: 'created-id' }
      );

      expect(household.id).toBe('created-id');
      expect(household.label).toBe('Created household');
      expect(household.householdData.people).toEqual(mockHouseholdMetadata.household_json.people);
      expect(household.householdData.taxUnits).toEqual(
        mockHouseholdMetadata.household_json.tax_units
      );
    });
  });

  describe('fromV2Response', () => {
    it('maps a v2 response into the app household shape with year-wrapped values', () => {
      const household = Household.fromV2Response(createMockHouseholdV2Response());

      expect(household.id).toBe(TEST_HOUSEHOLD_IDS.HOUSEHOLD_A);
      expect(household.countryId).toBe(TEST_COUNTRY_ID);
      expect(household.year).toBe(2026);
      expect(household.label).toBe('My v2 household');
      expect(household.data).toEqual({
        people: {
          adult: {
            age: { 2026: 35 },
            employment_income: { 2026: 50000 },
          },
          child: {
            age: { 2026: 8 },
          },
        },
        taxUnits: {
          taxUnit1: {
            members: ['adult', 'child'],
          },
        },
        families: {
          family1: {
            members: ['adult', 'child'],
          },
        },
        spmUnits: {
          spmUnit1: {
            members: ['adult', 'child'],
          },
        },
        maritalUnits: {
          maritalUnit1: {
            members: ['adult'],
          },
        },
        households: {
          household1: {
            members: ['adult', 'child'],
          },
        },
      });
    });

    it('handles a minimal v2 response with no entity groups', () => {
      const household = Household.fromV2Response(createMockHouseholdV2ResponseMinimal());

      expect(household.data).toEqual({
        people: {
          single_adult: {
            age: { 2026: 30 },
          },
        },
      });
    });

    it('rejects v2 groups that do not link back to any people', () => {
      expect(() =>
        Household.fromV2Response(
          createMockHouseholdV2Response({
            people: [
              {
                name: 'adult',
                person_id: 0,
                age: 35,
              },
            ],
            tax_unit: { tax_unit_id: 0 },
            family: null,
            spm_unit: null,
            marital_unit: null,
            household: null,
          })
        )
      ).toThrow('V2 household tax_unit has no linked members');
    });

    it('treats unlinked stored v2 groups as single groups containing all people', () => {
      const household = Household.fromV2Response(
        createMockHouseholdV2Response({
          people: [
            {
              name: 'adult',
              age: 35,
            },
            {
              name: 'child',
              age: 8,
            },
          ],
          tax_unit: {},
          family: { filing_status: 'single' },
          spm_unit: null,
          marital_unit: null,
          household: { state_name: 'CA' },
          benunit: null,
        })
      );

      expect(household.data.taxUnits).toEqual({
        taxUnit1: {
          members: ['adult', 'child'],
        },
      });
      expect(household.data.families).toEqual({
        family1: {
          members: ['adult', 'child'],
          filing_status: { 2026: 'single' },
        },
      });
      expect(household.data.households).toEqual({
        household1: {
          members: ['adult', 'child'],
          state_name: { 2026: 'CA' },
        },
      });
    });

    it('still rejects missing group ids when person linkage is explicitly present', () => {
      expect(() =>
        Household.fromV2Response(
          createMockHouseholdV2Response({
            people: [
              {
                name: 'adult',
                person_id: 0,
                person_tax_unit_id: 0,
                age: 35,
              },
            ],
            tax_unit: {},
            family: null,
            spm_unit: null,
            marital_unit: null,
            household: null,
            benunit: null,
          })
        )
      ).toThrow('V2 household tax_unit is missing numeric tax_unit_id');
    });

    it('rejects duplicate explicit person names in v2 responses', () => {
      expect(() =>
        Household.fromV2Response(
          createMockHouseholdV2Response({
            people: [
              {
                name: 'adult',
                person_id: 0,
                person_household_id: 0,
                age: 35,
              },
              {
                name: 'adult',
                person_id: 1,
                person_household_id: 0,
                age: 8,
              },
            ],
            household: { household_id: 0 },
            tax_unit: null,
            family: null,
            spm_unit: null,
            marital_unit: null,
            benunit: null,
          })
        )
      ).toThrow('Duplicate person name "adult" in v2 household response');
    });
  });

  describe('toV1CreationPayload', () => {
    it('converts the app household shape back into the v1 creation payload shape', () => {
      const household = createHousehold();

      expect(household.toV1CreationPayload()).toEqual({
        country_id: 'us',
        label: TEST_HOUSEHOLD_LABEL,
        data: {
          people: {
            adult: { age: { 2026: 35 }, employment_income: { 2026: 50000 } },
            child: { age: { 2026: 8 } },
          },
          tax_units: {
            taxUnit1: { members: ['adult', 'child'] },
          },
          families: {
            family1: { members: ['adult', 'child'] },
          },
          spm_units: {
            spmUnit1: { members: ['adult', 'child'] },
          },
          households: {
            household1: { members: ['adult', 'child'] },
          },
        },
      });
    });

    it('wraps scalar canonical values with the household year before emitting v1 payloads', () => {
      const household = Household.fromCanonical(
        {
          countryId: 'us',
          label: 'Scalar household',
          year: 2026,
          people: {
            adult: {
              values: {
                age: 35,
              },
            },
          },
        },
        { id: 'scalar-household' }
      );

      expect(household.toV1CreationPayload()).toEqual({
        country_id: 'us',
        label: 'Scalar household',
        data: {
          people: {
            adult: {
              age: { 2026: 35 },
            },
          },
        },
      });
    });
  });

  describe('toV2CreateEnvelope', () => {
    it('flattens year-keyed values and attaches relationship ids for the v2 create envelope', () => {
      const household = createHousehold();

      expect(household.toV2CreateEnvelope()).toEqual({
        country_id: 'us',
        year: 2026,
        label: TEST_HOUSEHOLD_LABEL,
        people: [
          {
            name: 'adult',
            person_id: 0,
            person_household_id: 0,
            person_family_id: 0,
            person_spm_unit_id: 0,
            person_tax_unit_id: 0,
            age: 35,
            employment_income: 50000,
          },
          {
            name: 'child',
            person_id: 1,
            person_household_id: 0,
            person_family_id: 0,
            person_spm_unit_id: 0,
            person_tax_unit_id: 0,
            age: 8,
          },
        ],
        household: {
          household_id: 0,
        },
        family: {
          family_id: 0,
        },
        spm_unit: {
          spm_unit_id: 0,
        },
        tax_unit: {
          tax_unit_id: 0,
        },
      });
    });

    it('infers the year for draft households created without an explicit year', () => {
      const household = Household.fromDraft({
        countryId: 'us',
        householdData: createMockHouseholdData().data,
      });

      expect(household.toV2CreateEnvelope().year).toBe(2026);
    });

    it('builds a v2 create envelope without the persisted id', () => {
      const household = createHousehold();

      expect(household.toV2CreateEnvelope()).toEqual({
        country_id: 'us',
        year: 2026,
        label: TEST_HOUSEHOLD_LABEL,
        people: [
          {
            name: 'adult',
            person_id: 0,
            person_household_id: 0,
            person_family_id: 0,
            person_spm_unit_id: 0,
            person_tax_unit_id: 0,
            age: 35,
            employment_income: 50000,
          },
          {
            name: 'child',
            person_id: 1,
            person_household_id: 0,
            person_family_id: 0,
            person_spm_unit_id: 0,
            person_tax_unit_id: 0,
            age: 8,
          },
        ],
        household: {
          household_id: 0,
        },
        family: {
          family_id: 0,
        },
        spm_unit: {
          spm_unit_id: 0,
        },
        tax_unit: {
          tax_unit_id: 0,
        },
      });
    });
  });

  describe('toComparable', () => {
    it('returns a stable v2-shaped representation for household comparison', () => {
      const household = createHousehold();

      expect(household.toComparable()).toEqual({
        id: TEST_HOUSEHOLD_ID,
        countryId: 'us',
        year: 2026,
        label: TEST_HOUSEHOLD_LABEL,
        data: {
          benunit: null,
          family: {
            family_id: 0,
          },
          household: {
            household_id: 0,
          },
          marital_unit: null,
          people: [
            {
              age: 35,
              employment_income: 50000,
              name: 'adult',
              person_family_id: 0,
              person_household_id: 0,
              person_id: 0,
              person_spm_unit_id: 0,
              person_tax_unit_id: 0,
            },
            {
              age: 8,
              name: 'child',
              person_family_id: 0,
              person_household_id: 0,
              person_id: 1,
              person_spm_unit_id: 0,
              person_tax_unit_id: 0,
            },
          ],
          spm_unit: {
            spm_unit_id: 0,
          },
          tax_unit: {
            tax_unit_id: 0,
          },
        },
      });
    });
  });

  describe('serialization and equality', () => {
    it('round-trips through toJSON()', () => {
      const data = createMockHouseholdData();
      const household = Household.fromCanonicalInput({
        id: data.id,
        countryId: data.countryId,
        label: data.label,
        year: data.year,
        householdData: data.data,
      });

      expect(household.toJSON()).toEqual(data);
    });

    it('treats identical households as equal', () => {
      const householdA = createHousehold();
      const householdB = createHousehold();

      expect(householdA.isEqual(householdB)).toBe(true);
    });

    it('detects a change in household data', () => {
      const householdA = createHousehold();
      const householdB = createHousehold({
        data: {
          people: {
            solo: { age: { 2026: 99 } },
          },
        },
      });

      expect(householdA.isEqual(householdB)).toBe(false);
    });
  });
});
