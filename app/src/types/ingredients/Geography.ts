import { countryIds } from '@/libs/countries';

/**
 * Base Geography type representing a geographic area for simulation
 * Unlike Household, this is validation-only and doesn't require API persistence
 */
export interface Geography {
  id: string; // Format: "{countryId}-{geographyId}" e.g., "us-california" or "uk" for national
  countryId: (typeof countryIds)[number];
  scope: 'national' | 'subnational';
  geographyId: string; // The geographic identifier from metadata options
  name?: string; // Human-readable name
}
