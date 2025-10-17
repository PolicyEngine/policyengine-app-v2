/**
 * Mock data and fixtures for testing chartDateUtils
 */

// Sample date arrays
export const sampleBaseDates = ['2020-01-01', '2023-01-01', '2025-01-01'];

export const sampleReformDates = ['2023-01-01', '2024-06-15', '2027-01-01'];

export const overlappingDates = {
  base: ['2020-01-01', '2023-01-01', '2025-01-01'],
  reform: ['2023-01-01', '2024-01-01', '2025-01-01'],
};

export const emptyDates = {
  base: [] as string[],
  reform: [] as string[],
};

// Invalid dates
export const invalidDates = ['0000-01-01', '2020-01-01', '2023-06-15', '2100-12-31'];

// Dates that should be filtered
export const mixedValidInvalidDates = [
  '0000-01-01', // Invalid - should be filtered
  '2015-01-01', // Valid
  '2020-06-15', // Valid
  '2099-12-31', // Equal to extension date - should be filtered
  '2100-01-01', // Beyond extension date - should be filtered
  '2023-01-01', // Valid
];

// Sample values for extending display
export const sampleValues = [100, 200, 300];

export const sampleSingleValue = [150];

export const emptyValues = [] as number[];

// Expected results
export const expectedFilteredDates = ['2015-01-01', '2020-06-15', '2023-01-01'];

export const expectedAllUniqueDates = [
  '2020-01-01',
  '2023-01-01',
  '2024-06-15',
  '2025-01-01',
  '2027-01-01',
];

// Expected boundary dates (will be calculated dynamically in tests)
export function getExpectedBoundaryDates() {
  const currentYear = new Date().getFullYear();
  return {
    minDate: '2015-01-01',
    maxDate: `${currentYear + 10}-12-31`,
  };
}
