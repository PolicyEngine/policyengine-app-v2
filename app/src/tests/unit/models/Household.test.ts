import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Household } from '@/models/Household';
import { store } from '@/store';
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
  mockEntityMetadata,
  mockHouseholdMetadata,
  mockHouseholdMetadataWithUnknownEntity,
} from '@/tests/fixtures/models/v1HouseholdMocks';

vi.mock('@/store', () => ({
  store: {
    getState: vi.fn(),
  },
}));

describe('Household', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    (store.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      metadata: {
        entities: mockEntityMetadata,
      },
    });
  });

  describe('constructor and basic accessors', () => {
    it('stores the core household fields', () => {
      const household = new Household(createMockHouseholdData());

      expect(household.id).toBe(TEST_HOUSEHOLD_ID);
      expect(household.countryId).toBe(TEST_COUNTRY_ID);
      expect(household.label).toBe(TEST_HOUSEHOLD_LABEL);
      expect(household.year).toBe(2026);
      expect(household.data).toHaveProperty('taxUnits');
    });

    it('supports updating the label', () => {
      const household = new Household(createMockHouseholdData());

      household.label = 'Renamed household';

      expect(household.label).toBe('Renamed household');
    });

    it('returns people, person count, and names from the app household shape', () => {
      const household = new Household(createMockHouseholdData());

      expect(household.people).toEqual({
        adult: { age: { 2026: 35 }, employment_income: { 2026: 50000 } },
        child: { age: { 2026: 8 } },
      });
      expect(household.personCount).toBe(2);
      expect(household.personNames).toEqual(['adult', 'child']);
    });

    it('handles households without people', () => {
      const household = new Household(createMockEmptyHouseholdData());

      expect(household.people).toEqual({});
      expect(household.personCount).toBe(0);
      expect(household.personNames).toEqual([]);
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

    it('keeps unknown entities and logs a warning', () => {
      const household = Household.fromV1Metadata(mockHouseholdMetadataWithUnknownEntity);

      expect(console.warn).toHaveBeenCalledWith(
        'Entity "unknown_entity" not found in metadata, including anyway'
      );
      expect(household.data).toHaveProperty('unknownEntity');
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
  });

  describe('toV1CreationPayload', () => {
    it('converts the app household shape back into the v1 creation payload shape', () => {
      const household = new Household(createMockHouseholdData());

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

    it('falls back to snake_case and warns for unknown entities', () => {
      const household = Household.fromDraft({
        countryId: 'us',
        householdData: {
          people: {},
          customEntity: {
            entity1: { custom_field: 'value' },
          },
        },
      });

      expect(household.toV1CreationPayload()).toEqual({
        country_id: 'us',
        data: {
          people: {},
          custom_entity: {
            entity1: { custom_field: 'value' },
          },
        },
        label: undefined,
      });
      expect(console.warn).toHaveBeenCalledWith(
        'Entity "customEntity" not found in metadata, using snake_case "custom_entity"'
      );
    });
  });

  describe('toV2Shape', () => {
    it('flattens year-keyed values and attaches relationship ids for v2', () => {
      const household = new Household(createMockHouseholdData());

      expect(household.toV2Shape()).toEqual({
        id: TEST_HOUSEHOLD_ID,
        country_id: 'us',
        year: 2026,
        label: TEST_HOUSEHOLD_LABEL,
        people: [
          {
            person_id: 0,
            person_household_id: 0,
            person_family_id: 0,
            person_spm_unit_id: 0,
            person_tax_unit_id: 0,
            age: 35,
            employment_income: 50000,
          },
          {
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

      expect(household.toV2Shape().year).toBe(2026);
    });
  });

  describe('toComparable', () => {
    it('returns a stable v2-shaped representation for household comparison', () => {
      const household = new Household(createMockHouseholdData());

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
              person_family_id: 0,
              person_household_id: 0,
              person_id: 0,
              person_spm_unit_id: 0,
              person_tax_unit_id: 0,
            },
            {
              age: 8,
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
      const household = new Household(data);

      expect(household.toJSON()).toEqual(data);
    });

    it('treats identical households as equal', () => {
      const householdA = new Household(createMockHouseholdData());
      const householdB = new Household(createMockHouseholdData());

      expect(householdA.isEqual(householdB)).toBe(true);
    });

    it('detects a change in household data', () => {
      const householdA = new Household(createMockHouseholdData());
      const householdB = new Household(
        createMockHouseholdData({
          data: {
            people: {
              solo: { age: { 2026: 99 } },
            },
          },
        })
      );

      expect(householdA.isEqual(householdB)).toBe(false);
    });
  });
});
