/**
 * Static time period definitions for US and UK
 * These define the available tax years for simulations
 */

export interface TimePeriodOption {
  name: number;
  label: string;
}

/**
 * US time periods (tax years): 2022-2035
 */
export const US_TIME_PERIODS: TimePeriodOption[] = [
  { name: 2022, label: '2022' },
  { name: 2023, label: '2023' },
  { name: 2024, label: '2024' },
  { name: 2025, label: '2025' },
  { name: 2026, label: '2026' },
  { name: 2027, label: '2027' },
  { name: 2028, label: '2028' },
  { name: 2029, label: '2029' },
  { name: 2030, label: '2030' },
  { name: 2031, label: '2031' },
  { name: 2032, label: '2032' },
  { name: 2033, label: '2033' },
  { name: 2034, label: '2034' },
  { name: 2035, label: '2035' },
];

/**
 * UK time periods (tax years): 2024-2030
 */
export const UK_TIME_PERIODS: TimePeriodOption[] = [
  { name: 2024, label: '2024' },
  { name: 2025, label: '2025' },
  { name: 2026, label: '2026' },
  { name: 2027, label: '2027' },
  { name: 2028, label: '2028' },
  { name: 2029, label: '2029' },
  { name: 2030, label: '2030' },
];

/**
 * Get time periods for a country
 */
export function getTimePeriods(countryId: string): TimePeriodOption[] {
  switch (countryId) {
    case 'us':
      return US_TIME_PERIODS;
    case 'uk':
      return UK_TIME_PERIODS;
    default:
      return [];
  }
}
