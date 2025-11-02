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
 * Extract display value from a region identifier
 * Strips "constituency/" or "country/" prefix for UK regions for display purposes
 * Returns value as-is for US regions
 *
 * @param fullValue - The full region value (e.g., "constituency/Sheffield Central", "ca")
 * @returns The display value (e.g., "Sheffield Central", "ca")
 */
export function extractRegionDisplayValue(fullValue: string): string {
  if (fullValue.includes('/')) {
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

  // CHANGED: Store the full prefixed value for UK regions
  // For UK: selectedRegion is "constituency/Sheffield Central" or "country/england"
  // For US: selectedRegion is just "ca", "ny", etc.
  // We now store the FULL value with prefix

  const displayValue = extractRegionDisplayValue(selectedRegion);

  return {
    id: `${countryId}-${displayValue}`, // ID uses display value for backward compat
    countryId,
    scope: 'subnational',
    geographyId: selectedRegion, // STORE FULL PREFIXED VALUE
  };
}
