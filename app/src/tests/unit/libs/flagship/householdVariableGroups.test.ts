import { describe, expect, test } from 'vitest';
import {
  describesAHousehold,
  householdVariableGroup,
  householdVariableGroupOf,
  householdVariableSubgroup,
  householdVariableSubgroupOf,
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

  test('given US ids and weights then they are left out, and the US inputs beside them kept', () => {
    expect(
      describesAHousehold(input('tax_unit_id', 'household.demographic.identifiers.tax_unit_id'))
    ).toBe(false);
    expect(
      describesAHousehold(
        input('household_weight', 'household.demographic.weights.household_weight')
      )
    ).toBe(false);
    for (const [name, moduleName] of [
      ['age', 'household.demographic.person.age'],
      ['is_tax_unit_dependent', 'household.demographic.tax_unit.is_tax_unit_dependent'],
      ['takes_up_snap_if_eligible', 'gov.usda.snap.takes_up_snap_if_eligible'],
      ['state_name', 'household.demographic.geographic.state.state_name'],
      ['pension_income', 'household.income.person.pension_income'],
    ]) {
      expect(describesAHousehold(input(name, moduleName))).toBe(true);
    }
  });

  test.each([
    'person_id',
    'benunit_id',
    'household_id',
    'person_benunit_id',
    'person_household_id',
    'person_benunit_role',
    'role',
    'people',
    'families',
    'households',
    'household_weight',
    'raw_person_weight',
    'original_weight',
    'would_claim_uc',
    'would_evade_tv_licence_fee',
    'baseline_child_benefit_entitlement',
    'in_original_frs',
    'spi_imputed',
    'uc_migrated',
    'attends_private_school_random_draw',
    'base_net_income',
    'nhs_outpatient_spending',
    'dfe_education_spending',
    'bus_subsidy_spending',
    'pension_income',
  ])('given the UK microdata input %s then it is left out', (name) => {
    expect(describesAHousehold(input(name, ''), 'uk')).toBe(false);
  });

  test.each([
    'age',
    'rent',
    'savings',
    'private_pension_income',
    'is_disabled_for_benefits',
    'uc_is_in_startup_period',
    'region',
  ])('given the UK input %s then it is kept', (name) => {
    expect(describesAHousehold(input(name, ''), 'uk')).toBe(true);
  });
});

describe('UK household variable groups', () => {
  // The UK model files no input under a module.
  const uk = (name: string) => ({ name, label: name, moduleName: '' }) as VariableInfo;
  const groupOf = householdVariableGroupOf('uk');
  const subgroupOf = householdVariableSubgroupOf('uk');

  test.each([
    ['employment_income_before_lsr', 'Income', 'Wages and work'],
    ['statutory_sick_pay', 'Income', 'Wages and work'],
    ['self_employment_income', 'Income', 'Self-employment and business'],
    ['owned_company_income_share', 'Income', 'Self-employment and business'],
    ['dividend_income', 'Income', 'Investments'],
    ['capital_gains_residential_property', 'Income', 'Investments'],
    ['private_pension_income', 'Income', 'Retirement'],
    ['maintenance_income', 'Income', 'Other income'],
    ['age', 'People', null],
    ['pip_dl_category', 'People', null],
    ['region', 'People', null],
    ['rent', 'Housing and utilities', null],
    ['council_tax_band', 'Housing and utilities', null],
    ['mortgage_interest_repayment', 'Housing and utilities', null],
    ['electricity_consumption', 'Housing and utilities', null],
    ['outpatient_visits', 'Health', null],
    ['childcare_expenses', 'Other expenses', null],
    ['car_fuel_type', 'Other expenses', null],
    ['food_and_non_alcoholic_beverages_consumption', 'Other expenses', null],
    ['wine_litres', 'Other expenses', null],
    ['savings', 'Assets', null],
    ['mortgage_debt', 'Assets', null],
    ['uc_is_in_startup_period', 'Benefits and taxes', null],
    ['tax_free_childcare_on_qualifying_leave', 'Benefits and taxes', null],
    ['child_benefit_opts_out', 'Benefits and taxes', null],
    ['an_input_no_rule_names', 'Other', null],
  ])('given %s then it groups under %s, %s', (name, group, subgroup) => {
    expect(groupOf(uk(name))).toBe(group);
    expect(subgroupOf(uk(name))).toBe(subgroup);
  });

  test('given the US then inputs still group by module', () => {
    expect(householdVariableGroupOf('us')).toBe(householdVariableGroup);
    expect(householdVariableSubgroupOf('us')).toBe(householdVariableSubgroup);
    expect(householdVariableGroup(uk('rent'))).toBe('Other');
  });
});
