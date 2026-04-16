import { countryIds } from '@/libs/countries';

/**
 * Base Geography type representing a geographic area for simulation
 * Unlike Household, this is validation-only and doesn't require API persistence
 */
export interface Geography {
  id: string; // Format: "{countryId}-{display-or-code}" for current UI compatibility
  countryId: (typeof countryIds)[number];
  scope: 'national' | 'subnational';
  geographyId: string; // Canonical region code from selection or hydration
  // National: country code ("uk", "us")
  // Subnational US: "state/ca", "congressional_district/CA-12", "place/CA-44000"
  // Subnational UK: "country/england", "constituency/Sheffield Central", "local_authority/Manchester"
  name?: string; // Human-readable name
}
