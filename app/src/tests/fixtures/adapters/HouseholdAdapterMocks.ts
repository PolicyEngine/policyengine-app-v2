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
    year: parseInt(CURRENT_YEAR),
    people: [
      {
        person_id: 0,
        name: 'person1',
        age: 30,
        employment_income: 50000,
        person_tax_unit_id: 0,
        person_marital_unit_id: 0,
        person_spm_unit_id: 0,
        person_household_id: 0,
        person_family_id: 0,
      },
      {
        person_id: 1,
        name: 'person2',
        age: 28,
        employment_income: 45000,
        person_tax_unit_id: 0,
        person_marital_unit_id: 0,
        person_spm_unit_id: 0,
        person_household_id: 0,
        person_family_id: 0,
      },
    ],
    tax_unit: [{ tax_unit_id: 0 }],
    marital_unit: [{ marital_unit_id: 0 }],
    spm_unit: [{ spm_unit_id: 0 }],
    household: [{ household_id: 0 }],
    family: [{ family_id: 0 }],
  },
};

export const mockHouseholdMetadataWithUnknownEntity: HouseholdMetadata = {
  id: '67890',
  household: {
    tax_benefit_model_name: 'policyengine_uk',
    year: parseInt(CURRENT_YEAR),
    people: [
      {
        person_id: 0,
        name: 'person1',
        age: 40,
        person_household_id: 0,
      },
    ],
    household: [{ household_id: 0 }],
  },
};

export const mockHouseholdData: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: 2025,
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 30,
      employment_income: 50000,
      person_tax_unit_id: 0,
      person_marital_unit_id: 0,
    },
    {
      person_id: 1,
      name: 'person2',
      age: 28,
      employment_income: 45000,
      person_tax_unit_id: 0,
      person_marital_unit_id: 0,
    },
  ],
  tax_unit: [{ tax_unit_id: 0 }],
  marital_unit: [{ marital_unit_id: 0 }],
};

export const mockHouseholdDataWithMultipleEntities: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 25,
      person_tax_unit_id: 0,
      person_marital_unit_id: 0,
      person_spm_unit_id: 0,
    },
    {
      person_id: 1,
      name: 'person2',
      age: 23,
      person_tax_unit_id: 0,
      person_marital_unit_id: 0,
      person_spm_unit_id: 0,
    },
    {
      person_id: 2,
      name: 'person3',
      age: 5,
      person_tax_unit_id: 0,
      person_spm_unit_id: 0,
    },
  ],
  tax_unit: [{ tax_unit_id: 0 }],
  marital_unit: [{ marital_unit_id: 0 }],
  spm_unit: [{ spm_unit_id: 0 }],
};

export const mockEmptyHouseholdData: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [],
};

export const mockHouseholdDataWithUnknownEntity: Household = {
  tax_benefit_model_name: 'policyengine_us',
  year: parseInt(CURRENT_YEAR),
  people: [
    {
      person_id: 0,
      name: 'person1',
      age: 30,
    },
  ],
} as any;
