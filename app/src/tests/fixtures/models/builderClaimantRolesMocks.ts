import type { CountryId } from '@/libs/countries';
import { Household, UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import type { AppHouseholdInputPerson } from '@/models/household/appTypes';
import metadataReducer from '@/reducers/metadataReducer';
import type { MetadataState } from '@/types/metadata';
import type { ClaimantRoleModelMetadata } from '@/utils/builderClaimantRoles';

export const ROLE_TEST_YEAR = '2026';
export const ROLE_TEST_YEAR_NUMBER = 2026;

export const BUILDER_PEOPLE = {
  YOU: 'you',
  PARTNER: 'your partner',
  FIRST_DEPENDANT: 'your first dependent',
  SECOND_DEPENDANT: 'your second dependent',
} as const;

export const BUILDER_AGES = {
  PARENT: 50,
  PARTNER: 48,
  ADULT_DEPENDANT: 25,
  CHILD: 10,
} as const;

/** Model information whose UK model defines is_claimant_or_partner. */
export const UK_METADATA_WITH_CLAIMANT_ROLES: ClaimantRoleModelMetadata = {
  currentCountry: 'uk',
  variables: {
    age: { name: 'age', entity: 'person', valueType: 'float', isInputVariable: true },
    [UK_CLAIMANT_OR_PARTNER_VARIABLE]: {
      name: UK_CLAIMANT_OR_PARTNER_VARIABLE,
      entity: 'person',
      valueType: 'bool',
      isInputVariable: false,
      definitionPeriod: 'year',
    },
  },
};

/** Model information for a UK model that predates is_claimant_or_partner. */
export const UK_METADATA_WITHOUT_CLAIMANT_ROLES: ClaimantRoleModelMetadata = {
  currentCountry: 'uk',
  variables: {
    age: { name: 'age', entity: 'person', valueType: 'float', isInputVariable: true },
  },
};

/** Loaded UK model information for builder UI tests (synthetic; not a published model). */
export function ukBuilderMetadata(claimantRoles: ClaimantRoleModelMetadata): MetadataState {
  return {
    ...metadataReducer(undefined, { type: 'test/init' }),
    currentCountry: 'uk',
    version: 'test-model',
    basicInputs: ['age'],
    variables: {
      ...claimantRoles.variables,
      age: {
        name: 'age',
        entity: 'person',
        label: 'Age',
        valueType: 'float',
        isInputVariable: true,
      },
    },
    entities: {
      person: { key: 'person', plural: 'people', label: 'Person', is_person: true },
      benunit: { key: 'benunit', plural: 'benunits', label: 'Benefit unit' },
      household: { key: 'household', plural: 'households', label: 'Household' },
    },
  };
}

/** Model information loaded for another country than the household's. */
export const US_METADATA_WITH_CLAIMANT_ROLES: ClaimantRoleModelMetadata = {
  ...UK_METADATA_WITH_CLAIMANT_ROLES,
  currentCountry: 'us',
};

/**
 * A lone parent and their adult child, built the way the builder builds them: one child from the
 * child count, whose age is then set to 25.
 */
export function singleParentWithAdultDependant(countryId: CountryId = 'uk'): Household {
  return Household.starter(countryId, ROLE_TEST_YEAR)
    .withBuilderChildCount(ROLE_TEST_YEAR, 1)
    .setPersonVariableAtYear(BUILDER_PEOPLE.YOU, 'age', ROLE_TEST_YEAR, BUILDER_AGES.PARENT)
    .setPersonVariableAtYear(
      BUILDER_PEOPLE.FIRST_DEPENDANT,
      'age',
      ROLE_TEST_YEAR,
      BUILDER_AGES.ADULT_DEPENDANT
    );
}

/** A couple and their adult child, built through the builder's marital status and child count. */
export function coupleWithAdultDependant(countryId: CountryId = 'uk'): Household {
  return singleParentWithAdultDependant(countryId)
    .withBuilderMaritalStatus(ROLE_TEST_YEAR, 'married')
    .setPersonVariableAtYear(BUILDER_PEOPLE.PARTNER, 'age', ROLE_TEST_YEAR, BUILDER_AGES.PARTNER);
}

export const SEPARATE_CLAIMANT = 'other claimant';

/**
 * A saved UK household with two benefit units: "you" (50) alone in one, and a separate claimant
 * alone in another, as a household made outside the builder can be.
 */
export function householdWithSeparateClaimant(
  separateClaimant: { age: number; isClaimantOrPartner?: boolean },
  youIsClaimantOrPartner?: boolean
): Household {
  const person = (
    age: number,
    isClaimantOrPartner: boolean | undefined
  ): AppHouseholdInputPerson =>
    isClaimantOrPartner === undefined
      ? { age: { [ROLE_TEST_YEAR]: age } }
      : {
          age: { [ROLE_TEST_YEAR]: age },
          [UK_CLAIMANT_OR_PARTNER_VARIABLE]: { [ROLE_TEST_YEAR]: isClaimantOrPartner },
        };

  return Household.fromAppInput({
    countryId: 'uk',
    year: ROLE_TEST_YEAR_NUMBER,
    householdData: {
      people: {
        [BUILDER_PEOPLE.YOU]: person(BUILDER_AGES.PARENT, youIsClaimantOrPartner),
        [SEPARATE_CLAIMANT]: person(separateClaimant.age, separateClaimant.isClaimantOrPartner),
      },
      households: {
        'your household': { members: [BUILDER_PEOPLE.YOU, SEPARATE_CLAIMANT] },
      },
      benunits: {
        'your benefit unit': { members: [BUILDER_PEOPLE.YOU] },
        'their benefit unit': { members: [SEPARATE_CLAIMANT] },
      },
    },
  });
}

export const CREATED_HOUSEHOLD_ID = 'created-uk-household';

/** The v1 API's response to a household creation request. */
export function mockCreatedHouseholdResponse(): Response {
  return new Response(JSON.stringify({ result: { household_id: CREATED_HOUSEHOLD_ID } }), {
    status: 200,
  });
}
