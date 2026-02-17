import { V2RegionMetadata } from '@/api/v2';
import { MetadataRegionEntry } from '@/types/metadata';

/**
 * Adapter for converting between V2 API region data and internal formats
 */
export class RegionsAdapter {
  /**
   * Convert a single V2 region to frontend MetadataRegionEntry
   *
   * Maps API fields to the existing frontend region structure:
   * - code -> name (the unique identifier)
   * - label -> label (display name)
   * - region_type -> type
   * - state_code -> state_abbreviation
   * - state_name -> state_name
   */
  static regionFromV2(region: V2RegionMetadata): MetadataRegionEntry {
    return {
      name: region.code,
      label: region.label,
      type: region.region_type as MetadataRegionEntry['type'],
      state_abbreviation: region.state_code ?? undefined,
      state_name: region.state_name ?? undefined,
    };
  }

  /**
   * Convert V2 regions array to frontend MetadataRegionEntry array
   */
  static regionsFromV2(regions: V2RegionMetadata[]): MetadataRegionEntry[] {
    return regions.map((r) => RegionsAdapter.regionFromV2(r));
  }
}
