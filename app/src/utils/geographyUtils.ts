import type { Geography } from '@/types/ingredients/Geography';
import { MetadataState } from '@/types/metadata';
import { UK_REGION_TYPES } from '@/types/regionTypes';
import { findPlaceFromRegionString, getPlaceDisplayName } from '@/utils/regionStrategies';
import { extractRegionDisplayValue } from '@/utils/regionStrategies';

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

export function getRegionLabel(regionCode: string, metadata: MetadataState): string {
  // Handle US place (city) format: "place/NY-51000"
  if (regionCode.startsWith('place/')) {
    const place = findPlaceFromRegionString(regionCode);
    if (place) {
      return getPlaceDisplayName(place.name);
    }
    // Fallback: return the code after the prefix
    return regionCode.replace('place/', '');
  }

  // regionCode now contains the FULL prefixed value for UK regions
  // e.g., "constituency/Sheffield Central" or "country/england"
  // For US: just the state code like "ca"

  // Try exact match first (handles prefixed UK values and US state codes)
  const region = metadata.economyOptions.region.find((r) => r.name === regionCode);

  if (region) {
    return region.label;
  }

  // Fallback: if no match, try stripping prefix for display
  // This handles edge cases where we might receive unprefixed values
  const fallbackRegion = metadata.economyOptions.region.find(
    (r) =>
      r.name === `state/${regionCode}` ||
      r.name === `country/${regionCode}` ||
      r.name === `constituency/${regionCode}` ||
      r.name === `local_authority/${regionCode}`
  );

  return fallbackRegion?.label || regionCode;
}

export function getRegionType(countryCode: string): 'state' | 'constituency' {
  return countryCode === 'us' ? 'state' : 'constituency';
}

/**
 * Get the specific region type label for a geography based on country and metadata.
 * Uses a strategy pattern: checks the actual metadata entry to determine the type.
 *
 * @param countryId - The country ID (e.g., 'us', 'uk')
 * @param regionCode - The region code (e.g., 'california', 'wales', 'brighton-pavilion')
 * @param metadata - The metadata containing region definitions
 * @returns The display label for the region type (e.g., 'State', 'Country', 'Constituency', 'Congressional District')
 */
export function getRegionTypeLabel(
  countryId: string,
  regionCode: string,
  metadata: MetadataState
): string {
  // US strategy: check metadata to determine if it's a state, congressional district, or place
  if (countryId === 'us') {
    // Check for place (city) format first
    if (regionCode.startsWith('place/')) {
      return 'City';
    }

    const region = metadata.economyOptions.region.find(
      (r) =>
        r.name === regionCode ||
        r.name === `state/${regionCode}` ||
        r.name === `congressional_district/${regionCode}`
    );

    if (region) {
      if (region.name.startsWith('congressional_district/')) {
        return 'Congressional district';
      }
      if (region.name.startsWith('state/')) {
        return 'State';
      }
    }

    // Fallback to State for US if we can't determine
    return 'State';
  }

  // UK strategy: check metadata to determine if it's a country, constituency, or local authority
  if (countryId === 'uk') {
    const region = metadata.economyOptions.region.find(
      (r) =>
        r.name === regionCode ||
        r.name === `country/${regionCode}` ||
        r.name === `constituency/${regionCode}` ||
        r.name === `local_authority/${regionCode}`
    );

    if (region) {
      if (region.name.startsWith('country/')) {
        return 'Country';
      }
      if (region.name.startsWith('constituency/')) {
        return 'Constituency';
      }
      if (region.name.startsWith('local_authority/')) {
        return 'Local authority';
      }
    }

    // Fallback to constituency for UK if we can't determine
    return 'Constituency';
  }

  // Default fallback
  return 'Region';
}

/**
 * Generate a display label for a Geography object.
 * This is used when geographies are selected without requiring user input.
 *
 * @param geography - The Geography object
 * @returns A human-readable label (e.g., "Households nationwide", "Households in California")
 */
export function generateGeographyLabel(geography: Geography): string {
  if (geography.scope === 'national') {
    return geography.countryId === 'uk' ? 'Households UK-wide' : 'Households nationwide';
  }

  const displayValue = extractRegionDisplayValue(geography.geographyId);
  return `Households in ${displayValue}`;
}
