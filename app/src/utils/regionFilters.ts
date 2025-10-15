/**
 * Utility functions for filtering and mapping region options from metadata
 */

interface RegionOption {
  name: string;
  label: string;
}

interface SelectOption {
  value: string;
  label: string;
}

/**
 * Filters US states from region options (excludes national "us" option)
 */
export function filterUSStates(regions: RegionOption[]): SelectOption[] {
  return regions
    .filter((r) =>
      r.name !== 'us' &&
      r.name !== 'uk' &&
      !r.name.startsWith('country/') &&
      !r.name.startsWith('constituency/')
    )
    .map((s) => ({ value: s.name, label: s.label }));
}

/**
 * Filters UK countries from region options (items starting with "country/")
 */
export function filterUKCountries(regions: RegionOption[]): SelectOption[] {
  return regions
    .filter((r) => r.name.startsWith('country/'))
    .map((c) => ({ value: c.name, label: c.label }));
}

/**
 * Filters UK constituencies from region options (items starting with "constituency/")
 */
export function filterUKConstituencies(regions: RegionOption[]): SelectOption[] {
  return regions
    .filter((r) => r.name.startsWith('constituency/'))
    .map((r) => ({ value: r.name, label: r.label }));
}
