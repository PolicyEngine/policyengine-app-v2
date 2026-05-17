import { describe, expect, it } from 'vitest';
import type { USHouseholdDraft } from 'policyengine-household-wizard';
import singleAdult from '../../../fixtures/usHouseholdDrafts/single-adult.json' with { type: 'json' };
import marriedAdults from '../../../fixtures/usHouseholdDrafts/married-adults.json' with { type: 'json' };
import adultWithChild from '../../../fixtures/usHouseholdDrafts/adult-with-child.json' with { type: 'json' };
import disabledPerson from '../../../fixtures/usHouseholdDrafts/disabled-person.json' with { type: 'json' };
import student from '../../../fixtures/usHouseholdDrafts/student.json' with { type: 'json' };
import countyCase from '../../../fixtures/usHouseholdDrafts/county-case.json' with { type: 'json' };

import { householdFromUSDraft } from '@/models/household/fromUSDraft';

interface Fixture {
  name: string;
  draft: USHouseholdDraft;
}

const FIXTURES: Fixture[] = [
  singleAdult as Fixture,
  marriedAdults as Fixture,
  adultWithChild as Fixture,
  disabledPerson as Fixture,
  student as Fixture,
  countyCase as Fixture,
];

describe('householdFromUSDraft', () => {
  it.each(FIXTURES)(
    '$name: produces a Household with the expected country, year, and person count',
    ({ draft }) => {
      const household = householdFromUSDraft(draft);
      expect(household.countryId).toBe('us');
      expect(household.year).toBe(draft.year);
      expect(household.personCount).toBe(draft.people.length);
    },
  );

  it.each(FIXTURES)(
    '$name: keeps adult and child counts at the draft year by age threshold',
    ({ draft }) => {
      const household = householdFromUSDraft(draft);
      const year = String(draft.year);
      // app-v2 partitions people by age (>=18 is an adult); the wizard's
      // `kind` is a UI hint, not a tax-unit role. Use age to compare.
      const expectedAdults = draft.people.filter(
        (person) => (person.age ?? 0) >= 18,
      ).length;
      const expectedChildren = draft.people.filter(
        (person) => (person.age ?? 0) < 18,
      ).length;
      expect(household.getAdultCount(year)).toBe(expectedAdults);
      expect(household.getChildCount(year)).toBe(expectedChildren);
    },
  );

  it.each(FIXTURES)('$name: configures the household group with state and county', ({ draft }) => {
    const household = householdFromUSDraft(draft);
    const year = String(draft.year);
    const householdGroupName = household.getPreferredGroupName('households');
    expect(householdGroupName).toBeDefined();
    expect(
      household.getGroupVariableAtYear('households', householdGroupName!, 'state_name', year),
    ).toBe(draft.state);
    if (draft.county) {
      expect(
        household.getGroupVariableAtYear('households', householdGroupName!, 'county', year),
      ).toBe(draft.county);
    }
  });

  it.each(FIXTURES)('$name: round-trips through the V1 creation envelope', ({ draft }) => {
    const household = householdFromUSDraft(draft);
    const envelope = household.toV1CreationPayload();
    expect(envelope.country_id).toBe('us');
    expect(envelope.data.households).toBeDefined();
    expect(envelope.data.people).toBeDefined();
    expect(Object.keys(envelope.data.people).length).toBe(draft.people.length);
  });

  it('throws when the draft is missing a state', () => {
    expect(() =>
      householdFromUSDraft({
        ...(singleAdult as Fixture).draft,
        state: null,
      }),
    ).toThrowError(/state/);
  });

  it('throws when the draft has no people', () => {
    expect(() =>
      householdFromUSDraft({
        ...(singleAdult as Fixture).draft,
        people: [],
      }),
    ).toThrowError(/at least one person/);
  });

  it('writes the supplied label onto the Household', () => {
    const household = householdFromUSDraft((singleAdult as Fixture).draft, {
      label: 'Test household',
    });
    expect(household.label).toBe('Test household');
  });

  it('populates a marital unit when the draft is married', () => {
    const household = householdFromUSDraft((marriedAdults as Fixture).draft);
    const maritalUnits = household.getGroupCollection('maritalUnits');
    expect(maritalUnits).toBeDefined();
    const groups = Object.values(maritalUnits!);
    expect(groups.length).toBeGreaterThan(0);
    expect(groups[0].members).toHaveLength(2);
  });
});
