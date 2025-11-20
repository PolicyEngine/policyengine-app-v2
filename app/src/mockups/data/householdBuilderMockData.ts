/**
 * Mock data for Household Builder mockups
 * Provides sample household data, metadata, and form state
 */

import { Household } from '@/types/ingredients/Household';

export interface MockMetadata {
  variables: Record<string, any>;
  entities: Record<string, any>;
  basicInputs: string[];
}

export interface MockFormState {
  taxYear: string;
  maritalStatus: 'single' | 'married';
  numChildren: number;
}

export interface MockHouseholdBuilderData {
  household: Household;
  metadata: MockMetadata;
  formState: MockFormState;
  taxYears: Array<{ value: string; label: string }>;
  basicInputFields: {
    person: string[];
    household: string[];
    taxUnit: string[];
    spmUnit: string[];
    family: string[];
    maritalUnit: string[];
  };
  availableVariables: Array<{
    name: string;
    label: string;
    entity: string;
    valueType: string;
    documentation: string | null;
  }>;
}

// Sample household with married couple + 1 child
export const mockHouseholdMarriedWithChild: Household = {
  countryId: 'us',
  householdData: {
    people: {
      you: {
        age: { '2024': 35 },
        employment_income: { '2024': 50000 },
        heating_expense_person: { '2024': 30 },
      },
      'your partner': {
        age: { '2024': 33 },
        employment_income: { '2024': 45000 },
        heating_expense_person: { '2024': 70 },
      },
      'your first dependent': {
        age: { '2024': 8 },
        employment_income: { '2024': 0 },
        heating_expense_person: { '2024': 70 },
      },
    },
    households: {
      'your household': {
        state_name: { '2024': 'CA' },
        members: ['you', 'your partner', 'your first dependent'],
      },
    },
    taxUnits: {
      'your tax unit': {
        heat_pump_expenditures: { '2024': 250 },
        members: ['you', 'your partner', 'your first dependent'],
      },
    },
    spmUnits: {
      'your spm unit': {
        homeowners_insurance: { '2024': 1200 },
        members: ['you', 'your partner', 'your first dependent'],
      },
    },
    families: {
      'your family': {
        members: ['you', 'your partner', 'your first dependent'],
      },
    },
  },
};

// Sample household with single person
export const mockHouseholdSingle: Household = {
  countryId: 'us',
  householdData: {
    people: {
      you: {
        age: { '2024': 28 },
        employment_income: { '2024': 60000 },
      },
    },
    households: {
      'your household': {
        state_name: { '2024': 'NY' },
        members: ['you'],
      },
    },
    taxUnits: {
      'your tax unit': {
        members: ['you'],
      },
    },
    spmUnits: {
      'your spm unit': {
        members: ['you'],
      },
    },
    families: {
      'your family': {
        members: ['you'],
      },
    },
  },
};

