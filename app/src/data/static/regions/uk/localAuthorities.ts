/**
 * UK Local Authorities (2021 Boundaries)
 *
 * ~360 local authorities total
 *
 * Data source: policyengine-api/data/local_authorities_2021.csv
 * Source: Office for National Statistics
 */

import { MetadataRegionEntry } from '@/types/metadata';
import { UK_REGION_TYPES } from '@/types/regionTypes';
import { RegionVersionMeta, VersionedRegionSet } from '../types';
import localAuthoritiesCSV from './data/local_authorities_2021.csv?raw';

/**
 * Parse CSV data into local authority entries
 * CSV format: code,x,y,name
 */
function parseLocalAuthorities(csv: string): MetadataRegionEntry[] {
  const lines = csv.trim().split('\n').slice(1); // Skip header
  const authorities: MetadataRegionEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    // Handle CSV with potential quoted fields containing commas
    let name: string;
    const parts = line.split(',');

    if (line.includes('"')) {
      // Find the quoted name (it's the last field in this CSV)
      const quoteStart = line.indexOf('"');
      const quoteEnd = line.lastIndexOf('"');
      name = line.substring(quoteStart + 1, quoteEnd);
    } else {
      // Simple case: code,x,y,name
      name = parts.slice(3).join(','); // Name might have commas
    }

    authorities.push({
      name: `local_authority/${name}`,
      label: name,
      type: UK_REGION_TYPES.LOCAL_AUTHORITY,
    });
  }

  return authorities.sort((a, b) => a.label.localeCompare(b.label));
}

const VERSION_2021: RegionVersionMeta = {
  version: '2021',
  effectiveFrom: 2021,
  effectiveUntil: null,
  description: 'Local authority boundaries as of 2021',
  source: 'https://www.ons.gov.uk/',
};

// Parse local authorities once at module load
const LOCAL_AUTHORITIES_2021 = parseLocalAuthorities(localAuthoritiesCSV);

export const UK_LOCAL_AUTHORITIES: VersionedRegionSet = {
  versions: {
    '2021': {
      meta: VERSION_2021,
      data: LOCAL_AUTHORITIES_2021,
    },
  },
  getVersionForYear: (_year: number): string => {
    // 2021 boundaries are currently the only version
    return '2021';
  },
};
