/**
 * HouseholdQueries - Query utilities for API v2 Alpha household structure
 *
 * These functions query the array-based household structure where:
 * - People are in arrays with person_id
 * - Values are flat (no year-keying)
 * - Entity relationships are via person_{entity}_id fields
 */

import {
  EntityType,
  Household,
  HouseholdBenunit,
  HouseholdFamily,
  HouseholdMaritalUnit,
  HouseholdPerson,
  HouseholdSpmUnit,
  HouseholdTaxUnit,
  HouseholdUnit,
} from '@/types/ingredients/Household';

// ============================================================================
// Person Queries
// ============================================================================

/**
 * Get all people in the household
 */
export function getAllPeople(household: Household): HouseholdPerson[] {
  return household.people;
}

/**
 * Get a person by ID
 */
export function getPersonById(household: Household, personId: number): HouseholdPerson | undefined {
  return household.people.find((p) => p.person_id === personId);
}

/**
 * Get a person by name (display name)
 */
export function getPersonByName(household: Household, name: string): HouseholdPerson | undefined {
  return household.people.find((p) => p.name === name);
}

/**
 * Get all adults (age >= 18)
 */
export function getAdults(household: Household): HouseholdPerson[] {
  return household.people.filter((p) => (p.age ?? 0) >= 18);
}

/**
 * Get all children (age < 18)
 */
export function getChildren(household: Household): HouseholdPerson[] {
  return household.people.filter((p) => (p.age ?? 0) < 18);
}

/**
 * Get the total number of people
 */
export function getPersonCount(household: Household): number {
  return household.people.length;
}

/**
 * Get the number of adults
 */
export function getAdultCount(household: Household): number {
  return getAdults(household).length;
}

/**
 * Get the number of children
 */
export function getChildCount(household: Household): number {
  return getChildren(household).length;
}

/**
 * Check if household has any people
 */
export function isEmpty(household: Household): boolean {
  return household.people.length === 0;
}

/**
 * Check if household has people
 */
export function hasPeople(household: Household): boolean {
  return household.people.length > 0;
}

// ============================================================================
// Variable Access
// ============================================================================

/**
 * Get a variable value for a person
 * Note: Values are now flat, not year-keyed
 */
export function getPersonVariable(
  household: Household,
  personId: number,
  variableName: string
): number | boolean | string | undefined {
  const person = getPersonById(household, personId);
  if (!person) return undefined;
  return person[variableName];
}

/**
 * Get a variable value for all people
 * Returns array of [personId, value] pairs
 */
export function getPersonVariableAll(
  household: Household,
  variableName: string
): Array<[number, number | boolean | string | undefined]> {
  return household.people.map((p) => [p.person_id ?? 0, p[variableName]]);
}

/**
 * Set a variable on a person (mutates household)
 */
export function setPersonVariable(
  household: Household,
  personId: number,
  variableName: string,
  value: number | boolean | string
): void {
  const person = getPersonById(household, personId);
  if (person) {
    person[variableName] = value;
  }
}

// ============================================================================
// Entity Queries - Tax Unit (US)
// ============================================================================

/**
 * Get all tax units
 */
export function getTaxUnits(household: Household): HouseholdTaxUnit[] {
  return household.tax_unit ?? [];
}

/**
 * Get a tax unit by ID
 */
export function getTaxUnitById(
  household: Household,
  taxUnitId: number
): HouseholdTaxUnit | undefined {
  return household.tax_unit?.find((t) => t.tax_unit_id === taxUnitId);
}

/**
 * Get all people in a tax unit
 */
export function getPeopleInTaxUnit(household: Household, taxUnitId: number): HouseholdPerson[] {
  return household.people.filter((p) => p.person_tax_unit_id === taxUnitId);
}

/**
 * Get the tax unit a person belongs to
 */
export function getPersonTaxUnit(
  household: Household,
  personId: number
): HouseholdTaxUnit | undefined {
  const person = getPersonById(household, personId);
  if (!person || person.person_tax_unit_id === undefined) return undefined;
  return getTaxUnitById(household, person.person_tax_unit_id);
}

