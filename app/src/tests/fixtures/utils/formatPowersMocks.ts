/**
 * Test fixtures for formatPowers utility functions
 */

export const TEST_VALUES = {
  ZERO: 0,
  SMALL: 500,
  THOUSAND: 1500,
  MILLION: 1500000,
  BILLION: 1500000000,
  TRILLION: 1500000000000,
  QUADRILLION: 1500000000000000,
  NEGATIVE_BILLION: -2300000000,
} as const;

export const EXPECTED_FORMATTED_VALUES = {
  ZERO: { display: '0.0', label: '' },
  SMALL: { display: '500.0', label: '' },
  THOUSAND: { display: '1500.0', label: '' },
  MILLION: { display: '1.5', label: ' million' },
  BILLION: { display: '1.5', label: ' billion' },
  TRILLION: { display: '1.5', label: ' trillion' },
  QUADRILLION: { display: '1.5', label: ' quadrillion' },
  NEGATIVE_BILLION: { display: '2.3', label: ' billion' },
} as const;

export const EXPECTED_POWER_TUPLES = {
  ZERO: [0, ''] as [number, string],
  SMALL: [500, ''] as [number, string],
  THOUSAND: [1500, ''] as [number, string],
  MILLION: [1.5, ' million'] as [number, string],
  BILLION: [1.5, ' billion'] as [number, string],
  TRILLION: [1.5, ' trillion'] as [number, string],
  QUADRILLION: [1.5, ' quadrillion'] as [number, string],
} as const;
