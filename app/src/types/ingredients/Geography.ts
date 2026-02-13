import { countryIds } from '@/libs/countries';

/**
 * Simplified Geography type representing a geographic area for simulation.
 * Uses V2 API region codes directly - the regionCode serves as the identifier.
 *
 * Region code format:
 * - National: country code ("us", "uk")
 * - US subnational: "state/ca", "congressional_district/CA-01"
 * - UK subnational: "country/england", "constituency/Sheffield Central", "local_authority/..."
 */
export interface Geography {
  countryId: (typeof countryIds)[number];
  regionCode: string; // V2 API region code - serves as both identifier and API parameter
}

/**
 * Helper to check if a geography represents a national scope
 */
export function isNationalGeography(geography: Geography): boolean {
  return geography.regionCode === geography.countryId;
}