// ============================================================================
// Entity Queries - Family (US)
// ============================================================================

/**
 * Get all families
 */
export function getFamilies(household: Household): HouseholdFamily[] {
  return household.family ?? [];
}

/**
 * Get a family by ID
 */
export function getFamilyById(household: Household, familyId: number): HouseholdFamily | undefined {
  return household.family?.find((f) => f.family_id === familyId);
}

/**
 * Get all people in a family
 */
export function getPeopleInFamily(household: Household, familyId: number): HouseholdPerson[] {
  return household.people.filter((p) => p.person_family_id === familyId);
}

// ============================================================================
// Entity Queries - SPM Unit (US)
// ============================================================================

/**
 * Get all SPM units
 */
export function getSpmUnits(household: Household): HouseholdSpmUnit[] {
  return household.spm_unit ?? [];
}

/**
 * Get an SPM unit by ID
 */
export function getSpmUnitById(
  household: Household,
  spmUnitId: number
): HouseholdSpmUnit | undefined {
  return household.spm_unit?.find((s) => s.spm_unit_id === spmUnitId);
}

/**
 * Get all people in an SPM unit
 */
export function getPeopleInSpmUnit(household: Household, spmUnitId: number): HouseholdPerson[] {
  return household.people.filter((p) => p.person_spm_unit_id === spmUnitId);
}

// ============================================================================
// Entity Queries - Marital Unit (US)
// ============================================================================

/**
 * Get all marital units
 */
export function getMaritalUnits(household: Household): HouseholdMaritalUnit[] {
  return household.marital_unit ?? [];
}

/**
 * Get a marital unit by ID
 */
export function getMaritalUnitById(
  household: Household,
  maritalUnitId: number
): HouseholdMaritalUnit | undefined {
  return household.marital_unit?.find((m) => m.marital_unit_id === maritalUnitId);
}

/**
 * Get all people in a marital unit
 */
export function getPeopleInMaritalUnit(
  household: Household,
  maritalUnitId: number
): HouseholdPerson[] {
  return household.people.filter((p) => p.person_marital_unit_id === maritalUnitId);
}

// ============================================================================
// Entity Queries - Household Unit
// ============================================================================

/**
 * Get all household units
 */
export function getHouseholdUnits(household: Household): HouseholdUnit[] {
  return household.household ?? [];
}

/**
 * Get a household unit by ID
 */
export function getHouseholdUnitById(
  household: Household,
  householdId: number
): HouseholdUnit | undefined {
  return household.household?.find((h) => h.household_id === householdId);
}

/**
 * Get all people in a household unit
 */
export function getPeopleInHouseholdUnit(
  household: Household,
  householdId: number
): HouseholdPerson[] {
  return household.people.filter((p) => p.person_household_id === householdId);
}

/**
 * Get the first (usually only) household unit
 */
export function getDefaultHouseholdUnit(household: Household): HouseholdUnit | undefined {
  return household.household?.[0];
}

// ============================================================================
// Entity Queries - Benefit Unit (UK)
// ============================================================================

/**
 * Get all benefit units
 */
export function getBenunits(household: Household): HouseholdBenunit[] {
  return household.benunit ?? [];
}

/**
 * Get a benefit unit by ID
 */
export function getBenunitById(
  household: Household,
  benunitId: number
): HouseholdBenunit | undefined {
  return household.benunit?.find((b) => b.benunit_id === benunitId);
}

/**
 * Get all people in a benefit unit
 */
export function getPeopleInBenunit(household: Household, benunitId: number): HouseholdPerson[] {
  return household.people.filter((p) => p.person_benunit_id === benunitId);
}

// ============================================================================
// Generic Entity Queries
// ============================================================================

/**
 * Get entity array by entity type
 */
