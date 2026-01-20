/**
 * UK Parliamentary Constituencies (2024 Boundaries)
 *
 * 650 constituencies total
 * Effective from 2024 General Election onwards
 *
 * Data source: policyengine-api/data/constituencies_2024.csv
 * Source: UK Boundary Commission reviews
 */

import { MetadataRegionEntry } from '@/types/metadata';
import { UK_REGION_TYPES } from '@/types/regionTypes';
import { RegionVersionMeta, VersionedRegionSet } from '../types';
import constituenciesCSV from './data/constituencies_2024.csv?raw';

/**
 * Parse CSV data into constituency entries
 * CSV format: code,name,x,y
 */
function parseConstituencies(csv: string): MetadataRegionEntry[] {
  const lines = csv.trim().split('\n').slice(1); // Skip header
  const constituencies: MetadataRegionEntry[] = [];

  for (const line of lines) {
    if (!line.trim()) {
      continue;
    }

    // Handle CSV with potential quoted fields containing commas
    let name: string;
    const parts = line.split(',');

    if (line.includes('"')) {
      // Find the quoted name
      const quoteStart = line.indexOf('"');
      const quoteEnd = line.lastIndexOf('"');
      name = line.substring(quoteStart + 1, quoteEnd);
    } else {
      // Simple case: code,name,x,y
      name = parts[1];
    }

    constituencies.push({
      name: `constituency/${name}`,
      label: name,
      type: UK_REGION_TYPES.CONSTITUENCY,
    });
  }

  return constituencies.sort((a, b) => a.label.localeCompare(b.label));
}

const VERSION_2024_BOUNDARIES: RegionVersionMeta = {
  version: '2024-boundaries',
  effectiveFrom: 2024,
  effectiveUntil: null,
  description: 'New constituency boundaries effective from 2024 General Election',
  source: 'https://www.legislation.gov.uk/uksi/2023/1230/contents/made',
};

// Parse constituencies once at module load
const CONSTITUENCIES_2024 = parseConstituencies(constituenciesCSV);

export const UK_CONSTITUENCIES: VersionedRegionSet = {
  versions: {
    '2024-boundaries': {
      meta: VERSION_2024_BOUNDARIES,
      data: CONSTITUENCIES_2024,
    },
  },
  getVersionForYear: (_year: number): string => {
    // 2024 boundaries are currently the only version
    return '2024-boundaries';
  },
};
