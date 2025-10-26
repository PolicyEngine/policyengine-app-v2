import { Household } from '@/types/ingredients/Household';

export interface IndividualVariable {
  paramName: string;
  label: string;
  value: any;
}

export interface Individual {
  id: string;
  name: string;
  variables: IndividualVariable[];
}

/**
 * Extract individuals from household data
 * Each person in the household becomes an Individual with their variables
 */
export function extractIndividualsFromHousehold(household: Household): Individual[] {
  const individuals: Individual[] = [];

  if (!household.householdData?.people) {
    return individuals;
  }

  const { people } = household.householdData;

  Object.entries(people).forEach(([personId, personData]) => {
    const variables: IndividualVariable[] = [];

    Object.entries(personData).forEach(([paramName, paramValues]) => {
      // paramValues is typically { "2024": value, "2025": value, ... }
      if (typeof paramValues === 'object' && paramValues !== null) {
        const firstValue = Object.values(paramValues)[0];

        variables.push({
          paramName,
          label: formatParameterLabel(paramName),
          value: firstValue,
        });
      }
    });

    individuals.push({
      id: personId,
      name: formatPersonName(personId),
      variables,
    });
  });

  return individuals;
}

/**
 * Format parameter name to human-readable label
 * Capitalizes only the first letter of the first word
 */
function formatParameterLabel(paramName: string): string {
  // Convert snake_case to sentence case (only first letter capitalized)
  const words = paramName.split('_');
  return words
    .map((word, index) => {
      // Capitalize only the first word
      if (index === 0) {
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      return word.toLowerCase();
    })
    .join(' ');
}

/**
 * Format person ID to human-readable name
 * Capitalizes only the first letter
 */
function formatPersonName(personId: string): string {
  // Convert "person_0" to "Person 1", "person_1" to "Person 2", etc.
  const match = personId.match(/person_(\d+)/);
  if (match) {
    const number = parseInt(match[1], 10) + 1;
    return `Person ${number}`;
  }
  // Capitalize only first letter for any other format
  return personId.charAt(0).toUpperCase() + personId.slice(1).toLowerCase();
}
