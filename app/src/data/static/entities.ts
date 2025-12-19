/**
 * Static entity definitions for US and UK
 * These define the household structure entities (person, household, tax_unit, etc.)
 */

export interface EntityInfo {
  label: string;
  plural: string;
  description?: string;
  is_person?: boolean;
}

export type EntitiesRecord = Record<string, EntityInfo>;

/**
 * US entity definitions
 */
export const US_ENTITIES: EntitiesRecord = {
  person: {
    label: 'Person',
    plural: 'people',
    description: 'An individual person',
    is_person: true,
  },
  family: {
    label: 'Family',
    plural: 'families',
    description: 'A family unit',
  },
  household: {
    label: 'Household',
    plural: 'households',
    description: 'A household unit',
  },
  marital_unit: {
    label: 'Marital Unit',
    plural: 'marital units',
    description: 'A marital unit (spouse pair or single adult)',
  },
  tax_unit: {
    label: 'Tax Unit',
    plural: 'tax units',
    description: 'A tax filing unit',
  },
  spm_unit: {
    label: 'SPM Unit',
    plural: 'SPM units',
    description: 'A Supplemental Poverty Measure unit',
  },
};

/**
 * UK entity definitions
 */
export const UK_ENTITIES: EntitiesRecord = {
  person: {
    label: 'Person',
    plural: 'people',
    description: 'An individual person',
    is_person: true,
  },
  benunit: {
    label: 'Benefit Unit',
    plural: 'benefit units',
    description: 'A benefit unit (nuclear family)',
  },
  household: {
    label: 'Household',
    plural: 'households',
    description: 'A household unit',
  },
};

/**
 * Get entities for a country
 */
export function getEntities(countryId: string): EntitiesRecord {
  switch (countryId) {
    case 'us':
      return US_ENTITIES;
    case 'uk':
      return UK_ENTITIES;
    default:
      return {};
  }
}
