import { Household } from '@/models/Household';
import type {
  V2HouseholdCreateBody,
  V2HouseholdDocument,
  V2HouseholdItem,
} from '@/types/v2Households';

export const V2_CODEC_YEAR = '2026';
export const STORED_V2_HOUSEHOLD_ID = '5d2c1a7e-3f40-4b8a-9c1d-2e6f7a8b9c0d';
const STORED_AT = '2026-10-20T09:00:00Z';

/** A single US parent with one child in California, on national SPM thresholds. */
export const US_SINGLE_PARENT = Household.starter('us', V2_CODEC_YEAR)
  .withBuilderChildCount(V2_CODEC_YEAR, 1)
  .setGroupVariableAtYear('households', 'your household', 'state_name', V2_CODEC_YEAR, 'CA')
  .withSPM({ geography_kind: 'national' });

/**
 * The same household as the Public API translates its v1 form
 * (translate_legacy_household): people and groups take ids in name order,
 * each keeps its v1 name as source_name, group members become each
 * person's memberships, and the SPM settings move onto the document.
 */
export const US_SINGLE_PARENT_V2_BODY: V2HouseholdCreateBody = {
  country_id: 'us',
  default_year: 2026,
  household_data: {
    people: [
      {
        id: 'person-1',
        source_name: 'you',
        values: { age: { 2026: 30 }, employment_income: { 2026: 0 } },
        memberships: {
          household: 'household-1',
          family: 'family-1',
          tax_unit: 'tax_unit-1',
          spm_unit: 'spm_unit-1',
          marital_unit: 'marital_unit-2',
        },
      },
      {
        id: 'person-2',
        source_name: 'your first dependent',
        values: {
          age: { 2026: 10 },
          is_tax_unit_dependent: { 2026: true },
          employment_income: { 2026: 0 },
        },
        memberships: {
          household: 'household-1',
          family: 'family-1',
          tax_unit: 'tax_unit-1',
          spm_unit: 'spm_unit-1',
          marital_unit: 'marital_unit-1',
        },
      },
    ],
    household: [
      { id: 'household-1', source_name: 'your household', values: { state_name: { 2026: 'CA' } } },
    ],
    family: [{ id: 'family-1', source_name: 'your family', values: {} }],
    tax_unit: [{ id: 'tax_unit-1', source_name: 'your tax unit', values: {} }],
    spm_unit: [{ id: 'spm_unit-1', source_name: 'your household', values: {} }],
    marital_unit: [
      { id: 'marital_unit-1', source_name: "your first dependent's marital unit", values: {} },
      { id: 'marital_unit-2', source_name: 'your marital unit', values: {} },
    ],
    spm: { geography_kind: 'national' },
  },
};

/** A UK parent with one child in the North East. */
export const UK_SINGLE_PARENT = Household.starter('uk', V2_CODEC_YEAR)
  .withBuilderChildCount(V2_CODEC_YEAR, 1)
  .setGroupVariableAtYear('households', 'your household', 'region', V2_CODEC_YEAR, 'NORTH_EAST');

export const UK_SINGLE_PARENT_V2_BODY: V2HouseholdCreateBody = {
  country_id: 'uk',
  default_year: 2026,
  household_data: {
    people: [
      {
        id: 'person-1',
        source_name: 'you',
        values: { age: { 2026: 30 }, employment_income: { 2026: 0 } },
        memberships: { household: 'household-1', benunit: 'benunit-1' },
      },
      {
        id: 'person-2',
        source_name: 'your first dependent',
        values: { age: { 2026: 10 }, employment_income: { 2026: 0 } },
        memberships: { household: 'household-1', benunit: 'benunit-1' },
      },
    ],
    household: [
      {
        id: 'household-1',
        source_name: 'your household',
        values: { region: { 2026: 'NORTH_EAST' } },
      },
    ],
    benunit: [{ id: 'benunit-1', source_name: 'your benefit unit', values: {} }],
  },
};

/** A married US couple with two children: four people, three marital units. */
export const US_COUPLE_WITH_TWO_CHILDREN = Household.starter('us', V2_CODEC_YEAR)
  .withBuilderMaritalStatus(V2_CODEC_YEAR, 'married')
  .withBuilderChildCount(V2_CODEC_YEAR, 2)
  .withSPM({ geography_kind: 'county' })
  .setGroupVariableAtYear('households', 'your household', 'county_fips', V2_CODEC_YEAR, '06037');

/** A stored v2 household as the Public API returns it. */
export function storedV2Household(
  countryId: V2HouseholdItem['country_id'],
  householdData: V2HouseholdDocument
): V2HouseholdItem {
  return {
    id: STORED_V2_HOUSEHOLD_ID,
    country_id: countryId,
    default_year: 2026,
    household_data: householdData,
    created_at: STORED_AT,
    updated_at: STORED_AT,
  };
}

/** A UK household stored without v1 names: its ids name its people and groups. */
export const UK_DOCUMENT_WITHOUT_SOURCE_NAMES: V2HouseholdDocument = {
  people: [
    {
      id: 'adult',
      values: { age: { 2026: 45 } },
      memberships: { household: 'home', benunit: 'family' },
    },
  ],
  household: [{ id: 'home', values: {} }],
  benunit: [{ id: 'family', values: {} }],
};

/** A US household where the child is in no marital unit: v2 needs every membership. */
export const US_PERSON_WITHOUT_MARITAL_UNIT = Household.fromV1CreationPayload({
  country_id: 'us',
  data: {
    people: { you: { age: { 2026: 30 } }, child: { age: { 2026: 5 } } },
    households: { home: { members: ['you', 'child'] } },
    families: { family: { members: ['you', 'child'] } },
    tax_units: { 'tax unit': { members: ['you', 'child'] } },
    spm_units: { 'spm unit': { members: ['you', 'child'] } },
    marital_units: { 'marital unit': { members: ['you'] } },
  },
});
