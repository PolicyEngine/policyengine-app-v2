import type { Geography } from '@/types/ingredients/Geography';
import { MetadataRegionEntry } from '@/types/metadata';
import { UK_REGION_TYPES } from '@/types/regionTypes';

/**
 * Human-readable labels for region types.
 * Maps the internal type constants to display labels.
 */
const REGION_TYPE_LABELS: Record<string, string> = {
  // Shared
  national: 'National',
  // US region types
  state: 'State',
  congressional_district: 'Congressional district',
  city: 'City',
  // UK region types
  country: 'Country',
  constituency: 'Constituency',
  local_authority: 'Local authority',
};

/**
 * Known region type prefixes used in region name strings.
 * Used for fallback matching when a region code doesn't have its prefix.
 */
const KNOWN_PREFIXES = [
  'state',
  'congressional_district',
  'city',
  'country',
  'constituency',
  'local_authority',
];

/**
 * Extracts the UK region type from a Geography object based on its geographyId.
 * Returns the region type constant or null if not a UK geography.
 *
 * @param geography - The Geography object to analyze
 * @returns The UK region type ('national', 'country', 'constituency', 'local_authority') or null
 */
export function getUKRegionTypeFromGeography(
  geography: Geography
): (typeof UK_REGION_TYPES)[keyof typeof UK_REGION_TYPES] | null {
  if (geography.countryId !== 'uk') {
    return null;
  }

  const { geographyId } = geography;

  // National: geographyId equals country code
  if (geographyId === 'uk') {
    return UK_REGION_TYPES.NATIONAL;
  }

  // Check prefixes for subnational types
  if (geographyId.startsWith('country/')) {
    return UK_REGION_TYPES.COUNTRY;
  }

  if (geographyId.startsWith('constituency/')) {
    return UK_REGION_TYPES.CONSTITUENCY;
  }

  if (geographyId.startsWith('local_authority/')) {
    return UK_REGION_TYPES.LOCAL_AUTHORITY;
  }

  return null;
}

/**
 * Checks if a Geography represents a UK local-level region (constituency or local authority).
 * These regions should not display constituency/local authority maps.
 *
 * @param geography - The Geography object to check
 * @returns true if it's a constituency or local authority, false otherwise
 */
export function isUKLocalLevelGeography(geography: Geography): boolean {
  const regionType = getUKRegionTypeFromGeography(geography);
  return (
    regionType === UK_REGION_TYPES.CONSTITUENCY || regionType === UK_REGION_TYPES.LOCAL_AUTHORITY
  );
}

const countryLabels: Record<string, string> = {
  us: 'United States',
  uk: 'United Kingdom',
  ca: 'Canada',
  ng: 'Nigeria',
  il: 'Israel',
};

export function getCountryLabel(countryCode: string): string {
  if (!(countryCode in countryLabels)) {
    return 'Unknown Country';
  }
  return countryLabels[countryCode];
}

/**
 * Find a region entry by code, trying exact match first then prefixed variants.
 *
 * @param regionCode - The region code to find
 * @param regions - Array of region entries from static metadata
 * @returns The matched region entry or undefined
 */
function findRegion(
  regionCode: string,
  regions: MetadataRegionEntry[]
): MetadataRegionEntry | undefined {
  // Try exact match first
  const exactMatch = regions.find((r) => r.name === regionCode);
  if (exactMatch) {
    return exactMatch;
  }

  // Try with known prefixes (for legacy codes without prefix)
  for (const prefix of KNOWN_PREFIXES) {
    const prefixedMatch = regions.find((r) => r.name === `${prefix}/${regionCode}`);
    if (prefixedMatch) {
      return prefixedMatch;
    }
  }

  return undefined;
}

/**
 * Get the display label for a region code.
 *
 * @param regionCode - The region code (e.g., 'constituency/Sheffield Central', 'state/ca')
 * @param regions - Array of region entries from static metadata
 * @returns The human-readable label for the region, or the code itself if not found
 */
export function getRegionLabel(regionCode: string, regions: MetadataRegionEntry[]): string {
  const region = findRegion(regionCode, regions);
  return region?.label || regionCode;
}

/**
 * Get the human-readable label for a region's type.
 * Uses the `type` field from the region entry directly, avoiding country-specific logic.
 *
 * @param _countryId - The country ID (unused, kept for API compatibility)
 * @param regionCode - The region code (e.g., 'state/ca', 'constituency/Sheffield Central')
 * @param regions - Array of region entries from static metadata
 * @returns The display label for the region type (e.g., 'State', 'Constituency')
 */
export function getRegionTypeLabel(
  _countryId: string,
  regionCode: string,
  regions: MetadataRegionEntry[]
): string {
  const region = findRegion(regionCode, regions);

  if (region?.type) {
    return REGION_TYPE_LABELS[region.type] || 'Region';
  }

  // Fallback: try to infer from prefix in the region code
  for (const prefix of KNOWN_PREFIXES) {
    if (regionCode.startsWith(`${prefix}/`)) {
      return REGION_TYPE_LABELS[prefix] || 'Region';
    }
  }

  return 'Region';
}
