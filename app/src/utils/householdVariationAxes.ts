import type { Household } from '@/models/Household';
import {
  addVariationAxesToPythonPackageHouseholdData,
  getPythonPackageHouseholdVariationMaxEarnings,
  PYTHON_PACKAGE_HOUSEHOLD_VARIATION_POINT_COUNT,
} from '@/models/household/pythonPackageCodec';
import type {
  PythonPackageHouseholdData,
  PythonPackageHouseholdVariationAxis,
  PythonPackageHouseholdWithAxes,
} from '@/models/household/pythonPackageTypes';
import type { V2HouseholdDocument } from '@/types/v2Households';

export const HOUSEHOLD_VARIATION_POINT_COUNT = PYTHON_PACKAGE_HOUSEHOLD_VARIATION_POINT_COUNT;
export type HouseholdVariationAxis = PythonPackageHouseholdVariationAxis;

export function getHouseholdVariationMaxEarnings(
  currentEarnings: number,
  countryId: string
): number {
  return getPythonPackageHouseholdVariationMaxEarnings(currentEarnings, countryId);
}

export function buildHouseholdVariationEarningsAxis(maxEarnings: number): number[] {
  return Array.from(
    { length: HOUSEHOLD_VARIATION_POINT_COUNT },
    (_, index) => (index * maxEarnings) / (HOUSEHOLD_VARIATION_POINT_COUNT - 1)
  );
}

export function getHouseholdVariationIndexForEarnings(
  currentEarnings: number,
  maxEarnings: number
): number {
  if (maxEarnings <= 0) {
    return 0;
  }

  const clampedEarnings = Math.max(0, Math.min(currentEarnings, maxEarnings));
  return Math.round((clampedEarnings / maxEarnings) * (HOUSEHOLD_VARIATION_POINT_COUNT - 1));
}

export function addHouseholdVariationAxesToPythonPackageData(
  householdInput: PythonPackageHouseholdData,
  year: string,
  countryId: string,
  personName?: string | null
): PythonPackageHouseholdWithAxes {
  return addVariationAxesToPythonPackageHouseholdData(householdInput, year, countryId, personName);
}

/**
 * Builds axes configuration for household variation calculations
 * Sets employment_income to null for the selected person and adds axes array
 *
 * @param household - Native household model
 * @param year - The year to vary employment income for
 * @param personName - Person whose earnings should vary
 * @returns Household data with axes configuration for calculate-full endpoint
 */
export function buildHouseholdVariationAxes(
  household: Household,
  year: string,
  personName?: string | null
): PythonPackageHouseholdWithAxes {
  return addHouseholdVariationAxesToPythonPackageData(
    household.toPythonPackage(),
    year,
    household.countryId,
    personName
  );
}

/** One varied input of a v2 household calculation (`/v2/household-calculations`). */
export interface V2HouseholdVariationAxis {
  name: string;
  period: string;
  min: number;
  max: number;
  count: number;
  /** The varied person's position among the stored household's people. */
  index: number;
}

/**
 * The earnings axis for a stored v2 household, as v1's variation varies
 * it: the person's employment income from zero to the variation's maximum
 * (twice their earnings, or more), across the variation's points. The
 * person is `personName` (the head), else "you", else the first person;
 * a v2 axis names them by their position among the stored people, which
 * is the order the calculation reads them in.
 */
export function v2EarningsVariationAxes(
  document: V2HouseholdDocument,
  year: string,
  countryId: string,
  personName?: string | null
): V2HouseholdVariationAxis[][] {
  const names = document.people.map((person) => person.source_name ?? person.id);
  if (names.length === 0) {
    throw new Error('Household has no people defined');
  }
  const byName = (name: string | null | undefined) => (name ? names.indexOf(name) : -1);
  const index = [byName(personName), byName('you'), 0].find((position) => position >= 0) ?? 0;
  const earnings = (document.people[index].values.employment_income ?? {}) as Record<
    string,
    unknown
  >;
  const currentEarnings = typeof earnings[year] === 'number' ? (earnings[year] as number) : 0;
  return [
    [
      {
        name: 'employment_income',
        period: year,
        min: 0,
        max: getHouseholdVariationMaxEarnings(currentEarnings, countryId),
        count: HOUSEHOLD_VARIATION_POINT_COUNT,
        index,
      },
    ],
  ];
}
