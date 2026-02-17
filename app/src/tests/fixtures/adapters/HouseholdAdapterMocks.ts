import { CURRENT_YEAR } from '@/constants';
import { Household } from '@/types/ingredients/Household';
import { HouseholdMetadata } from '@/types/metadata/householdMetadata';

export const mockEntityMetadata = {
  person: {
    key: 'person',
    plural: 'people',
    label: 'Person',
  },
  tax_unit: {
    key: 'tax_unit',
    plural: 'tax_units',
    label: 'Tax unit',
  },
  marital_unit: {
    key: 'marital_unit',
    plural: 'marital_units',
    label: 'Marital unit',
  },
  household: {
    key: 'household',
    plural: 'households',
    label: 'Household',
  },
  spm_unit: {
    key: 'spm_unit',
    plural: 'spm_units',
    label: 'SPM unit',
  },
};

export const mockHouseholdMetadata: HouseholdMetadata = {
  id: '12345',
  household: {
    tax_benefit_model_name: 'policyengine_us',
    year: parseInt(CURRENT_YEAR, 10),
    people: [
      {
        age: 30,
        employment_income: 50000,
      },
      {
        age: 28,
        employment_income: 45000,
      },
    ],
    tax_unit: {},
    marital_unit: {},
    spm_unit: {},
    household: {},
    family: {},
  },
};

export const mockHouseholdMetadataWithUnknownEntity: HouseholdMetadata = {
  id: '67890',
  household: {
    tax_benefit_model_name: 'policyengine_uk',
    year: parseInt(CURRENT_YEAR, 10),
    people: [
      {
        age: 40,
      },
    ],
    household: {},
  },
};

export const mockHouseholdData: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2025,
  people: [
    {
      age: 30,
      employment_income: 50000,
    },
    {
      age: 28,
      employment_income: 45000,
    },
  ],
  tax_unit: {},
  marital_unit: {},
};

export const mockHouseholdDataWithMultipleEntities: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [
    {
      age: 25,
    },
    {
      age: 23,
    },
    {
      age: 5,
      is_tax_unit_dependent: true,
    },
  ],
  tax_unit: {},
  marital_unit: {},
  spm_unit: {},
};

export const mockEmptyHouseholdData: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [],
};

export const mockHouseholdDataWithUnknownEntity: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR, 10),
  people: [
    {
      age: 30,
    },
  ],
} as any;
