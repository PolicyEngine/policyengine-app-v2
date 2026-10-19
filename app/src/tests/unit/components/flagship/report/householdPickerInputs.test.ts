import { describe, expect, test } from 'vitest';
import {
  COMMON_HOUSEHOLD_INPUTS,
  commonHouseholdInputs,
  householdInputDescriptionOf,
  householdInputName,
  householdInputNameOf,
  UK_COMMON_HOUSEHOLD_INPUTS,
} from '@/components/flagship/report/household/householdPickerInputs';
import type { VariableInfo } from '@/utils/VariableResolver';

const variable = (name: string, label: string, documentation?: string) =>
  ({ name, label, moduleName: '', documentation }) as VariableInfo;

describe('commonHouseholdInputs', () => {
  test('given the UK then the UK featured inputs show, else the US ones', () => {
    expect(commonHouseholdInputs('uk')).toBe(UK_COMMON_HOUSEHOLD_INPUTS);
    expect(commonHouseholdInputs('us')).toBe(COMMON_HOUSEHOLD_INPUTS);
  });

  test('given the UK featured inputs then each has a short name and one line of its own', () => {
    const names = UK_COMMON_HOUSEHOLD_INPUTS.map((input) => input.name);
    expect(new Set(names).size).toBe(names.length);
    for (const input of UK_COMMON_HOUSEHOLD_INPUTS) {
      expect(input.label).toBeTruthy();
      expect(input.description).toMatch(/\.$/);
    }
    // The model reads the private pension, not its deprecated `pension_income`.
    expect(names).toContain('private_pension_income');
    expect(names).not.toContain('pension_income');
  });
});

describe('householdInputNameOf', () => {
  test("given a UK model label then its modelling note is dropped, in the UK's spelling", () => {
    expect(
      householdInputNameOf('uk')(
        variable('employment_income_before_lsr', 'employment income before labour supply responses')
      )
    ).toBe('Employment income');
  });

  test('given a US model label then its note is dropped as before', () => {
    expect(
      householdInputName(
        variable(
          'employment_income_before_lsr',
          'employment income (before labor supply responses)'
        )
      )
    ).toBe('Employment income');
  });

  test("given a UK featured input then its short name shows only for the UK's inputs", () => {
    const rent = variable('rent', 'rent paid');

    expect(
      householdInputNameOf('uk')(variable('tenure_type', 'Tenure type of the household'))
    ).toBe('Tenure');
    expect(householdInputNameOf('us')(variable('tenure_type', 'tenure type'))).toBe('Tenure type');
    expect(householdInputNameOf('uk')(rent)).toBe('Rent');
  });
});

describe('householdInputDescriptionOf', () => {
  test("given a UK featured input without the model's documentation then ours shows", () => {
    expect(householdInputDescriptionOf('uk')(variable('num_bedrooms', 'bedrooms'))).toBe(
      'The number of bedrooms in the home.'
    );
    expect(householdInputDescriptionOf('us')(variable('num_bedrooms', 'bedrooms'))).toBeUndefined();
  });

  test("given the model's documentation then it shows first", () => {
    expect(householdInputDescriptionOf('uk')(variable('rent', 'Rent', 'Rent paid.'))).toBe(
      'Rent paid.'
    );
  });
});