// Mock metadata
export const mockMetadata: MockMetadata = {
  variables: {
    age: {
      name: 'age',
      label: 'Age',
      entity: 'person',
      valueType: 'int',
      unit: null,
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'demographics.age',
      documentation: 'Age of the person in years',
    },
    employment_income: {
      name: 'employment_income',
      label: 'Employment Income',
      entity: 'person',
      valueType: 'float',
      unit: 'currency-USD',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'income.employment',
      documentation: 'Wages and salaries, including tips and commissions',
    },
    heating_expense_person: {
      name: 'heating_expense_person',
      label: 'Heating cost for each person',
      entity: 'person',
      valueType: 'float',
      unit: 'currency-USD',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'household.expense.housing.heating_expense_person',
      documentation: null,
    },
    state_name: {
      name: 'state_name',
      label: 'State',
      entity: 'household',
      valueType: 'Enum',
      unit: null,
      defaultValue: 'CA',
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'geography.state_name',
      possibleValues: [
        { value: 'AL', label: 'Alabama' },
        { value: 'CA', label: 'California' },
        { value: 'NY', label: 'New York' },
        { value: 'TX', label: 'Texas' },
      ],
      documentation: 'The state in which the household resides',
    },
    heat_pump_expenditures: {
      name: 'heat_pump_expenditures',
      label: 'Expenditures on heat pumps',
      entity: 'tax_unit',
      valueType: 'float',
      unit: 'currency-USD',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'gov.irs.credits.heat_pump',
      documentation: 'Expenditures on heat pump systems',
    },
    homeowners_insurance: {
      name: 'homeowners_insurance',
      label: 'Homeowners insurance',
      entity: 'spm_unit',
      valueType: 'float',
      unit: 'currency-USD',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'household.expense.housing.homeowners_insurance',
      documentation: 'Annual homeowners insurance premiums',
    },
    qualified_solar_electric_property_expenditures: {
      name: 'qualified_solar_electric_property_expenditures',
      label: 'Qualified solar electric property expenditures',
      entity: 'tax_unit',
      valueType: 'float',
      unit: 'currency-USD',
      defaultValue: 0,
      isInputVariable: true,
      hidden_input: false,
      moduleName: 'gov.irs.credits.solar',
      documentation:
        'Expenditures for property which uses solar energy to generate electricity for use in a dwelling unit',
    },
  },
  entities: {
    person: {
      label: 'Person',
      plural: 'people',
      is_person: true,
    },
    household: {
      label: 'Household',
      plural: 'households',
      is_person: false,
    },
    tax_unit: {
      label: 'Tax Unit',
      plural: 'taxUnits',
      is_person: false,
    },
    spm_unit: {
      label: 'SPM Unit',
      plural: 'spmUnits',
      is_person: false,
    },
    family: {
      label: 'Family',
      plural: 'families',
      is_person: false,
    },
  },
  basicInputs: ['age', 'employment_income', 'state_name'],
};

// Available variables for search
export const mockAvailableVariables = [
  {
    name: 'heating_expense_person',
    label: 'Heating cost for each person',
    entity: 'person',
    valueType: 'float',
    documentation: null,
  },
  {
    name: 'heat_pump_expenditures',
    label: 'Expenditures on heat pumps',
    entity: 'tax_unit',
    valueType: 'float',
    documentation: 'Expenditures on heat pump systems',
  },
  {
    name: 'qualified_solar_electric_property_expenditures',
    label: 'Qualified solar electric property expenditures',
    entity: 'tax_unit',
    valueType: 'float',
    documentation:
      'Expenditures for property which uses solar energy to generate electricity for use in a dwelling unit',
  },
  {
    name: 'homeowners_insurance',
    label: 'Homeowners insurance',
    entity: 'spm_unit',
    valueType: 'float',
    documentation: 'Annual homeowners insurance premiums',
  },
];

// Tax year options
export const mockTaxYears = [
  { value: '2024', label: '2024' },
  { value: '2023', label: '2023' },
  { value: '2022', label: '2022' },
];

// Basic input fields categorized by entity
export const mockBasicInputFields = {
  person: ['age', 'employment_income'],
  household: ['state_name'],
  taxUnit: [],
  spmUnit: [],
  family: [],
  maritalUnit: [],
};

// Complete mock data for married household
export const mockDataMarried: MockHouseholdBuilderData = {
  household: mockHouseholdMarriedWithChild,
  metadata: mockMetadata,
  formState: {
    taxYear: '2024',
    maritalStatus: 'married',
    numChildren: 1,
  },
  taxYears: mockTaxYears,
  basicInputFields: mockBasicInputFields,
  availableVariables: mockAvailableVariables,
};

// Complete mock data for single household
export const mockDataSingle: MockHouseholdBuilderData = {
  household: mockHouseholdSingle,
  metadata: mockMetadata,
  formState: {
    taxYear: '2024',
    maritalStatus: 'single',
    numChildren: 0,
  },
  taxYears: mockTaxYears,
  basicInputFields: mockBasicInputFields,
  availableVariables: mockAvailableVariables,
};
