import type { Household } from '@/models/Household';
import type { MetadataState } from '@/types/metadata';

export type SPMModelMetadata = Pick<
  MetadataState,
  'currentCountry' | 'loading' | 'error' | 'version' | 'spm'
>;

export function getModelMetadataError(
  countryId: string,
  metadata?: SPMModelMetadata
): string | null {
  if (metadata?.currentCountry === countryId && metadata.error) {
    return 'Model information could not be loaded. Reload the page to try again before saving or calculating.';
  }
  if (!metadata || metadata.currentCountry !== countryId || metadata.loading || !metadata.version) {
    return 'Wait for model information to load before saving or calculating.';
  }
  return null;
}

/** Builder readiness only: the API resolves county availability and SPM dependencies. */
export function getSPMSelectionError(
  household: Household,
  year: string,
  metadata?: SPMModelMetadata
): string | null {
  const metadataError = getModelMetadataError(household.countryId, metadata);
  if (metadataError) {
    return metadataError;
  }
  if (household.countryId !== 'us') {
    return null;
  }
  if (household.spm && metadata?.spm?.available !== true) {
    return 'These SPM settings require a certified model release.';
  }
  if (!metadata?.spm?.available) {
    return null;
  }
  if (!household.spm) {
    return 'Edit your household to choose national or local Supplemental Poverty Measure thresholds before calculating.';
  }
  if (household.spm.geography_kind === 'county') {
    const groups = household.getGroups('households');
    if (
      !groups.length ||
      groups.some(
        ({ key }) =>
          !/^\d{5}$/.test(
            String(household.getGroupVariableAtYear('households', key, 'county_fips', year) ?? '')
          )
      )
    ) {
      return 'Enter a five-digit county FIPS code for each household to use local SPM thresholds.';
    }
  }
  return null;
}
