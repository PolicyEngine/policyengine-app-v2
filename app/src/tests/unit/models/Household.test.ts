import { describe, expect, it } from 'vitest';
import { Household } from '@/models/Household';
import { createMockUkHouseholdV2Response } from '@/tests/fixtures/api/v2/shared';
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

  return Household.fromAppInput({
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

  return Household.fromAppInput({
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
      expect(household.householdData).toHaveProperty('taxUnits');
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

    it('preserves plural app household data when changing ids or labels', () => {
      const household = createHousehold({
        data: {
          people: {
            adult: { age: { 2026: 35 } },
            child: { age: { 2026: 8 } },
            childTwo: { age: { 2026: 6 } },
          },
          maritalUnits: {
            maritalUnit1: { members: ['adult'] },
            maritalUnit2: { members: ['child'] },
            maritalUnit3: { members: ['childTwo'] },
          },
        },
      });

      expect(household.withId('new-id').householdData.maritalUnits).toEqual(
        household.householdData.maritalUnits
      );
      expect(household.withLabel('Renamed household').householdData.maritalUnits).toEqual(
        household.householdData.maritalUnits
      );
    });

    it('preserves multiple groups of the same type in the app household shape', () => {
      const household = createHousehold({
        data: {
          people: {
            adult: { age: { 2026: 35 } },
            child: { age: { 2026: 8 } },
            childTwo: { age: { 2026: 6 } },
          },
          maritalUnits: {
            maritalUnit1: { members: ['adult'] },
            maritalUnit2: { members: ['child'] },
            maritalUnit3: { members: ['childTwo'] },
          },
        },
      });

      expect(household.householdData.maritalUnits).toEqual({
        maritalUnit1: { members: ['adult'] },
        maritalUnit2: { members: ['child'] },
        maritalUnit3: { members: ['childTwo'] },
      });
    });

    it('rejects invalid secondary app-input groups instead of validating only the first one', () => {
      expect(() =>
        Household.fromAppInput({
          countryId: 'us',
          year: 2026,
          householdData: {
            people: {
              adult: { age: { 2026: 35 } },
            },
            taxUnits: {
              validTaxUnit: { members: ['adult'] },
              invalidTaxUnit: { members: ['missing-person'] },
            },
          },
        })
      ).toThrow('references unknown members: missing-person');
    });

    it('rejects invalid app-input groups regardless of object insertion order', () => {
      expect(() =>
        Household.fromAppInput({
          countryId: 'us',
          year: 2026,
          householdData: {
            people: {
              adult: { age: { 2026: 35 } },
            },
            taxUnits: {
              invalidTaxUnit: { members: ['missing-person'] },
              validTaxUnit: { members: ['adult'] },
            },
          },
        })
      ).toThrow('references unknown members: missing-person');
    });

    it('rejects malformed secondary app-input groups with non-array members', () => {
      expect(() =>
        Household.fromAppInput({
          countryId: 'us',
          year: 2026,
          householdData: {
            people: {
              adult: { age: { 2026: 35 } },
              child: { age: { 2026: 8 } },
            },
            maritalUnits: {
              validMaritalUnit: { members: ['adult'] },
              invalidMaritalUnit: {
                members: 'child' as unknown as string[],
              },
            },
          },
        })
      ).toThrow('invalidMaritalUnit.members must be an array');
    });
  });

  describe('builder operations', () => {
    it('creates builder-ready US households with country defaults', () => {
      const household = Household.empty('us', 2026)
        .addAdult('you', 30, { employment_income: 0 })
        .addAdult('your partner', 30, { employment_income: 0 })
        .addChild('your child', 10, ['you', 'your partner'], { employment_income: 0 });

      const householdData = household.toAppInput().householdData;

      expect(householdData.people.you.age).toEqual({ 2026: 30 });
      expect(householdData.people['your child'].is_tax_unit_dependent).toEqual({ 2026: true });
      expect(householdData.taxUnits?.['your tax unit']?.members).toEqual([
        'you',
        'your partner',
        'your child',
      ]);
      expect(householdData.maritalUnits?.['your marital unit']?.members).toEqual([
        'you',
        'your partner',
      ]);
      expect(householdData.maritalUnits?.["your child's marital unit"]?.members).toEqual([
        'your child',
      ]);
    });

    it('updates variables and removes people immutably', () => {
      const household = Household.empty('us', 2026)
        .addAdult('you', 30)
        .addAdult('your partner', 30)
        .setPersonVariable('you', 'employment_income', 42_000)
        .setGroupVariable('households', 'your household', 'state_name', 'CA');

      const singleHousehold = household.removePerson('your partner');

      expect(household.toAppInput().householdData.people['your partner']).toBeDefined();
      expect(singleHousehold.toAppInput().householdData.people['your partner']).toBeUndefined();
      expect(singleHousehold.toAppInput().householdData.people.you.employment_income).toEqual({
        2026: 42000,
      });
      expect(
        singleHousehold.toAppInput().householdData.households?.['your household']?.state_name
      ).toEqual({ 2026: 'CA' });
    });
  });

  describe('household queries', () => {
    it('derives people, adults, children, and counts from the model', () => {
      const household = createHousehold();

      expect(household.getAllPeople().map((person) => person.name)).toEqual(['adult', 'child']);
      expect(household.getAdults('2026').map((person) => person.name)).toEqual(['adult']);
      expect(household.getChildren('2026').map((person) => person.name)).toEqual(['child']);
      expect(household.getAdultCount('2026')).toBe(1);
      expect(household.getChildCount('2026')).toBe(1);
      expect(household.isEmpty()).toBe(false);
      expect(createEmptyHousehold().isEmpty()).toBe(true);
    });

    it('reads group members and year-keyed variables from the model', () => {
      const household = createHousehold();

      expect(household.getPersonVariableAtYear('adult', 'employment_income', '2026')).toBe(50000);
      expect(household.getGroupMembers('tax_units', 'taxUnit1')).toEqual(['adult', 'child']);
      expect(household.getGroups('households')).toEqual([
        { key: 'household1', members: ['adult', 'child'] },
      ]);
    });
  });

  describe('entity variable updates', () => {
    it('sets, adds, and removes entity variables immutably', () => {
      const household = createHousehold();

      const updated = household.setEntityVariableAtYear(
        'people',
        'adult',
        'employment_income',
        '2026',
        60000
      );
      const added = updated.addEntityVariableIfMissingAtYear(
        'tax_units',
        'your tax unit',
        'taxable_income',
        '2026',
        60000
      );
      const removed = added.removeEntityVariable('people', 'adult', 'employment_income');

      expect(updated.getPersonVariableAtYear('adult', 'employment_income', '2026')).toBe(60000);
      expect(
        added.getGroupVariableAtYear('taxUnits', 'your tax unit', 'taxable_income', '2026')
      ).toBe(60000);
      expect(removed.getPersonVariableAtYear('adult', 'employment_income', '2026')).toBeUndefined();
      expect(household.getPersonVariableAtYear('adult', 'employment_income', '2026')).toBe(50000);
    });
  });

  describe('fromV1Metadata', () => {
    it('maps snake_case v1 household_json into the app household shape', () => {
      const household = Household.fromV1Metadata(mockHouseholdMetadata);

      expect(household.id).toBe('12345');
      expect(household.countryId).toBe('us');
      expect(household.year).toBeGreaterThanOrEqual(2025);
      expect(household.householdData).toEqual({
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
      expect(household.householdData).toEqual({
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

    it('preserves multiple v2 group rows when reading a stored household response', () => {
      const household = Household.fromV2Response(
        createMockHouseholdV2Response({
          people: [
            {
              name: 'adult',
              person_id: 0,
              person_tax_unit_id: 0,
              person_marital_unit_id: 0,
              person_household_id: 0,
              age: 35,
            },
            {
              name: 'child',
              person_id: 1,
              person_tax_unit_id: 1,
              person_marital_unit_id: 1,
              person_household_id: 1,
              age: 8,
            },
          ],
          tax_unit: [{ tax_unit_id: 0 }, { tax_unit_id: 1 }],
          marital_unit: [{ marital_unit_id: 0 }, { marital_unit_id: 1 }],
          household: [{ household_id: 0 }, { household_id: 1 }],
          family: [],
          spm_unit: [],
        })
      );

      expect(household.householdData.taxUnits).toEqual({
        taxUnit1: { members: ['adult'] },
        taxUnit2: { members: ['child'] },
      });
      expect(household.householdData.maritalUnits).toEqual({
        maritalUnit1: { members: ['adult'] },
        maritalUnit2: { members: ['child'] },
      });
      expect(household.householdData.households).toEqual({
        household1: { members: ['adult'] },
        household2: { members: ['child'] },
      });
    });

    it('handles a minimal v2 response with no entity groups', () => {
      const household = Household.fromV2Response(createMockHouseholdV2ResponseMinimal());

      expect(household.householdData).toEqual({
        people: {
          single_adult: {
            age: { 2026: 30 },
          },
        },
      });
    });

    it('parses UK stored v2 households using only household and benunit groups', () => {
      const household = Household.fromV2Response(createMockUkHouseholdV2Response());

      expect(household.countryId).toBe('uk');
      expect(household.householdData).toEqual({
        people: {
          adult: {
            age: { 2026: 30 },
            employment_income: { 2026: 50000 },
          },
        },
        households: {
          household1: {
            members: ['adult'],
          },
        },
        benunits: {
          benunit1: {
            members: ['adult'],
          },
        },
      });
    });

    it('rejects multiple v2 group rows that do not link back to people', () => {
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
            tax_unit: [{ tax_unit_id: 0 }, { tax_unit_id: 1 }],
            family: [],
            spm_unit: [],
            marital_unit: [],
            household: [],
          })
        )
      ).toThrow(
        'V2 household tax_unit has multiple rows but people do not include person_tax_unit_id'
      );
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
          tax_unit: [{}],
          family: [{ filing_status: 'single' }],
          spm_unit: [],
          marital_unit: [],
          household: [{ state_name: 'CA' }],
        })
      );

      expect(household.householdData.taxUnits).toEqual({
        taxUnit1: {
          members: ['adult', 'child'],
        },
      });
      expect(household.householdData.families).toEqual({
        family1: {
          members: ['adult', 'child'],
          filing_status: { 2026: 'single' },
        },
      });
      expect(household.householdData.households).toEqual({
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
            tax_unit: [{}],
            family: [],
            spm_unit: [],
            marital_unit: [],
            household: [],
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
            household: [{ household_id: 0 }],
            tax_unit: [],
            family: [],
            spm_unit: [],
            marital_unit: [],
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
      const household = Household.fromAppInput({
        id: 'scalar-household',
        countryId: 'us',
        label: 'Scalar household',
        year: 2026,
        householdData: {
          people: {
            adult: {
              age: 35,
            },
          },
        },
      });

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

    it('preserves multi-group household data when emitting a v1 payload', () => {
      const household = Household.fromDraft({
        countryId: 'us',
        year: 2026,
        householdData: {
          people: {
            adult: { age: { 2026: 35 } },
            child: { age: { 2026: 8 } },
            childTwo: { age: { 2026: 6 } },
          },
          maritalUnits: {
            maritalUnit1: { members: ['adult'] },
            maritalUnit2: { members: ['child'] },
            maritalUnit3: { members: ['childTwo'] },
          },
        },
      });

      expect(household.toV1CreationPayload()).toEqual({
        country_id: 'us',
        label: undefined,
        data: {
          people: {
            adult: { age: { 2026: 35 } },
            child: { age: { 2026: 8 } },
            childTwo: { age: { 2026: 6 } },
          },
          marital_units: {
            maritalUnit1: { members: ['adult'] },
            maritalUnit2: { members: ['child'] },
            maritalUnit3: { members: ['childTwo'] },
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
        household: [{ household_id: 0 }],
        family: [{ family_id: 0 }],
        spm_unit: [{ spm_unit_id: 0 }],
        tax_unit: [{ tax_unit_id: 0 }],
        marital_unit: [],
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
        household: [{ household_id: 0 }],
        family: [{ family_id: 0 }],
        spm_unit: [{ spm_unit_id: 0 }],
        tax_unit: [{ tax_unit_id: 0 }],
        marital_unit: [],
      });
    });

    it('emits only UK household and benunit groups for UK v2 envelopes', () => {
      const household = Household.fromDraft({
        countryId: 'uk',
        year: 2026,
        householdData: {
          people: {
            adult: { age: { 2026: 35 }, employment_income: { 2026: 50000 } },
          },
          households: {
            household1: { members: ['adult'] },
          },
          benunits: {
            benunit1: { members: ['adult'] },
          },
        },
      });

      expect(household.toV2CreateEnvelope()).toEqual({
        country_id: 'uk',
        year: 2026,
        label: null,
        people: [
          {
            name: 'adult',
            person_id: 0,
            person_household_id: 0,
            person_benunit_id: 0,
            age: 35,
            employment_income: 50000,
          },
        ],
        household: [{ household_id: 0 }],
        benunit: [{ benunit_id: 0 }],
      });
    });

    it('preserves multiple stored v2 groups of the same type', () => {
      const household = Household.fromDraft({
        countryId: 'us',
        year: 2026,
        householdData: {
          people: {
            adult: { age: { 2026: 35 } },
            child: { age: { 2026: 8 } },
            childTwo: { age: { 2026: 6 } },
          },
          maritalUnits: {
            maritalUnit1: { members: ['adult'] },
            maritalUnit2: { members: ['child'] },
            maritalUnit3: { members: ['childTwo'] },
          },
        },
      });

      const envelope = household.toV2CreateEnvelope();

      expect(envelope.country_id).toBe('us');
      if (envelope.country_id !== 'us') {
        throw new Error('Expected US v2 envelope');
      }
      expect(envelope.marital_unit).toEqual([
        { marital_unit_id: 0 },
        { marital_unit_id: 1 },
        { marital_unit_id: 2 },
      ]);
    });

    it('regenerates system ids instead of reusing persisted person and group ids from app input', () => {
      const household = Household.fromAppInput({
        countryId: 'us',
        year: 2026,
        householdData: {
          people: {
            you: {
              age: { 2026: 30 },
              person_id: { 2026: 99 },
              person_marital_unit_id: { 2026: 7 },
            },
            partner: {
              age: { 2026: 31 },
              person_id: { 2026: 42 },
              person_marital_unit_id: { 2026: 7 },
            },
          },
          maritalUnits: {
            maritalUnit1: {
              members: ['partner', 'you'],
              marital_unit_id: { 2026: 7 },
            },
          },
        },
      });

      expect(household.toV2CreateEnvelope()).toEqual({
        country_id: 'us',
        year: 2026,
        label: null,
        people: [
          {
            name: 'partner',
            person_id: 0,
            person_marital_unit_id: 0,
            age: 31,
          },
          {
            name: 'you',
            person_id: 1,
            person_marital_unit_id: 0,
            age: 30,
          },
        ],
        household: [],
        family: [],
        spm_unit: [],
        tax_unit: [],
        marital_unit: [{ marital_unit_id: 0 }],
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
          family: [{ family_id: 0 }],
          household: [{ household_id: 0 }],
          marital_unit: [],
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
          spm_unit: [{ spm_unit_id: 0 }],
          tax_unit: [{ tax_unit_id: 0 }],
        },
      });
    });
  });

  describe('serialization and equality', () => {
    it('round-trips through toJSON()', () => {
      const data = createMockHouseholdData();
      const household = Household.fromAppInput({
        id: data.id,
        countryId: data.countryId,
        label: data.label,
        year: data.year,
        householdData: data.data,
      });

      expect(household.toJSON()).toEqual({
        id: data.id,
        countryId: data.countryId,
        label: data.label,
        year: data.year,
        householdData: data.data,
      });
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
