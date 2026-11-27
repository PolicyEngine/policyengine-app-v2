import { describe, expect, test } from 'vitest';
import { UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import {
  BUILDER_PEOPLE,
  ROLE_TEST_YEAR,
  singleParentWithAdultDependant,
  UK_METADATA_WITH_CLAIMANT_ROLES,
  UK_METADATA_WITHOUT_CLAIMANT_ROLES,
  ukBuilderMetadata,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';
import { householdAsSent } from '@/utils/householdAsSent';

describe('householdAsSent', () => {
  test('given a UK lone parent and their adult child then the parent is sent as the claimant and the child not', () => {
    // When
    const sent = householdAsSent(
      singleParentWithAdultDependant(),
      ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES),
      ROLE_TEST_YEAR
    );

    // Then
    expect(sent.people[BUILDER_PEOPLE.YOU][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
      [ROLE_TEST_YEAR]: true,
    });
    expect(sent.people[BUILDER_PEOPLE.FIRST_DEPENDANT][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
      [ROLE_TEST_YEAR]: false,
    });
  });

  test('given a UK model without the roles then a household that carries them is sent without them', () => {
    // Given
    const withRoles = householdAsSent(
      singleParentWithAdultDependant(),
      ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES)
    );

    // When
    const sent = householdAsSent(withRoles, ukBuilderMetadata(UK_METADATA_WITHOUT_CLAIMANT_ROLES));

    // Then
    expect(sent.people[BUILDER_PEOPLE.YOU][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toBeUndefined();
  });
});
