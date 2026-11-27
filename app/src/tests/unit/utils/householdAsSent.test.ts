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
import { householdAsSent, householdCreationPayload } from '@/utils/householdAsSent';

describe('householdCreationPayload', () => {
  test('given a UK lone parent and their adult child then the payload names the parent claimant and the child not', () => {
    // When
    const payload = householdCreationPayload(
      singleParentWithAdultDependant(),
      ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES),
      ROLE_TEST_YEAR
    );

    // Then
    const people = payload.data.people as Record<string, Record<string, unknown>>;
    expect(people[BUILDER_PEOPLE.YOU][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
      [ROLE_TEST_YEAR]: true,
    });
    expect(people[BUILDER_PEOPLE.FIRST_DEPENDANT][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual({
      [ROLE_TEST_YEAR]: false,
    });
  });

  test('given a household then its payload is the payload of the household as sent', () => {
    // Given
    const household = singleParentWithAdultDependant();
    const metadata = ukBuilderMetadata(UK_METADATA_WITH_CLAIMANT_ROLES);

    // Then
    expect(householdCreationPayload(household, metadata, ROLE_TEST_YEAR)).toEqual(
      householdAsSent(household, metadata, ROLE_TEST_YEAR).toV1CreationPayload()
    );
  });
});

describe('householdAsSent', () => {
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
