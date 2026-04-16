export const HOUSEHOLD_VARIATION_POINT_COUNT = 401;

export function getHouseholdVariationMaxEarnings(currentEarnings: number, countryId: string): number {
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

/**
 * Builds axes configuration for household variation calculations
 * Sets employment_income to null for the selected person and adds axes array
 *
 * @param householdInput - Raw household data structure (from API)
 * @param year - The year to vary employment income for
 * @param countryId - Country code (affects max earnings calculation)
 * @param personName - Person whose earnings should vary
 * @returns Household data with axes configuration for calculate-full endpoint
 */
export function buildHouseholdVariationAxes(
  householdInput: any,
  year: string,
  countryId: string,
  personName?: string | null
): any {
  // Validate household has people
  if (!householdInput?.people || Object.keys(householdInput.people).length === 0) {
    throw new Error('Household has no people defined');
  }

  const fallbackPersonKey = Object.keys(householdInput.people)[0];
  const targetPersonKey =
    personName && householdInput.people[personName] ? personName : fallbackPersonKey;
  const targetPerson = householdInput.people[targetPersonKey];

  // Get current earnings for max calculation
  const currentEarnings = (targetPerson?.employment_income?.[year] as number) || 0;

  // Calculate max earnings based on country
  const maxEarnings = getHouseholdVariationMaxEarnings(currentEarnings, countryId);

  // Preserve existing employment_income values for other years
  const existingEmploymentIncome = householdInput.people[targetPersonKey].employment_income || {};

  // Build household data with variation
  const householdDataWithVariation = {
    ...householdInput,
    people: {
      ...householdInput.people,
      [targetPersonKey]: {
        ...householdInput.people[targetPersonKey],
        employment_income: {
          ...existingEmploymentIncome,
          [year]: null, // Null = vary this for the specific year only
        },
      },
    },
  };

  // Add axes configuration (already in API snake_case format)
  return {
    ...householdDataWithVariation,
    axes: [
      [
        {
          name: 'employment_income',
          period: year,
          min: 0,
          max: maxEarnings,
          count: HOUSEHOLD_VARIATION_POINT_COUNT,
        },
      ],
    ],
  };
}
