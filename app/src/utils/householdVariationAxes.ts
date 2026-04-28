import type { Household } from '@/models/Household';
import type { HouseholdScalar } from '@/models/household/appTypes';
import type { PythonPackageHouseholdData } from '@/models/household/pythonPackageTypes';
import { cloneValue } from '@/models/household/utils';

export const HOUSEHOLD_VARIATION_POINT_COUNT = 401;

export interface HouseholdVariationAxis {
  name: string;
  period: string;
  min: number;
  max: number;
  count: number;
}

export type PythonPackageHouseholdWithAxes = PythonPackageHouseholdData & {
  axes: HouseholdVariationAxis[][];
};

export function getHouseholdVariationMaxEarnings(
  currentEarnings: number,
  countryId: string
): number {
  return Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);
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

function isYearValueMap(value: unknown): value is Record<string, HouseholdScalar> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function getVariationPersonKey(
  householdInput: PythonPackageHouseholdData,
  personName?: string | null
): string {
  if (personName && householdInput.people[personName]) {
    return personName;
  }

  if (householdInput.people.you) {
    return 'you';
  }

  const fallbackPersonKey = Object.keys(householdInput.people)[0];
  if (!fallbackPersonKey) {
    throw new Error('Household has no people defined');
  }

  return fallbackPersonKey;
}

function getEarningsForYear(
  householdInput: PythonPackageHouseholdData,
  personKey: string,
  year: string
): number {
  const value = householdInput.people[personKey]?.employment_income;
  if (!isYearValueMap(value)) {
    return 0;
  }

  const earnings = value[year];
  return typeof earnings === 'number' ? earnings : 0;
}

export function addHouseholdVariationAxesToPythonPackageData(
  householdInput: PythonPackageHouseholdData,
  year: string,
  countryId: string,
  personName?: string | null
): PythonPackageHouseholdWithAxes {
  if (Object.keys(householdInput.people).length === 0) {
    throw new Error('Household has no people defined');
  }

  const householdDataWithVariation = cloneValue(householdInput) as PythonPackageHouseholdWithAxes;
  const targetPersonKey = getVariationPersonKey(householdDataWithVariation, personName);
  const targetPerson = householdDataWithVariation.people[targetPersonKey];
  const currentEarnings = getEarningsForYear(householdDataWithVariation, targetPersonKey, year);
  const maxEarnings = getHouseholdVariationMaxEarnings(currentEarnings, countryId);
  const existingEmploymentIncome = isYearValueMap(targetPerson.employment_income)
    ? targetPerson.employment_income
    : {};

  targetPerson.employment_income = {
    ...existingEmploymentIncome,
    [year]: null,
  };

  householdDataWithVariation.axes = [
    [
      {
        name: 'employment_income',
        period: year,
        min: 0,
        max: maxEarnings,
        count: HOUSEHOLD_VARIATION_POINT_COUNT,
      },
    ],
  ];

  return householdDataWithVariation;
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
