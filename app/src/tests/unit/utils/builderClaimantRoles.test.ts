import { describe, expect, test } from 'vitest';
import { UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import {
  BUILDER_PEOPLE,
  householdWithSeparateClaimant,
  ROLE_TEST_YEAR,
  singleParentWithAdultDependant,
  UK_METADATA_LOADING,
  UK_METADATA_WITH_CLAIMANT_ROLES,
  UK_METADATA_WITHOUT_CLAIMANT_ROLES,
  US_METADATA_WITH_CLAIMANT_ROLES,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';
import { withSupportedBuilderClaimantRoles } from '@/utils/builderClaimantRoles';

describe('withSupportedBuilderClaimantRoles', () => {
  test('given the UK model defines the variable then a lone parent with an adult dependant is sent as a single claimant', () => {
    const household = withSupportedBuilderClaimantRoles(
      singleParentWithAdultDependant(),
      UK_METADATA_WITH_CLAIMANT_ROLES,
      ROLE_TEST_YEAR
    );

    expect(household.toV1CreationPayload().data.people).toEqual(
      expect.objectContaining({
        [BUILDER_PEOPLE.YOU]: expect.objectContaining({
          [UK_CLAIMANT_OR_PARTNER_VARIABLE]: { [ROLE_TEST_YEAR]: true },
        }),
        [BUILDER_PEOPLE.FIRST_DEPENDANT]: expect.objectContaining({
          [UK_CLAIMANT_OR_PARTNER_VARIABLE]: { [ROLE_TEST_YEAR]: false },
        }),
      })
    );
  });

  test('given no year is passed then the household year is used', () => {
    const household = withSupportedBuilderClaimantRoles(
      singleParentWithAdultDependant(),
      UK_METADATA_WITH_CLAIMANT_ROLES
    );

    expect(
      household.getPersonVariableAtYear(
        BUILDER_PEOPLE.YOU,
        UK_CLAIMANT_OR_PARTNER_VARIABLE,
        ROLE_TEST_YEAR
      )
    ).toBe(true);
  });

  test.each([
    ['the UK model predates the variable', UK_METADATA_WITHOUT_CLAIMANT_ROLES],
    ['model information is for another country', US_METADATA_WITH_CLAIMANT_ROLES],
    ['model information has not loaded', undefined],
  ])('given %s then the household is saved unchanged', (_case, metadata) => {
    const household = singleParentWithAdultDependant();

    const result = withSupportedBuilderClaimantRoles(household, metadata, ROLE_TEST_YEAR);

    expect(result).toBe(household);
    expect(JSON.stringify(result.toV1CreationPayload())).not.toContain(
      UK_CLAIMANT_OR_PARTNER_VARIABLE
    );
  });

  test('given the UK model predates the variable then roles a household already carries are removed', () => {
    const household = singleParentWithAdultDependant().withBuilderClaimantRoles(ROLE_TEST_YEAR);

    const result = withSupportedBuilderClaimantRoles(
      household,
      UK_METADATA_WITHOUT_CLAIMANT_ROLES,
      ROLE_TEST_YEAR
    );

    expect(JSON.stringify(result.toV1CreationPayload())).not.toContain(
      UK_CLAIMANT_OR_PARTNER_VARIABLE
    );
    expect(result.householdData).toEqual(singleParentWithAdultDependant().householdData);
  });

  test('given UK model information is still loading then roles a household carries are kept', () => {
    const household = singleParentWithAdultDependant().withBuilderClaimantRoles(ROLE_TEST_YEAR);

    expect(withSupportedBuilderClaimantRoles(household, UK_METADATA_LOADING, ROLE_TEST_YEAR)).toBe(
      household
    );
  });

  test('given model information for another country then roles a household carries are kept', () => {
    const household = singleParentWithAdultDependant().withBuilderClaimantRoles(ROLE_TEST_YEAR);

    expect(
      withSupportedBuilderClaimantRoles(household, US_METADATA_WITH_CLAIMANT_ROLES, ROLE_TEST_YEAR)
    ).toBe(household);
  });

  test('given a household with two benefit units then no roles are added', () => {
    const household = householdWithSeparateClaimant({ age: 40 });

    expect(
      withSupportedBuilderClaimantRoles(household, UK_METADATA_WITH_CLAIMANT_ROLES, ROLE_TEST_YEAR)
    ).toBe(household);
  });

  test('given a US household then no UK roles are added', () => {
    const household = singleParentWithAdultDependant('us');

    expect(
      withSupportedBuilderClaimantRoles(household, US_METADATA_WITH_CLAIMANT_ROLES, ROLE_TEST_YEAR)
    ).toBe(household);
  });
});
