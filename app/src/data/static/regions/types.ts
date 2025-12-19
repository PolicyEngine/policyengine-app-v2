/**
 * Types for versioned region data
 */

import { MetadataRegionEntry } from '@/types/metadata';

/**
 * Metadata for a specific version of region data
 */
export interface RegionVersionMeta {
  version: string;
  effectiveFrom: number; // Year the version became effective
  effectiveUntil: number | null; // Year the version stopped being effective (null = current)
  description: string;
  source?: string;
}

/**
 * A versioned set of regions with metadata
 */
export interface VersionedRegionSet {
  versions: Record<
    string,
    {
      meta: RegionVersionMeta;
      data: MetadataRegionEntry[];
    }
  >;
  getVersionForYear: (year: number) => string;
}

/**
 * Result from resolving regions for a country and year
 */
export interface ResolvedRegions {
  regions: MetadataRegionEntry[];
  versions: {
    congressionalDistricts?: string;
    constituencies?: string;
    localAuthorities?: string;
  };
}
