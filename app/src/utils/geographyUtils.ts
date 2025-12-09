import { MetadataState } from '@/types/metadata';

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
  console.log('regionCode:', regionCode);
  console.log('region options:', metadata.economyOptions.region);

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
      r.name === `district/${regionCode}`
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
 * @param regionCode - The region code (e.g., 'california', 'wales', 'district/CA-01')
 * @param metadata - The metadata containing region definitions
 * @returns The display label for the region type (e.g., 'State', 'Congressional District', 'Constituency')
 */
export function getRegionTypeLabel(
  countryId: string,
  regionCode: string,
  metadata: MetadataState
): string {
  // US strategy: check for district or state
  if (countryId === 'us') {
    // Check if it's a congressional district
    if (regionCode.startsWith('district/')) {
      return 'Congressional District';
    }

    // Check in metadata for district prefix
    const region = metadata.economyOptions.region.find(
      (r) => r.name === regionCode || r.name === `district/${regionCode}`
    );

    if (region?.name.startsWith('district/')) {
      return 'Congressional District';
    }

    // Default to State for US
    return 'State';
  }

  // UK strategy: check metadata to determine if it's a country or constituency
  if (countryId === 'uk') {
    const region = metadata.economyOptions.region.find(
      (r) =>
        r.name === regionCode ||
        r.name === `country/${regionCode}` ||
        r.name === `constituency/${regionCode}`
    );

    if (region) {
      if (region.name.startsWith('country/')) {
        return 'Country';
      }
      if (region.name.startsWith('constituency/')) {
        return 'Constituency';
      }
    }

    // Fallback to constituency for UK if we can't determine
    return 'Constituency';
  }

  // Default fallback
  return 'Region';
}
