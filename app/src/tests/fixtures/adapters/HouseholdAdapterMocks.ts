import { CURRENT_YEAR } from '@/constants';
import { HouseholdData } from '@/types/ingredients/Household';
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
  country_id: 'us',
  household_json: {
    people: {
      person1: {
        age: { [CURRENT_YEAR]: 30 },
        employment_income: { [CURRENT_YEAR]: 50000 },
      },
      person2: {
        age: { [CURRENT_YEAR]: 28 },
        employment_income: { [CURRENT_YEAR]: 45000 },
      },
    },
    tax_units: {
      tax_unit1: {
        members: ['person1', 'person2'],
      },
    },
    marital_units: {
      marital_unit1: {
        members: ['person1', 'person2'],
      },
    },
    spm_units: {
      spm_unit1: {
        members: ['person1', 'person2'],
      },
    },
    households: {
      household1: {
        members: ['person1', 'person2'],
      },
    },
    families: {
      family1: {
        members: ['person1', 'person2'],
      },
    },
  },
  api_version: 'v1',
  household_hash: '<household_hash>',
};

export const mockHouseholdMetadataWithUnknownEntity: HouseholdMetadata = {
  id: '67890',
  country_id: 'uk',
  household_json: {
    people: {
      person1: {
        age: { [CURRENT_YEAR]: 40 },
      },
    },
    // @ts-expect-error
    unknown_entity: {
      entity1: {
        some_property: 'value',
      },
    },
  },
};

export const mockHouseholdData: HouseholdData = {
  people: {
    person1: {
      age: { 2025: 30 },
      employment_income: { 2025: 50000 },
    },
    person2: {
      age: { 2025: 28 },
      employment_income: { 2025: 45000 },
    },
  },
  taxUnits: {
    tax_unit1: {
      members: ['person1', 'person2'],
      head: 'person1',
    },
  },
  maritalUnits: {
    marital_unit1: {
      members: ['person1', 'person2'],
    },
  },
};

export const mockHouseholdDataWithMultipleEntities: HouseholdData = {
  people: {
    person1: { age: { [CURRENT_YEAR]: 25 } },
    person2: { age: { [CURRENT_YEAR]: 23 } },
    person3: { age: { [CURRENT_YEAR]: 5 } },
  },
  taxUnits: {
    tax_unit1: {
      members: ['person1', 'person2', 'person3'],
      head: 'person1',
    },
  },
  maritalUnits: {
    marital_unit1: {
      members: ['person1', 'person2'],
    },
  },
  spmUnits: {
    spm_unit1: {
      members: ['person1', 'person2', 'person3'],
    },
  },
};

export const mockEmptyHouseholdData: HouseholdData = {
  people: {},
};

export const mockHouseholdDataWithUnknownEntity: HouseholdData = {
  people: {
    person1: { age: { [CURRENT_YEAR]: 30 } },
  },
  customEntity: {
    entity1: { custom_field: 'value' },
  },
} as any;
