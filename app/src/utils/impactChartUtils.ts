/**
 * Generic utilities for impact charts (ported from v1 ImpactChart.jsx)
 * These are used across multiple chart types (budgetary, distributional, etc.)
 */

interface Metadata {
  economyOptions: {
    region: Array<{ name: string; label: string }>;
  };
}

/**
 * Get region name from URL params for chart titles
 * Ported from v1 ImpactChart.jsx regionName()
 *
 * Note this is not a general-purpose function -- it is meant to be used to
 * create titles in impact charts.
 *
 * @param metadata the metadata object
 * @returns name of the region if it is found in metadata.economy_options.region
 * and it is not us or uk
 */
export function regionName(metadata: Metadata): string | undefined {
  const ignoreList = ['us', 'uk'];
  const urlParams = new URLSearchParams(window.location.search);
  const region = urlParams.get('region');
  if (!region || ignoreList.includes(region)) {
    return undefined;
  }
  const options = metadata.economyOptions.region.map((region) => {
    return { value: region.name, label: region.label };
  });
  return options.find((option) => option.value === region)?.label;
}
