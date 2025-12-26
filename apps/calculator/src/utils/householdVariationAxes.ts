/**
 * Builds axes configuration for household variation calculations
 * Sets employment_income to null for the first person and adds axes array
 *
 * @param householdInput - Raw household data structure (from API)
 * @param year - The year to vary employment income for
 * @param countryId - Country code (affects max earnings calculation)
 * @returns Household data with axes configuration for calculate-full endpoint
 */
export function buildHouseholdVariationAxes(
  householdInput: any,
  year: string,
  countryId: string
): any {
  // Validate household has people
  if (!householdInput?.people || Object.keys(householdInput.people).length === 0) {
    throw new Error('Household has no people defined');
  }

  // Get first person (assumes first person is "you" - adjust if household structure differs)
  const firstPersonKey = Object.keys(householdInput.people)[0];
  const firstPerson: any = Object.values(householdInput.people)[0];

  // Get current earnings for max calculation
  const currentEarnings = (firstPerson?.employment_income?.[year] as number) || 0;

  // Calculate max earnings based on country
  const maxEarnings = Math.max(countryId === 'ng' ? 1_200_000 : 200_000, 2 * currentEarnings);

  // Preserve existing employment_income values for other years
  const existingEmploymentIncome = householdInput.people[firstPersonKey].employment_income || {};

  // Build household data with variation
  const householdDataWithVariation = {
    ...householdInput,
    people: {
      ...householdInput.people,
      [firstPersonKey]: {
        ...householdInput.people[firstPersonKey],
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
          count: 401,
        },
      ],
    ],
  };
}
