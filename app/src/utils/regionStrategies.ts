import { countryIds } from '@/libs/countries';
import { MetadataRegionEntry } from '@/types/metadata';
import { ScopeType, UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';

// Re-export types for convenience
export type { MetadataRegionEntry };
export { US_REGION_TYPES, UK_REGION_TYPES };
export type { ScopeType };

/**
 * Region option for display in dropdowns
 */
export interface RegionOption {
  value: string;
  label: string;
  type:
    | (typeof US_REGION_TYPES)[keyof typeof US_REGION_TYPES]
    | (typeof UK_REGION_TYPES)[keyof typeof UK_REGION_TYPES];
  // Congressional district specific fields
  stateAbbreviation?: string;
  stateName?: string;
}

/**
 * Get US states from metadata (filters by type)
 */
export function getUSStates(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === US_REGION_TYPES.STATE)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
    }));
}

/**
 * Get US congressional districts from metadata (filters by type)
 * Districts include state_abbreviation and state_name from the API
 */
export function getUSCongressionalDistricts(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === US_REGION_TYPES.CONGRESSIONAL_DISTRICT)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
      stateAbbreviation: r.state_abbreviation,
      stateName: r.state_name,
    }));
}

/**
 * Filter congressional districts by state name
 * @param districts - All district options (must include stateName from API)
 * @param stateName - Full state name (e.g., "California")
 * @returns Districts belonging to the specified state
 */
export function filterDistrictsByState(
  districts: RegionOption[],
  stateName: string
): RegionOption[] {
  if (!stateName) {
    return [];
  }
  return districts.filter((d) => d.stateName === stateName);
}

/**
 * Get the state name from a district option
 * @param districtValue - District value (e.g., "congressional_district/CA-01")
 * @param districts - All district options with state info
 * @returns State name or empty string if not found
 */
export function getStateNameFromDistrict(districtValue: string, districts: RegionOption[]): string {
  const district = districts.find((d) => d.value === districtValue);
  return district?.stateName || '';
}

/**
 * Format district options for display in a dropdown
 * - Single-district states show "At-large"
 * - Multi-district states show just the district number (e.g., "1st", "2nd")
 * @param districts - Districts filtered by state
 * @returns Formatted district options
 */
export function formatDistrictOptionsForDisplay(districts: RegionOption[]): RegionOption[] {
  if (districts.length === 1) {
    return districts.map((d) => ({ ...d, label: 'At-large' }));
  }
  return districts.map((d) => {
    const match = d.label.match(/(\d+(?:st|nd|rd|th)?)/i);
    return { ...d, label: match ? match[1] : d.label };
  });
}

/**
 * Get UK countries from metadata (filters by type)
 */
export function getUKCountries(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === UK_REGION_TYPES.COUNTRY)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
    }));
}

/**
 * Get UK constituencies from metadata (filters by type)
 */
export function getUKConstituencies(regions: MetadataRegionEntry[]): RegionOption[] {
  return regions
    .filter((r) => r.type === UK_REGION_TYPES.CONSTITUENCY)
    .map((r) => ({
      value: r.name,
      label: r.label,
      type: r.type,
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
  scope: ScopeType,
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
  if (scope === US_REGION_TYPES.NATIONAL) {
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

  // Store the full prefixed value for all regions
  // For UK: selectedRegion is "constituency/Sheffield Central" or "country/england"
  // For US: selectedRegion is "state/ca" or "congressional_district/CA-01"
  // We store the FULL value with prefix

  const displayValue = extractRegionDisplayValue(selectedRegion);

  return {
    id: `${countryId}-${displayValue}`, // ID uses display value for backward compat
    countryId,
    scope: 'subnational',
    geographyId: selectedRegion, // STORE FULL PREFIXED VALUE
  };
}
