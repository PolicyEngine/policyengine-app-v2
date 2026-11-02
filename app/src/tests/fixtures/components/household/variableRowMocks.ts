import { Household } from '@/models/Household';
import type { VariableInfo } from '@/utils/VariableResolver';

export const TEST_YEAR = '2026';
export const TEST_PERSON = 'you';

/** Model metadata for one person's inputs: money per year and per month, yes or no, and age. */
export const VARIABLE_ROW_METADATA = {
  variables: {
    employment_income: {
      name: 'employment_income',
      label: 'Employment income',
      entity: 'person',
      valueType: 'float',
      unit: 'currency-USD',
      definitionPeriod: 'year',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'person',
    },
    // Money the model defines per month; the builder still sends it for the year.
    monthly_childcare_rate: {
      name: 'monthly_childcare_rate',
      label: 'Childcare rate',
      entity: 'person',
      valueType: 'float',
      unit: 'currency-USD',
      definitionPeriod: 'month',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'person',
    },
    // A balance the model marks as a stock: an amount at one point in time.
    bank_account_assets: {
      name: 'bank_account_assets',
      label: 'Bank account assets',
      entity: 'person',
      valueType: 'float',
      unit: 'currency-USD',
      definitionPeriod: 'year',
      quantityType: 'stock',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'person',
    },
    is_disabled: {
      name: 'is_disabled',
      label: 'Is disabled',
      entity: 'person',
      valueType: 'bool',
      unit: null,
      definitionPeriod: 'year',
      defaultValue: false,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'person',
    },
    age: {
      name: 'age',
      label: 'Age',
      entity: 'person',
      valueType: 'float',
      unit: null,
      definitionPeriod: 'year',
      defaultValue: 40,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'person',
    },
  },
  entities: {
    person: { plural: 'people', label: 'Person', is_person: true },
    household: { plural: 'households', label: 'Household', is_person: false },
  },
};

type TestVariableName = keyof typeof VARIABLE_ROW_METADATA.variables;

/** A row's variable as the builder hands it over, with its period from the metadata. */
export function variableInfoFor(name: TestVariableName): VariableInfo {
  const variable = VARIABLE_ROW_METADATA.variables[name];
  return {
    name: variable.name,
    label: variable.label,
    entity: variable.entity,
    valueType: variable.valueType,
    unit: variable.unit ?? undefined,
    defaultValue: variable.defaultValue,
    isInputVariable: variable.isInputVariable,
    hiddenInput: variable.hidden_input,
    moduleName: variable.moduleName,
    definitionPeriod: variable.definitionPeriod,
  };
}

/** The same variable without its period, as getVariableInfo returns it. */
export function variableInfoWithoutPeriod(name: TestVariableName): VariableInfo {
  const { definitionPeriod: _definitionPeriod, ...withoutPeriod } = variableInfoFor(name);
  return withoutPeriod;
}

export function createTestHousehold(): Household {
  return Household.fromAppInput({
    id: 'household-variable-row',
    countryId: 'us',
    householdData: {
      people: {
        [TEST_PERSON]: {
          age: { [TEST_YEAR]: 40 },
          employment_income: { [TEST_YEAR]: 30000 },
          monthly_childcare_rate: { [TEST_YEAR]: 6000 },
          is_disabled: { [TEST_YEAR]: false },
        },
      },
    },
  });
}
