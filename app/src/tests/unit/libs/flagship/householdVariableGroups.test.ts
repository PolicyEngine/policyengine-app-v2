import { describe, expect, test } from 'vitest';
import {
  describesAHousehold,
  householdVariableGroup,
  householdVariableSubgroup,
  listsForState,
} from '@/libs/flagship/householdVariableGroups';
import type { VariableInfo } from '@/utils/VariableResolver';

const variable = (moduleName: string) => ({ name: 'x', label: 'X', moduleName }) as VariableInfo;

describe('householdVariableGroup', () => {
  test.each([
    ['household.income.person.employment', 'Income'],
    ['household.demographic.person.age', 'People'],
    ['household.expense.housing.rent', 'Housing and utilities'],
    ['household.expense.utilities.electricity', 'Housing and utilities'],
    ['household.expense.health.medical', 'Health'],
    ['household.expense.childcare', 'Other expenses'],
    ['household.assets.bank', 'Assets'],
    ['gov.usda.snap.snap_reported', 'Benefits and taxes'],
    ['gov.states.ca.tax.income', 'State and local'],
    ['gov.local.ca.la.program', 'State and local'],
    ['gov.puf.e00200', 'Other'],
    ['input.employer_payroll.wages', 'Other'],
  ])('given %s then it groups under %s', (moduleName, group) => {
    expect(householdVariableGroup(variable(moduleName))).toBe(group);
  });
});

describe('listsForState', () => {
  test("given a household in California then only California's programs show", () => {
    expect(listsForState(variable('gov.states.ca.tax.income'), 'CA')).toBe(true);
    expect(listsForState(variable('gov.local.ca.la.program'), 'CA')).toBe(true);
    expect(listsForState(variable('gov.states.ny.tax.income'), 'CA')).toBe(false);
    expect(listsForState(variable('household.income.person'), 'CA')).toBe(true);
  });

  test('given no state then no state program shows, and the rest do', () => {
    expect(listsForState(variable('gov.states.ca.tax.income'), null)).toBe(false);
    expect(listsForState(variable('gov.usda.snap'), null)).toBe(true);
  });
});

describe('householdVariableSubgroup', () => {
  test('given income modules then each reads under its part', () => {
    expect(householdVariableSubgroup(variable('household.income.person.hourly_wage'))).toBe(
      'Wages and work'
    );
    expect(householdVariableSubgroup(variable('household.income.person.farm'))).toBe(
      'Self-employment and business'
    );
    expect(householdVariableSubgroup(variable('household.income.person.dividends'))).toBe(
      'Investments'
    );
    expect(
      householdVariableSubgroup(
        variable('household.income.tax_unit.property_sales_net_capital_gain')
      )
    ).toBe('Investments');
    expect(householdVariableSubgroup(variable('household.income.person.retirement'))).toBe(
      'Retirement'
    );
    expect(householdVariableSubgroup(variable('household.income.illicit_income'))).toBe(
      'Other income'
    );
  });

  test('given a group without parts then there is none', () => {
    expect(householdVariableSubgroup(variable('household.expense.health'))).toBeNull();
  });
});

describe('describesAHousehold', () => {
  const input = (name: string, moduleName: string, documentation?: string) =>
    ({ name, label: name, moduleName, documentation }) as VariableInfo;

  test('given survey totals, incidence inputs or deprecated inputs then they are left out', () => {
    expect(
      describesAHousehold(input('spm_unit_snap', 'household.income.spm_unit.spm_unit_snap'))
    ).toBe(false);
    expect(
      describesAHousehold(input('cbo_excise_tax', 'household.income.household.cbo_excise_tax'))
    ).toBe(false);
    expect(describesAHousehold(input('ssi_reported', 'household.income.person.ssi_reported'))).toBe(
      false
    );
    expect(
      describesAHousehold(
        input('use_reported_ssi', 'household.income.person.use_reported_ssi', 'Deprecated: …')
      )
    ).toBe(false);
  });

  test('given what a household is described by then it is kept', () => {
    expect(describesAHousehold(input('rent', 'household.expense.housing.rent'))).toBe(true);
    expect(describesAHousehold(input('tip_income', 'household.income.person.tip_income'))).toBe(
      true
    );
  });
});
