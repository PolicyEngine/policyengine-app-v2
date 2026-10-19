import { describe, expect, test } from 'vitest';
import {
  describeHousehold,
  householdPlace,
  householdState,
} from '@/libs/flagship/householdDescription';
import { Household } from '@/models/Household';
import type { VariableInfo } from '@/utils/VariableResolver';

const YEAR = '2026';

const UK_VARIABLES = {
  region: {
    name: 'region',
    label: 'region',
    possibleValues: [
      { value: 'LONDON', label: 'London' },
      { value: 'SCOTLAND', label: 'Scotland' },
    ],
  },
} as unknown as Record<string, VariableInfo>;

const withHouseholdInput = (household: Household, variable: string, value: string) =>
  household.setGroupVariableAtYear('households', 'your household', variable, YEAR, value);

describe('describeHousehold', () => {
  test('given a US household in a state then the state reads by its name', () => {
    const household = withHouseholdInput(
      Household.starter('us', YEAR).withBuilderMaritalStatus(YEAR, 'married'),
      'state_name',
      'NY'
    );

    expect(describeHousehold(household, YEAR, 'us')).toBe('Married · no children · New York');
    expect(householdState(household, YEAR, 'us')).toBe('NY');
  });

  test("given a UK household in a region then the region reads by the model's label", () => {
    const household = withHouseholdInput(
      Household.starter('uk', YEAR).withBuilderChildCount(YEAR, 2),
      'region',
      'SCOTLAND'
    );

    expect(describeHousehold(household, YEAR, 'uk', UK_VARIABLES)).toBe(
      'Single · 2 children · Scotland'
    );
    // No US state filter applies to a UK household.
    expect(householdState(household, YEAR, 'uk')).toBeNull();
  });

  test('given a UK household with no region chosen then no place shows', () => {
    expect(describeHousehold(Household.starter('uk', YEAR), YEAR, 'uk', UK_VARIABLES)).toBe(
      'Single · no children'
    );
  });

  test('given a region the metadata does not list then its value shows', () => {
    const household = withHouseholdInput(Household.starter('uk', YEAR), 'region', 'WALES');

    expect(householdPlace(household, YEAR, 'uk', UK_VARIABLES)).toBe('WALES');
  });
});
