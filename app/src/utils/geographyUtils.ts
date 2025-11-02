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
      r.name === `constituency/${regionCode}` ||
      r.name === `country/${regionCode}`
  );

  return fallbackRegion?.label || regionCode;
}

export function getRegionType(countryCode: string): 'state' | 'constituency' {
  return countryCode === 'us' ? 'state' : 'constituency';
}
