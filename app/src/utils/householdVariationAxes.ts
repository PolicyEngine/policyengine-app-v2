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
