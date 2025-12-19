/**
 * Static region definitions for US and UK
 * These define the geographic regions available for economy-wide simulations
 */

import { MetadataRegionEntry } from '@/types/metadata';
import { UK_REGION_TYPES, US_REGION_TYPES } from '@/types/regionTypes';

/**
 * US region options
 * Note: Congressional districts are dynamically loaded, not included here
 */
export const US_REGIONS: MetadataRegionEntry[] = [
  { name: 'us', label: 'United States', type: US_REGION_TYPES.NATIONAL },
  { name: 'state/al', label: 'Alabama', type: US_REGION_TYPES.STATE },
  { name: 'state/ak', label: 'Alaska', type: US_REGION_TYPES.STATE },
  { name: 'state/az', label: 'Arizona', type: US_REGION_TYPES.STATE },
  { name: 'state/ar', label: 'Arkansas', type: US_REGION_TYPES.STATE },
  { name: 'state/ca', label: 'California', type: US_REGION_TYPES.STATE },
  { name: 'state/co', label: 'Colorado', type: US_REGION_TYPES.STATE },
  { name: 'state/ct', label: 'Connecticut', type: US_REGION_TYPES.STATE },
  { name: 'state/de', label: 'Delaware', type: US_REGION_TYPES.STATE },
  { name: 'state/fl', label: 'Florida', type: US_REGION_TYPES.STATE },
  { name: 'state/ga', label: 'Georgia', type: US_REGION_TYPES.STATE },
  { name: 'state/hi', label: 'Hawaii', type: US_REGION_TYPES.STATE },
  { name: 'state/id', label: 'Idaho', type: US_REGION_TYPES.STATE },
  { name: 'state/il', label: 'Illinois', type: US_REGION_TYPES.STATE },
  { name: 'state/in', label: 'Indiana', type: US_REGION_TYPES.STATE },
  { name: 'state/ia', label: 'Iowa', type: US_REGION_TYPES.STATE },
  { name: 'state/ks', label: 'Kansas', type: US_REGION_TYPES.STATE },
  { name: 'state/ky', label: 'Kentucky', type: US_REGION_TYPES.STATE },
  { name: 'state/la', label: 'Louisiana', type: US_REGION_TYPES.STATE },
  { name: 'state/me', label: 'Maine', type: US_REGION_TYPES.STATE },
  { name: 'state/md', label: 'Maryland', type: US_REGION_TYPES.STATE },
  { name: 'state/ma', label: 'Massachusetts', type: US_REGION_TYPES.STATE },
  { name: 'state/mi', label: 'Michigan', type: US_REGION_TYPES.STATE },
  { name: 'state/mn', label: 'Minnesota', type: US_REGION_TYPES.STATE },
  { name: 'state/ms', label: 'Mississippi', type: US_REGION_TYPES.STATE },
  { name: 'state/mo', label: 'Missouri', type: US_REGION_TYPES.STATE },
  { name: 'state/mt', label: 'Montana', type: US_REGION_TYPES.STATE },
  { name: 'state/ne', label: 'Nebraska', type: US_REGION_TYPES.STATE },
  { name: 'state/nv', label: 'Nevada', type: US_REGION_TYPES.STATE },
  { name: 'state/nh', label: 'New Hampshire', type: US_REGION_TYPES.STATE },
  { name: 'state/nj', label: 'New Jersey', type: US_REGION_TYPES.STATE },
  { name: 'state/nm', label: 'New Mexico', type: US_REGION_TYPES.STATE },
  { name: 'state/ny', label: 'New York', type: US_REGION_TYPES.STATE },
  { name: 'state/nc', label: 'North Carolina', type: US_REGION_TYPES.STATE },
  { name: 'state/nd', label: 'North Dakota', type: US_REGION_TYPES.STATE },
  { name: 'state/oh', label: 'Ohio', type: US_REGION_TYPES.STATE },
  { name: 'state/ok', label: 'Oklahoma', type: US_REGION_TYPES.STATE },
  { name: 'state/or', label: 'Oregon', type: US_REGION_TYPES.STATE },
  { name: 'state/pa', label: 'Pennsylvania', type: US_REGION_TYPES.STATE },
  { name: 'state/ri', label: 'Rhode Island', type: US_REGION_TYPES.STATE },
  { name: 'state/sc', label: 'South Carolina', type: US_REGION_TYPES.STATE },
  { name: 'state/sd', label: 'South Dakota', type: US_REGION_TYPES.STATE },
  { name: 'state/tn', label: 'Tennessee', type: US_REGION_TYPES.STATE },
  { name: 'state/tx', label: 'Texas', type: US_REGION_TYPES.STATE },
  { name: 'state/ut', label: 'Utah', type: US_REGION_TYPES.STATE },
  { name: 'state/vt', label: 'Vermont', type: US_REGION_TYPES.STATE },
  { name: 'state/va', label: 'Virginia', type: US_REGION_TYPES.STATE },
  { name: 'state/wa', label: 'Washington', type: US_REGION_TYPES.STATE },
  { name: 'state/wv', label: 'West Virginia', type: US_REGION_TYPES.STATE },
  { name: 'state/wi', label: 'Wisconsin', type: US_REGION_TYPES.STATE },
  { name: 'state/wy', label: 'Wyoming', type: US_REGION_TYPES.STATE },
  { name: 'state/dc', label: 'District of Columbia', type: US_REGION_TYPES.STATE },
  { name: 'city/nyc', label: 'New York City', type: US_REGION_TYPES.CITY },
];

/**
 * UK region options
 * Note: Constituencies are dynamically loaded, not included here
 */
export const UK_REGIONS: MetadataRegionEntry[] = [
  { name: 'uk', label: 'United Kingdom', type: UK_REGION_TYPES.NATIONAL },
  { name: 'country/england', label: 'England', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/scotland', label: 'Scotland', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/wales', label: 'Wales', type: UK_REGION_TYPES.COUNTRY },
  { name: 'country/northern_ireland', label: 'Northern Ireland', type: UK_REGION_TYPES.COUNTRY },
];

/**
 * Get regions for a country
 */
export function getRegions(countryId: string): MetadataRegionEntry[] {
  switch (countryId) {
    case 'us':
      return US_REGIONS;
    case 'uk':
      return UK_REGIONS;
    default:
      return [];
  }
}
