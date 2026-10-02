import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { Household, UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import {
  BUILDER_PEOPLE,
  ROLE_TEST_YEAR,
  UK_METADATA_WITHOUT_CLAIMANT_ROLES,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';
import { withSupportedBuilderClaimantRoles } from '@/utils/builderClaimantRoles';

type BuilderAction =
  | { kind: 'marital'; status: 'single' | 'married' }
  | { kind: 'children'; count: number }
  | { kind: 'age'; personIndex: number; age: number };

const ageArbitrary = fc.integer({ min: 0, max: 100 });

const builderActionArbitrary: fc.Arbitrary<BuilderAction> = fc.oneof(
  fc.record({
    kind: fc.constant('marital' as const),
    status: fc.constantFrom('single' as const, 'married' as const),
  }),
  fc.record({ kind: fc.constant('children' as const), count: fc.integer({ min: 0, max: 5 }) }),
  fc.record({
    kind: fc.constant('age' as const),
    personIndex: fc.nat({ max: 7 }),
    age: ageArbitrary,
  })
);

function personAt(household: Household, personIndex: number): string {
  const people = household.getSortedPersonNames();
  return people[personIndex % people.length];
}

function applyBuilderAction(household: Household, action: BuilderAction): Household {
  switch (action.kind) {
    case 'marital':
      return household.withBuilderMaritalStatus(ROLE_TEST_YEAR, action.status);
    case 'children':
      return household.withBuilderChildCount(ROLE_TEST_YEAR, action.count);
    case 'age':
      return household.setPersonVariableAtYear(
        personAt(household, action.personIndex),
        'age',
        ROLE_TEST_YEAR,
        action.age
      );
  }
}

/** Any household a user can reach through the builder's controls, in either builder country. */
const builderHouseholdArbitrary = fc
  .record({
    countryId: fc.constantFrom('uk' as const, 'us' as const),
    actions: fc.array(builderActionArbitrary, { maxLength: 12 }),
  })
  .map(({ countryId, actions }) =>
    actions.reduce(applyBuilderAction, Household.starter(countryId, ROLE_TEST_YEAR))
  );

const ukBuilderHouseholdArbitrary = builderHouseholdArbitrary.filter(
  (household) => household.countryId === 'uk'
);

describe('household builder roles properties', () => {
  test('the partner is exactly the explicit partner, whatever anyone’s age', () => {
    fc.assert(
      fc.property(builderHouseholdArbitrary, (household) => {
        const composition = household.deriveBuilderComposition(ROLE_TEST_YEAR);
        const hasPartner = household.personNames.includes(BUILDER_PEOPLE.PARTNER);

        expect(composition.partnerKey).toBe(hasPartner ? BUILDER_PEOPLE.PARTNER : null);
        expect(composition.maritalStatus).toBe(hasPartner ? 'married' : 'single');
      })
    );
  });

  test('changing a member’s age never changes who the partner is', () => {
    fc.assert(
      fc.property(
        builderHouseholdArbitrary,
        fc.nat({ max: 7 }),
        ageArbitrary,
        (household, personIndex, age) => {
          const aged = household.setPersonVariableAtYear(
            personAt(household, personIndex),
            'age',
            ROLE_TEST_YEAR,
            age
          );

          expect(aged.getBuilderPartnerKey(ROLE_TEST_YEAR)).toBe(
            household.getBuilderPartnerKey(ROLE_TEST_YEAR)
          );
        }
      )
    );
  });

  test('UK roles name "you" and the explicit partner, at most two people, and no one else', () => {
    fc.assert(
      fc.property(ukBuilderHouseholdArbitrary, (household) => {
        const roles = household.getBuilderClaimantRoles(ROLE_TEST_YEAR);
        const { partnerKey } = household.deriveBuilderComposition(ROLE_TEST_YEAR);
        const expectedClaimants = [BUILDER_PEOPLE.YOU, ...(partnerKey ? [partnerKey] : [])];

        expect(Object.keys(roles ?? {}).sort()).toEqual([...household.personNames].sort());
        expect(
          Object.entries(roles ?? {})
            .filter(([, isClaimantOrPartner]) => isClaimantOrPartner)
            .map(([personName]) => personName)
            .sort()
        ).toEqual(expectedClaimants.sort());
      })
    );
  });

  test('US builder households get no UK roles', () => {
    fc.assert(
      fc.property(
        builderHouseholdArbitrary.filter((household) => household.countryId === 'us'),
        (household) => {
          expect(household.getBuilderClaimantRoles(ROLE_TEST_YEAR)).toBeNull();
          expect(household.withBuilderClaimantRoles(ROLE_TEST_YEAR)).toBe(household);
        }
      )
    );
  });

  test('recording roles is idempotent and survives the saved-household round trip', () => {
    fc.assert(
      fc.property(ukBuilderHouseholdArbitrary, (household) => {
        const withRoles = household.withBuilderClaimantRoles(ROLE_TEST_YEAR);
        const payload = withRoles.toV1CreationPayload();
        const saved = Household.fromV1CreationPayload(payload);

        expect(withRoles.withBuilderClaimantRoles(ROLE_TEST_YEAR).isEqual(withRoles)).toBe(true);
        expect(saved.householdData).toEqual(withRoles.householdData);
        expect(saved.getBuilderClaimantRoles(ROLE_TEST_YEAR)).toEqual(
          withRoles.getBuilderClaimantRoles(ROLE_TEST_YEAR)
        );
      })
    );
  });

  test('the v1 payload and the Python package situation carry the same roles', () => {
    fc.assert(
      fc.property(ukBuilderHouseholdArbitrary, (household) => {
        const withRoles = household.withBuilderClaimantRoles(ROLE_TEST_YEAR);
        const v1People = withRoles.toV1CreationPayload().data.people;
        const pythonPeople = withRoles.toPythonPackage().people;

        for (const personName of withRoles.personNames) {
          expect(pythonPeople[personName][UK_CLAIMANT_OR_PARTNER_VARIABLE]).toEqual(
            v1People[personName][UK_CLAIMANT_OR_PARTNER_VARIABLE]
          );
        }
      })
    );
  });

  test('without the variable in the model information, every household saves unchanged', () => {
    fc.assert(
      fc.property(builderHouseholdArbitrary, (household) => {
        expect(
          withSupportedBuilderClaimantRoles(
            household,
            UK_METADATA_WITHOUT_CLAIMANT_ROLES,
            ROLE_TEST_YEAR
          )
        ).toBe(household);
      })
    );
  });

  test('setting the child count gives that many children and keeps every adult and the partner', () => {
    fc.assert(
      fc.property(builderHouseholdArbitrary, fc.integer({ min: 0, max: 5 }), (household, count) => {
        const adults = household.getAdults(ROLE_TEST_YEAR).map(({ name }) => name);
        const updated = household.withBuilderChildCount(ROLE_TEST_YEAR, count);
        const composition = updated.deriveBuilderComposition(ROLE_TEST_YEAR);

        expect(composition.numChildren).toBe(count);
        expect(updated.personNames).toEqual(expect.arrayContaining(adults));
        expect(composition.partnerKey).toBe(household.getBuilderPartnerKey(ROLE_TEST_YEAR));
      })
    );
  });
});
