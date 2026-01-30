/**
 * Legacy Conversion - API boundary conversion between v1 and v2 formats
 *
 * This module contains all conversion logic needed to communicate with the
 * still-live API v1 endpoints while the app uses v2 format internally.
 *
 * This file should be DELETED when the app migrates to API v2 endpoints.
 */

import { countryIdToModelName, modelNameToCountryId } from '@/adapters/HouseholdAdapter';
import { countryIds } from '@/libs/countries';
import { Household, HouseholdPerson, TaxBenefitModelName } from '@/types/ingredients/Household';

// ============================================================================
// v1 API Response -> v2 Household
// ============================================================================

/**
 * Convert a v1 API response (year-keyed named objects) to v2 Household format.
 *
 * v1 format: { people: { "Alice": { age: { "2025": 30 } } }, tax_units: { ... } }
 * v2 format: { people: [{ person_id: 0, age: 30 }], tax_unit: [{ tax_unit_id: 0 }] }
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

  // Convert people
  let personId = 0;
  const v1People = data.people ?? {};
  for (const [name, v1Person] of Object.entries(v1People)) {
    const person: HouseholdPerson = {
      person_id: personId++,
      name,
    };

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

  // Convert entity groups
  if (countryId === 'us') {
    household.tax_unit = convertV1EntityGroup(
      data.tax_units,
      'tax_unit_id',
      household.people,
      simulationYear
    );
    household.family = convertV1EntityGroup(
      data.families,
      'family_id',
      household.people,
      simulationYear
    );
    household.spm_unit = convertV1EntityGroup(
      data.spm_units,
      'spm_unit_id',
      household.people,
      simulationYear
    );
    household.marital_unit = convertV1EntityGroup(
      data.marital_units,
      'marital_unit_id',
      household.people,
      simulationYear
    );
    household.household = convertV1EntityGroup(
      data.households,
      'household_id',
      household.people,
      simulationYear
    );
  } else {
    if (data.benunits) {
      household.benunit = convertV1EntityGroup(
        data.benunits,
        'benunit_id',
        household.people,
        simulationYear
      );
    }
    household.household = convertV1EntityGroup(
      data.households,
      'household_id',
      household.people,
      simulationYear
    );
  }

  return household;
}

// ============================================================================
// v2 Household -> v1 API Request
// ============================================================================

/**
 * Convert a v2 Household to v1 API request format (for calculate-full, household creation).
 *
 * v2 format: { people: [{ person_id: 0, age: 30 }], tax_unit: [...] }
 * v1 format: { people: { "person_0": { age: { "2025": 30 } } }, tax_units: { ... } }
 */
export function householdToV1Request(household: Household): Record<string, any> {
  const year = String(household.year);
  const countryId = modelNameToCountryId(household.tax_benefit_model_name);

  const result: Record<string, any> = {
    people: {},
  };

  // Convert people
  for (const person of household.people) {
    const personKey = person.name ?? `person_${person.person_id}`;
    const personData: Record<string, any> = {};

    for (const [key, value] of Object.entries(person)) {
      if (key === 'person_id' || key === 'name' || key.startsWith('person_')) continue;
      if (value === undefined) continue;
      personData[key] = { [year]: value };
    }

    result.people[personKey] = personData;
  }

  // Convert entity groups
  if (countryId === 'us') {
    result.tax_units = convertV2EntityToV1(
      household.tax_unit,
      'tax_unit_id',
      household.people,
      year
    );
    result.families = convertV2EntityToV1(household.family, 'family_id', household.people, year);
    result.spm_units = convertV2EntityToV1(
      household.spm_unit,
      'spm_unit_id',
      household.people,
      year
    );
    result.marital_units = convertV2EntityToV1(
      household.marital_unit,
      'marital_unit_id',
      household.people,
      year
    );
    result.households = convertV2EntityToV1(
      household.household,
      'household_id',
      household.people,
      year
    );
  } else {
    result.benunits = convertV2EntityToV1(household.benunit, 'benunit_id', household.people, year);
    result.households = convertV2EntityToV1(
      household.household,
      'household_id',
      household.people,
      year
    );
  }

  return result;
}

/**
 * Build a v1 creation payload from a v2 Household
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
 * Convert a v1 entity group (members-based) to v2 (ID-based)
 */
function convertV1EntityGroup<T extends Record<string, any>>(
  v1Group: Record<string, { members: string[]; [key: string]: any }> | undefined,
  idField: string,
  people: HouseholdPerson[],
  year: number
): T[] {
  if (!v1Group) return [];

  const entities: T[] = [];
  let entityId = 0;

  for (const [_name, v1Entity] of Object.entries(v1Group)) {
    const entity: Record<string, any> = {
      [idField]: entityId,
    };

    for (const [key, value] of Object.entries(v1Entity)) {
      if (key === 'members') {
        // Set person_*_id on each member
        const personIdField = `person_${idField.replace('_id', '')}_id`;
        for (const memberName of value as string[]) {
          const person = people.find((p) => p.name === memberName);
          if (person) {
            person[personIdField] = entityId;
          }
        }
      } else if (typeof value === 'object' && value !== null) {
        const yearValue = (value as Record<string, any>)[String(year)] ?? Object.values(value)[0];
        if (yearValue !== undefined) {
          entity[key] = yearValue;
        }
      } else {
        entity[key] = value;
      }
    }

    entities.push(entity as T);
    entityId++;
  }

  return entities;
}

/**
 * Convert a v2 entity array to v1 format (with members)
 */
function convertV2EntityToV1(
  entities: Array<Record<string, any>> | undefined,
  idField: string,
  people: HouseholdPerson[],
  year: string
): Record<string, any> {
  if (!entities) return {};

  const result: Record<string, any> = {};
  const entityType = idField.replace('_id', '');

  for (const entity of entities) {
    const entityId = entity[idField];
    const entityKey = `${entityType}_${entityId}`;

    const personIdField = `person_${entityType}_id`;
    const members = people
      .filter((p) => p[personIdField] === entityId)
      .map((p) => p.name ?? `person_${p.person_id}`);

    const entityData: Record<string, any> = { members };

    for (const [key, value] of Object.entries(entity)) {
      if (key === idField) continue;
      if (value === undefined) continue;
      entityData[key] = { [year]: value };
    }

    result[entityKey] = entityData;
  }

  return result;
}

/**
 * Extract simulation year from v1 data
 */
function extractYearFromV1Data(data: Record<string, any>): number | undefined {
  if (!data.people) return undefined;
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
