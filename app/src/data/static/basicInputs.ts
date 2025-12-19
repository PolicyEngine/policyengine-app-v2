/**
 * Static basic input field definitions for US and UK
 * These define which variable fields appear in the basic household input forms
 */

/**
 * US basic input fields
 */
export const US_BASIC_INPUTS: string[] = [
  'age',
  'employment_income',
  'state_name',
];

/**
 * UK basic input fields
 */
export const UK_BASIC_INPUTS: string[] = [
  'age',
  'employment_income',
  'region',
];

/**
 * Get basic inputs for a country
 */
export function getBasicInputs(countryId: string): string[] {
  switch (countryId) {
    case 'us':
      return US_BASIC_INPUTS;
    case 'uk':
      return UK_BASIC_INPUTS;
    default:
      return [];
  }
}
