import { MetadataState } from "@/types/metadata";

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
    // Use actual metadata to find the region
    const region = metadata.economyOptions.region.find(
      (r) => r.name === regionCode ||
             r.name === `state/${regionCode}` ||
             r.name === `constituency/${regionCode}`
    );
    return region?.label || regionCode;
  };

export function getRegionType(countryCode: string): 'state' | 'constituency' {
    return countryCode === 'us' ? 'state' : 'constituency';
};