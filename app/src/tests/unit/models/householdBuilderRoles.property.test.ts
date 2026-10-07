import fc from 'fast-check';
import { describe, expect, test } from 'vitest';
import { Household, UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import {
  BUILDER_PEOPLE,
  ROLE_TEST_YEAR,
  SEPARATE_CLAIMANT,
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

const optionalRoleArbitrary = fc.option(fc.boolean(), { nil: undefined });

/** Adds a claimant in a benefit unit of their own, as a household saved outside the builder can have. */
function withSeparateClaimant(
  household: Household,
  age: number,
  isClaimantOrPartner: boolean | undefined,
  separateUnitFirst: boolean
): Household {
  const data = household.householdData;
  data.people[SEPARATE_CLAIMANT] = {
    age: { [ROLE_TEST_YEAR]: age },
    ...(isClaimantOrPartner === undefined
      ? {}
      : { [UK_CLAIMANT_OR_PARTNER_VARIABLE]: { [ROLE_TEST_YEAR]: isClaimantOrPartner } }),
  };
  const theirUnit = { 'their benefit unit': { members: [SEPARATE_CLAIMANT] } };
  data.benunits = separateUnitFirst
    ? { ...theirUnit, ...data.benunits }
    : { ...data.benunits, ...theirUnit };
  const [householdName, householdGroup] = Object.entries(data.households ?? {})[0];
  data.households = {
    [householdName]: { ...householdGroup, members: [...householdGroup.members, SEPARATE_CLAIMANT] },
  };
  return Household.fromAppInput({ ...household.toAppInput(), householdData: data });
}

/** UK builder households beside a separate claimant, any of whom may already carry a role. */
const multiUnitHouseholdArbitrary = fc
  .record({
    household: ukBuilderHouseholdArbitrary,
    recordRoles: fc.boolean(),
    age: ageArbitrary,
    isClaimantOrPartner: optionalRoleArbitrary,
    separateUnitFirst: fc.boolean(),
  })
  .map(({ household, recordRoles, age, isClaimantOrPartner, separateUnitFirst }) =>
    withSeparateClaimant(
      recordRoles ? household.withBuilderClaimantRoles(ROLE_TEST_YEAR) : household,
      age,
      isClaimantOrPartner,
      separateUnitFirst
    )
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

  test('without the variable in the model information, no household sends a role', () => {
    fc.assert(
      fc.property(
        fc.oneof(ukBuilderHouseholdArbitrary, multiUnitHouseholdArbitrary),
        fc.boolean(),
        (household, recordRoles) => {
          const saved = withSupportedBuilderClaimantRoles(
            recordRoles ? household.withBuilderClaimantRoles(ROLE_TEST_YEAR) : household,
            UK_METADATA_WITHOUT_CLAIMANT_ROLES,
            ROLE_TEST_YEAR
          );

          expect(JSON.stringify(saved.toV1CreationPayload())).not.toContain(
            UK_CLAIMANT_OR_PARTNER_VARIABLE
          );
        }
      )
    );
  });

  test('a claimant in another benefit unit is never the partner, and choosing single keeps them', () => {
    fc.assert(
      fc.property(multiUnitHouseholdArbitrary, (household) => {
        const single = household.withBuilderMaritalStatus(ROLE_TEST_YEAR, 'single');

        expect(household.getBuilderPartnerKey(ROLE_TEST_YEAR)).not.toBe(SEPARATE_CLAIMANT);
        expect(single.personNames).toContain(SEPARATE_CLAIMANT);
      })
    );
  });

  test('builder edits never touch another benefit unit, and new members join the unit of "you"', () => {
    fc.assert(
      fc.property(
        multiUnitHouseholdArbitrary,
        fc.array(builderActionArbitrary, { maxLength: 12 }),
        (household, actions) => {
          const edited = actions.reduce(applyBuilderAction, household);
          const yourUnit = edited.getGroupMembers('benunits', 'your benefit unit');

          expect(edited.getGroupMembers('benunits', 'their benefit unit')).toEqual([
            SEPARATE_CLAIMANT,
          ]);
          expect([...yourUnit, SEPARATE_CLAIMANT].sort()).toEqual([...edited.personNames].sort());
          expect(edited.deriveBuilderComposition(ROLE_TEST_YEAR).childKeys).not.toContain(
            SEPARATE_CLAIMANT
          );
        }
      )
    );
  });

  test('a household with more than one benefit unit gets no generated roles', () => {
    fc.assert(
      fc.property(multiUnitHouseholdArbitrary, (household) => {
        expect(household.getBuilderClaimantRoles(ROLE_TEST_YEAR)).toBeNull();
        expect(household.withBuilderClaimantRoles(ROLE_TEST_YEAR)).toBe(household);
      })
    );
  });

  test('roles recorded, then edited in the builder, then recorded again match the composition', () => {
    fc.assert(
      fc.property(
        ukBuilderHouseholdArbitrary,
        fc.array(builderActionArbitrary, { maxLength: 12 }),
        (household, laterActions) => {
          const edited = laterActions
            .reduce(applyBuilderAction, household.withBuilderClaimantRoles(ROLE_TEST_YEAR))
            .withBuilderClaimantRoles(ROLE_TEST_YEAR);
          const recorded = Object.fromEntries(
            edited.personNames.map((personName) => [
              personName,
              edited.getPersonVariableAtYear(
                personName,
                UK_CLAIMANT_OR_PARTNER_VARIABLE,
                ROLE_TEST_YEAR
              ),
            ])
          );

          expect(recorded).toEqual(edited.getBuilderClaimantRoles(ROLE_TEST_YEAR));
        }
      )
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
