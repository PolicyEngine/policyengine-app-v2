import type { CountryId } from '@/libs/countries';
import { Household, UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
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