export function getEntitiesByType(
  household: Household,
  entityType: EntityType
): Array<Record<string, any>> {
  switch (entityType) {
    case 'person':
      return household.people;
    case 'tax_unit':
      return household.tax_unit ?? [];
    case 'family':
      return household.family ?? [];
    case 'spm_unit':
      return household.spm_unit ?? [];
    case 'marital_unit':
      return household.marital_unit ?? [];
    case 'household':
      return household.household ?? [];
    case 'benunit':
      return household.benunit ?? [];
    default:
      return [];
  }
}

/**
 * Get people in an entity by entity type and ID
 */
export function getPeopleInEntity(
  household: Household,
  entityType: EntityType,
  entityId: number
): HouseholdPerson[] {
  if (entityType === 'person') {
    const person = getPersonById(household, entityId);
    return person ? [person] : [];
  }

  const idField = `person_${entityType}_id`;
  return household.people.filter((p) => p[idField] === entityId);
}

/**
 * Get a variable from an entity
 */
export function getEntityVariable(
  household: Household,
  entityType: EntityType,
  entityId: number,
  variableName: string
): number | boolean | string | undefined {
  const entities = getEntitiesByType(household, entityType);
  const idField = `${entityType}_id`;
  const entity = entities.find((e) => e[idField] === entityId);
  return entity?.[variableName];
}

// ============================================================================
// Household-Level Queries
// ============================================================================

/**
 * Get the simulation year
 */
export function getYear(household: Household): number {
  return household.year;
}

/**
 * Get the tax-benefit model name
 */
export function getModelName(household: Household): string {
  return household.tax_benefit_model_name;
}

/**
 * Check if this is a US household
 */
export function isUSHousehold(household: Household): boolean {
  return household.tax_benefit_model_name === 'policyengine_us';
}

/**
 * Check if this is a UK household
 */
export function isUKHousehold(household: Household): boolean {
  return household.tax_benefit_model_name === 'policyengine_uk';
}

/**
 * Get the state FIPS code (US only)
 */
export function getStateFips(household: Household): number | undefined {
  return household.household?.[0]?.state_fips;
}

/**
 * Get the state code (US only)
 */
export function getStateCode(household: Household): string | undefined {
  return household.tax_unit?.[0]?.state_code;
}

/**
 * Get the region (UK only)
 */
export function getRegion(household: Household): string | undefined {
  return household.household?.[0]?.region;
}

// ============================================================================
// Summary/Aggregation Queries
// ============================================================================

/**
 * Sum a numeric variable across all people
 */
export function sumPersonVariable(household: Household, variableName: string): number {
  return household.people.reduce((sum, person) => {
    const value = person[variableName];
    return sum + (typeof value === 'number' ? value : 0);
  }, 0);
}

/**
 * Get the average of a numeric variable across all people
 */
export function avgPersonVariable(household: Household, variableName: string): number {
  if (household.people.length === 0) return 0;
  return sumPersonVariable(household, variableName) / household.people.length;
}

/**
 * Get the minimum of a numeric variable across all people
 */
export function minPersonVariable(household: Household, variableName: string): number | undefined {
  const values = household.people
    .map((p) => p[variableName])
    .filter((v): v is number => typeof v === 'number');
  return values.length > 0 ? Math.min(...values) : undefined;
}

/**
 * Get the maximum of a numeric variable across all people
 */
export function maxPersonVariable(household: Household, variableName: string): number | undefined {
  const values = household.people
    .map((p) => p[variableName])
    .filter((v): v is number => typeof v === 'number');
  return values.length > 0 ? Math.max(...values) : undefined;
}

/**
 * Get total employment income across all people
 */
export function getTotalEmploymentIncome(household: Household): number {
  return sumPersonVariable(household, 'employment_income');
}

/**
 * Get the display label for a person
 * Falls back to "Person {id}" if no name set
 */
export function getPersonDisplayName(person: HouseholdPerson): string {
  return person.name ?? `Person ${(person.person_id ?? 0) + 1}`;
}

/**
 * Get all person display names
 */
export function getAllPersonDisplayNames(household: Household): string[] {
  return household.people.map(getPersonDisplayName);
}
