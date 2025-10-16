import { countryIds } from '@/libs/countries';

/**
 * Region data from metadata
 */
export interface MetadataRegion {
  name: string;
  label: string;
}

/**
 * Region option for display in dropdowns
 */
export interface RegionOption {
  value: string;
  label: string;
}

/**
 * Get US states from metadata (excludes national "us" entry)
 */
export function getUSStates(regions: MetadataRegion[]): RegionOption[] {
  return regions
    .filter((r) => r.name !== 'us')
    .map((r) => ({
      value: r.name,
      label: r.label,
    }));
}

/**
 * Get UK countries from metadata (filters "country/" prefix entries)
 */
export function getUKCountries(regions: MetadataRegion[]): RegionOption[] {
  return regions
    .filter((r) => r.name.startsWith('country/'))
    .map((r) => ({
      value: r.name,
      label: r.label,
    }));
}

/**
 * Get UK constituencies from metadata (filters "constituency/" prefix entries)
 */
export function getUKConstituencies(regions: MetadataRegion[]): RegionOption[] {
  return regions
    .filter((r) => r.name.startsWith('constituency/'))
    .map((r) => ({
      value: r.name,
      label: r.label,
    }));
}

/**
 * Extract API value from a region selection
 * For UK: strips "constituency/" or "country/" prefix
 * For US: returns value as-is
 */
export function extractRegionApiValue(
  fullValue: string,
  countryId: (typeof countryIds)[number]
): string {
  if (countryId === 'uk' && (fullValue.startsWith('country/') || fullValue.startsWith('constituency/'))) {
    return fullValue.split('/').pop() || fullValue;
  }
  return fullValue;
}

/**
 * Create a Geography object from scope selection
 * @param scope - The selected scope type
 * @param countryId - The current country ID
 * @param selectedRegion - The selected region value (if any)
 * @returns Geography object or null if household scope
 */
export function createGeographyFromScope(
  scope: 'national' | 'country' | 'constituency' | 'state' | 'household',
  countryId: (typeof countryIds)[number],
  selectedRegion?: string
): {
  id: string;
  countryId: (typeof countryIds)[number];
  scope: 'national' | 'subnational';
  geographyId: string;
} | null {
  // Household scope doesn't create geography
  if (scope === 'household') {
    return null;
  }

  // National scope uses country ID
  if (scope === 'national') {
    return {
      id: countryId,
      countryId,
      scope: 'national',
      geographyId: countryId,
    };
  }

  // Subnational scopes need a selected region
  if (!selectedRegion) {
    return null;
  }

  const apiValue = extractRegionApiValue(selectedRegion, countryId);

  return {
    id: `${countryId}-${apiValue}`,
    countryId,
    scope: 'subnational',
    geographyId: apiValue,
  };
}
