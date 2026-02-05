/**
 * Legacy Conversion - API boundary conversion between v1 and v2 Alpha formats
 *
 * This module contains all conversion logic needed to communicate with the
 * still-live API v1 endpoints while the app uses v2 Alpha format internally.
 *
 * v2 Alpha storage format:
 * - People are plain variable dicts (no person_id, name, or membership fields)
 * - Entity groups are single flat dicts (one entity per type)
 * - People identified by array index
 *
 * v1 format:
 * - People are named objects with year-keyed values
 * - Entity groups have members array referencing person names
 *
 * This file should be DELETED when the app migrates to API v2 Alpha endpoints directly.
 */

import { countryIdToModelName, modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { countryIds } from '@/libs/countries';
import { Household, HouseholdPerson } from '@/types/ingredients/Household';

// ============================================================================
// v1 API Response -> v2 Alpha Household
// ============================================================================

/**
 * Convert a v1 API response (year-keyed named objects) to v2 Alpha Household format.
 *
 * v1 format: { people: { "you": { age: { "2025": 30 } } }, tax_units: { ... } }
 * v2 Alpha: { people: [{ age: 30 }], tax_unit: { state_code: "CA" } }
 */
export function v1ResponseToHousehold(
  data: Record<string, any>,
  countryId: (typeof countryIds)[number],
  year?: number
): Household {
  const simulationYear = year ?? extractYearFromV1Data(data) ?? new Date().getFullYear();

  const household: Household = {
    tax_benefit_model_name: countryIdToModelName(countryId),
    year: simulationYear,
    people: [],
  };

  // Convert people: extract flat values, no IDs or names
  const v1People = data.people ?? {};
  for (const [, v1Person] of Object.entries(v1People)) {
    const person: HouseholdPerson = {};
    const personObj = v1Person as Record<string, any>;

    for (const [key, value] of Object.entries(personObj)) {
      if (typeof value === 'object' && value !== null) {
        const yearValue =
          (value as Record<string, any>)[String(simulationYear)] ?? Object.values(value)[0];
        if (yearValue !== undefined) {
          person[key] = yearValue;
        }
      }
    }

    household.people.push(person);
  }

  // Convert entity groups: extract first entity as single dict with flat values
  if (countryId === 'us') {
    household.tax_unit = convertV1EntityToDict(data.tax_units, simulationYear);
    household.family = convertV1EntityToDict(data.families, simulationYear);
    household.spm_unit = convertV1EntityToDict(data.spm_units, simulationYear);
    household.marital_unit = convertV1EntityToDict(data.marital_units, simulationYear);
    household.household = convertV1EntityToDict(data.households, simulationYear);
  } else {
    if (data.benunits) {
      household.benunit = convertV1EntityToDict(data.benunits, simulationYear);
    }
    household.household = convertV1EntityToDict(data.households, simulationYear);
  }

  return household;
}

// ============================================================================
// v2 Alpha Household -> v1 API Request
// ============================================================================

/**
 * Convert a v2 Alpha Household to v1 API request format.
 *
 * v2 Alpha: { people: [{ age: 30 }], tax_unit: { state_code: "CA" } }
 * v1 format: { people: { "you": { age: { "2025": 30 } } }, tax_units: { ... } }
 *
 * Person names are generated from array position:
 * - Index 0 → "you"
 * - Non-dependent at index 1+ → "your partner"
 * - Dependents → "your first dependent", etc.
 */
export function householdToV1Request(household: Household): Record<string, any> {
  const year = String(household.year);
  const countryId = modelNameToCountryId(household.tax_benefit_model_name);

  const result: Record<string, any> = {
    people: {},
  };

  // Generate v1 person names from array position
  const personNames = generateV1PersonNames(household.people);

  // Convert people: wrap values in year-keyed format
  for (let i = 0; i < household.people.length; i++) {
    const person = household.people[i];
    const personKey = personNames[i];
    const personData: Record<string, any> = {};

    for (const [key, value] of Object.entries(person)) {
      if (value === undefined) {
        continue;
      }
      personData[key] = { [year]: value };
    }

    result.people[personKey] = personData;
  }

  // Convert entity dicts → v1 named object with members
  if (countryId === 'us') {
    result.tax_units = convertDictToV1Entity(household.tax_unit, 'tax_unit', personNames, year);
    result.families = convertDictToV1Entity(household.family, 'family', personNames, year);
    result.spm_units = convertDictToV1Entity(household.spm_unit, 'spm_unit', personNames, year);
    result.marital_units = convertDictToV1Entity(
      household.marital_unit,
      'marital_unit',
      personNames,
      year
    );
    result.households = convertDictToV1Entity(household.household, 'household', personNames, year);
  } else {
    result.benunits = convertDictToV1Entity(household.benunit, 'benunit', personNames, year);
    result.households = convertDictToV1Entity(household.household, 'household', personNames, year);
  }

  return result;
}

/**
 * Build a v1 creation payload from a v2 Alpha Household
 */
export function householdToV1CreationPayload(household: Household): {
  country_id: string;
  data: Record<string, any>;
  label?: string;
} {
  return {
    country_id: modelNameToCountryId(household.tax_benefit_model_name),
    data: householdToV1Request(household),
    label: household.label,
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * Convert a v1 entity group to a single flat dict.
 * Extracts flat values (un-year-keyed), and drops members/id fields.
 * Uses the first entity if multiple exist in v1 format.
 */
function convertV1EntityToDict(
  v1Group: Record<string, any> | undefined,
  year: number
): Record<string, any> {
  if (!v1Group) {
    return {};
  }

  const entries = Object.values(v1Group);
  if (entries.length === 0) {
    return {};
  }

  // Convert first entity to a flat dict
  const v1Entity = entries[0] as Record<string, any>;
  const dict: Record<string, any> = {};

  for (const [key, value] of Object.entries(v1Entity)) {
    // Skip members and ID fields
    if (key === 'members') {
      continue;
    }

    if (typeof value === 'object' && value !== null) {
      const yearValue = (value as Record<string, any>)[String(year)] ?? Object.values(value)[0];
      if (yearValue !== undefined) {
        dict[key] = yearValue;
      }
    } else {
      dict[key] = value;
    }
  }

  return dict;
}

/**
 * Convert an entity dict to v1 format (named object with members).
 * All people are members of every entity (server handles assignment).
 */
function convertDictToV1Entity(
  entity: Record<string, any> | undefined,
  entityType: string,
  personNames: string[],
  year: string
): Record<string, any> {
  // Create a single entity with all people as members
  const entityKey = `your ${entityType.replace(/_/g, ' ')}`;
  const entityData: Record<string, any> = {
    members: personNames,
  };

  // Convert entity's variables to year-keyed format
  if (entity) {
    for (const [key, value] of Object.entries(entity)) {
      if (value === undefined) {
        continue;
      }
      entityData[key] = { [year]: value };
    }
  }

  return { [entityKey]: entityData };
}

/**
 * Generate v1-compatible person names from array position.
 *
 * Convention:
 * - Index 0 → "you"
 * - Non-dependent at index 1+ → "your partner"
 * - Dependents → "your first dependent", "your second dependent", etc.
 *
 * For US: dependent = is_tax_unit_dependent === true
 * For UK: dependent = age < 18
 */
function generateV1PersonNames(people: HouseholdPerson[]): string[] {
  const ordinals = ['first', 'second', 'third', 'fourth', 'fifth'];
  const names: string[] = [];
  let dependentCount = 0;

  for (let i = 0; i < people.length; i++) {
    if (i === 0) {
      names.push('you');
      continue;
    }

    const person = people[i];
    const isDependent =
      person.is_tax_unit_dependent === true || (person.age !== undefined && person.age < 18);

    if (isDependent) {
      const ordinal = ordinals[dependentCount] || `${dependentCount + 1}th`;
      names.push(`your ${ordinal} dependent`);
      dependentCount++;
    } else {
      names.push('your partner');
    }
  }

  return names;
}

/**
 * Extract simulation year from v1 data
 */
function extractYearFromV1Data(data: Record<string, any>): number | undefined {
  if (!data.people) {
    return undefined;
  }
  for (const person of Object.values(data.people)) {
    const personObj = person as Record<string, any>;
    if (personObj.age && typeof personObj.age === 'object') {
      const yearKey = Object.keys(personObj.age)[0];
      if (yearKey) {
        return parseInt(yearKey, 10);
      }
    }
  }
  return undefined;
}
