/**
 * Generic utilities for impact charts (ported from v1 ImpactChart.jsx)
 * These are used across multiple chart types (budgetary, distributional, etc.)
 */

import { MetadataRegionEntry } from '@/types/metadata';

/**
 * Get region name from URL params for chart titles
 * Ported from v1 ImpactChart.jsx regionName()
 *
 * Note this is not a general-purpose function -- it is meant to be used to
 * create titles in impact charts.
 *
 * @param regions Array of region entries from static metadata
 * @returns name of the region if it is found in regions and it is not us or uk
 */
export function regionName(regions: MetadataRegionEntry[]): string | undefined {
  const ignoreList = ['us', 'uk'];
  const urlParams = new URLSearchParams(window.location.search);
  const region = urlParams.get('region');
  if (!region || ignoreList.includes(region)) {
    return undefined;
  }
  const options = regions.map((r) => {
    return { value: r.name, label: r.label };
  });
  return options.find((option) => option.value === region)?.label;
}
