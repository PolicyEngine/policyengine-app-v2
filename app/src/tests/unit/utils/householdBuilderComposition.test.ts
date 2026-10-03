import { describe, expect, test } from 'vitest';
import { Household, UK_CLAIMANT_OR_PARTNER_VARIABLE } from '@/models/Household';
import {
  BUILDER_AGES,
  BUILDER_PEOPLE,
  coupleWithAdultDependant,
  householdWithSeparateClaimant,
  ROLE_TEST_YEAR,
  SEPARATE_CLAIMANT,
  singleParentWithAdultDependant,
} from '@/tests/fixtures/models/builderClaimantRolesMocks';

const YEAR = '2026';

describe('Household builder composition methods', () => {
  test('derives partner and child composition without relying on canonical labels', () => {
    const household = Household.empty('us', YEAR)
      .addAdult('alex', 34, { employment_income: 0 })
      .addAdult('sam', 33, { employment_income: 0 })
      .setMaritalStatus('alex', 'sam')
      .addChild('morgan', 12, ['alex', 'sam'], { employment_income: 0 });

    const composition = household.deriveBuilderComposition(YEAR);

    expect(composition.primaryPersonKey).toBe('alex');
    expect(composition.partnerKey).toBe('sam');
    expect(composition.maritalStatus).toBe('married');
    expect(composition.childKeys).toEqual(['morgan']);
    expect(composition.numChildren).toBe(1);
  });

  test('removes the actual partner when toggling back to single', () => {
    const household = Household.empty('us', YEAR)
      .addAdult('alex', 34, { employment_income: 0 })
      .addAdult('sam', 33, { employment_income: 0 })
      .setMaritalStatus('alex', 'sam');

    const updatedHousehold = household.withBuilderMaritalStatus(YEAR, 'single');
    const updatedHouseholdInput = updatedHousehold.toAppInput();

    expect(updatedHouseholdInput.householdData.people.alex).toBeDefined();
    expect(updatedHouseholdInput.householdData.people.sam).toBeUndefined();
    expect(
      updatedHouseholdInput.householdData.maritalUnits?.['your marital unit']?.members
    ).toEqual(['alex']);
  });

  test('preserves existing children when increasing the child count', () => {
    const household = Household.empty('us', YEAR)
      .addAdult('alex', 34, { employment_income: 0 })
      .addChild('morgan', 12, ['alex'], { employment_income: 0 });

    const updatedHousehold = household.withBuilderChildCount(YEAR, 2);
    const people = Object.keys(updatedHousehold.toAppInput().householdData.people);

    expect(people).toContain('morgan');
    expect(people).toContain('your second dependent');
    expect(updatedHousehold.deriveBuilderComposition(YEAR).numChildren).toBe(2);
  });

  describe.each(['uk', 'us'] as const)('given a %s dependant aged 25', (countryId) => {
    test('given a single parent then the adult dependant is not read as a partner', () => {
      const composition =
        singleParentWithAdultDependant(countryId).deriveBuilderComposition(ROLE_TEST_YEAR);

      expect(composition.primaryPersonKey).toBe(BUILDER_PEOPLE.YOU);
      expect(composition.partnerKey).toBeNull();
      expect(composition.maritalStatus).toBe('single');
    });

    test('given a single parent then the adult dependant stays out of the child count', () => {
      const composition =
        singleParentWithAdultDependant(countryId).deriveBuilderComposition(ROLE_TEST_YEAR);

      expect(composition.childKeys).toEqual([]);
      expect(composition.numChildren).toBe(0);
    });

    test('given a couple then the explicit partner stays the partner', () => {
      const household = coupleWithAdultDependant(countryId);
      const composition = household.deriveBuilderComposition(ROLE_TEST_YEAR);

      expect(composition.partnerKey).toBe(BUILDER_PEOPLE.PARTNER);
      expect(composition.maritalStatus).toBe('married');
      expect(household.personNames).toContain(BUILDER_PEOPLE.FIRST_DEPENDANT);
    });

    test('given a single parent chooses single then the adult dependant is kept', () => {
      const household = singleParentWithAdultDependant(countryId).withBuilderMaritalStatus(
        ROLE_TEST_YEAR,
        'single'
      );

      expect(household.personNames).toContain(BUILDER_PEOPLE.FIRST_DEPENDANT);
    });

    test('given a couple chooses single then only the partner is removed', () => {
      const household = coupleWithAdultDependant(countryId).withBuilderMaritalStatus(
        ROLE_TEST_YEAR,
        'single'
      );

      expect(household.getSortedPersonNames()).toEqual([
        BUILDER_PEOPLE.YOU,
        BUILDER_PEOPLE.FIRST_DEPENDANT,
      ]);
    });

    test('given a child is added then it is numbered after the adult dependant', () => {
      const household = singleParentWithAdultDependant(countryId).withBuilderChildCount(
        ROLE_TEST_YEAR,
        1
      );

      expect(household.getSortedPersonNames()).toEqual([
        BUILDER_PEOPLE.YOU,
        BUILDER_PEOPLE.FIRST_DEPENDANT,
        BUILDER_PEOPLE.SECOND_DEPENDANT,
      ]);
      expect(
        household.getPersonVariableAtYear(BUILDER_PEOPLE.FIRST_DEPENDANT, 'age', ROLE_TEST_YEAR)
      ).toBe(BUILDER_AGES.ADULT_DEPENDANT);
      expect(household.deriveBuilderComposition(ROLE_TEST_YEAR).numChildren).toBe(1);
    });
  });

  test('given another adult without an explicit partner role then the household is single', () => {
    const household = Household.empty('uk', ROLE_TEST_YEAR)
      .addAdult(BUILDER_PEOPLE.YOU, BUILDER_AGES.PARENT)
      .addAdult('lodger', BUILDER_AGES.PARTNER);

    expect(household.getBuilderPartnerKey(ROLE_TEST_YEAR)).toBeNull();
  });

  test('given "you" and another member are both flagged as claimant or partner then that member is the partner', () => {
    const household = Household.empty('uk', ROLE_TEST_YEAR)
      .addAdult(BUILDER_PEOPLE.YOU, BUILDER_AGES.PARENT)
      .addAdult('alex', BUILDER_AGES.PARTNER)
      .setPersonVariableAtYear(
        BUILDER_PEOPLE.YOU,
        UK_CLAIMANT_OR_PARTNER_VARIABLE,
        ROLE_TEST_YEAR,
        true
      )
      .setPersonVariableAtYear('alex', UK_CLAIMANT_OR_PARTNER_VARIABLE, ROLE_TEST_YEAR, true);

    expect(household.deriveBuilderComposition(ROLE_TEST_YEAR)).toEqual(
      expect.objectContaining({ partnerKey: 'alex', maritalStatus: 'married' })
    );
  });

  test.each([
    ['flagged false', false],
    ['not flagged', undefined],
  ])(
    'given "you" are %s then flagged members of the unit are not your partner and "single" keeps them',
    (_case, youIsClaimantOrPartner) => {
      const flagged = (household: Household, personKey: string, value: boolean | undefined) =>
        value === undefined
          ? household
          : household.setPersonVariableAtYear(
              personKey,
              UK_CLAIMANT_OR_PARTNER_VARIABLE,
              ROLE_TEST_YEAR,
              value
            );
      const household = flagged(
        Household.empty('uk', ROLE_TEST_YEAR)
          .addAdult(BUILDER_PEOPLE.YOU, 1)
          .addAdult('mum', 17)
          .addAdult('dad', 17)
          .setPersonVariableAtYear('mum', UK_CLAIMANT_OR_PARTNER_VARIABLE, ROLE_TEST_YEAR, true)
          .setPersonVariableAtYear('dad', UK_CLAIMANT_OR_PARTNER_VARIABLE, ROLE_TEST_YEAR, true),
        BUILDER_PEOPLE.YOU,
        youIsClaimantOrPartner
      );

      expect(household.getBuilderPartnerKey(ROLE_TEST_YEAR)).toBeNull();
      expect(household.withBuilderMaritalStatus(ROLE_TEST_YEAR, 'single').personNames).toEqual(
        expect.arrayContaining(['mum', 'dad'])
      );
    }
  );

  test('given a member flagged for another year only then that member is not the partner', () => {
    const household = Household.empty('uk', ROLE_TEST_YEAR)
      .addAdult(BUILDER_PEOPLE.YOU, BUILDER_AGES.PARENT)
      .addAdult('alex', BUILDER_AGES.PARTNER)
      .setPersonVariableAtYear('alex', UK_CLAIMANT_OR_PARTNER_VARIABLE, '2025', true);

    expect(household.getBuilderPartnerKey(ROLE_TEST_YEAR)).toBeNull();
  });

  describe('given a flagged claimant in another benefit unit', () => {
    const household = () =>
      householdWithSeparateClaimant({ age: 17, isClaimantOrPartner: true }, true);

    test('then they are not read as the partner', () => {
      expect(household().deriveBuilderComposition(ROLE_TEST_YEAR)).toEqual(
        expect.objectContaining({ partnerKey: null, maritalStatus: 'single' })
      );
    });

    test('then choosing single keeps them and their benefit unit', () => {
      const updated = household().withBuilderMaritalStatus(ROLE_TEST_YEAR, 'single');

      expect(updated.personNames).toContain(SEPARATE_CLAIMANT);
      expect(updated.getGroupMembers('benunits', 'their benefit unit')).toEqual([
        SEPARATE_CLAIMANT,
      ]);
    });

    test('then choosing married adds a partner beside "you" and keeps them', () => {
      const updated = household().withBuilderMaritalStatus(ROLE_TEST_YEAR, 'married');

      expect(updated.getBuilderPartnerKey(ROLE_TEST_YEAR)).toBe(BUILDER_PEOPLE.PARTNER);
      expect(updated.personNames).toContain(SEPARATE_CLAIMANT);
    });

    test('then the child count does not count them and setting it to zero keeps them', () => {
      const updated = household().withBuilderChildCount(ROLE_TEST_YEAR, 0);

      expect(household().deriveBuilderComposition(ROLE_TEST_YEAR).numChildren).toBe(0);
      expect(updated.personNames).toContain(SEPARATE_CLAIMANT);
      expect(updated.getGroupMembers('benunits', 'their benefit unit')).toEqual([
        SEPARATE_CLAIMANT,
      ]);
    });

    test.each([
      ['their unit is listed second', false],
      ['their unit is listed first', true],
    ])('then a new partner and child join the benefit unit of "you" when %s', (_case, first) => {
      const updated = householdWithSeparateClaimant(
        { age: 17, isClaimantOrPartner: true },
        true,
        first
      )
        .withBuilderMaritalStatus(ROLE_TEST_YEAR, 'married')
        .withBuilderChildCount(ROLE_TEST_YEAR, 1);

      expect(updated.getGroupMembers('benunits', 'your benefit unit')).toEqual([
        BUILDER_PEOPLE.YOU,
        BUILDER_PEOPLE.PARTNER,
        BUILDER_PEOPLE.FIRST_DEPENDANT,
      ]);
      expect(updated.getGroupMembers('benunits', 'their benefit unit')).toEqual([
        SEPARATE_CLAIMANT,
      ]);
    });
  });

  test('given a US child in another tax unit then the child count leaves them alone', () => {
    const base = Household.starter('us', ROLE_TEST_YEAR).addChild('nephew', 16);
    const data = base.householdData;
    data.taxUnits = {
      'your tax unit': { members: [BUILDER_PEOPLE.YOU] },
      "nephew's tax unit": { members: ['nephew'] },
    };
    const household = Household.fromAppInput({ ...base.toAppInput(), householdData: data });

    expect(household.deriveBuilderComposition(ROLE_TEST_YEAR).numChildren).toBe(0);
    expect(household.withBuilderChildCount(ROLE_TEST_YEAR, 0).personNames).toContain('nephew');
  });

  test('given a dependant ordinal is skipped then a new child is numbered after the highest one', () => {
    const household = Household.starter('uk', ROLE_TEST_YEAR)
      .withBuilderChildCount(ROLE_TEST_YEAR, 2)
      .setPersonVariableAtYear(
        BUILDER_PEOPLE.SECOND_DEPENDANT,
        'age',
        ROLE_TEST_YEAR,
        BUILDER_AGES.ADULT_DEPENDANT
      )
      .withBuilderChildCount(ROLE_TEST_YEAR, 0)
      .withBuilderChildCount(ROLE_TEST_YEAR, 1);

    expect(household.getSortedPersonNames()).toEqual([
      BUILDER_PEOPLE.YOU,
      BUILDER_PEOPLE.SECOND_DEPENDANT,
      'your third dependent',
    ]);
  });
});
