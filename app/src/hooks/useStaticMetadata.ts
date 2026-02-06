/**
 * Unified hook for accessing static metadata
 *
 * Static metadata is country-specific data that doesn't come from the API.
 * It's defined in static files and doesn't change at runtime.
 *
 * Usage:
 * ```typescript
 * // Get everything
 * const { entities, basicInputs, timePeriods, modelledPolicies, currentLawId } =
 *   useStaticMetadata('us');
 *
 * // Or destructure just what you need
 * const { entities, basicInputs } = useStaticMetadata('us');
 *
 * // Individual hooks are also available
 * const entities = useEntities('us');
 *
 * // For regions, use the V2 API hook:
 * const { regions, isLoading } = useRegions('us');
 * ```
 */

import { useMemo } from 'react';
import {
  getBasicInputs,
  getCurrentLawId,
  getEntities,
  getModelledPolicies,
  getTimePeriods,
  type EntitiesRecord,
  type ModelledPolicies,
  type TimePeriodOption,
} from '@/data/static';

/**
 * All static metadata for a country
 *
 * Note: Regions are now fetched from the V2 API via useRegions() hook.
 */
export interface StaticMetadata {
  /** Entity definitions (person, family, household, etc.) */
  entities: EntitiesRecord;
  /** Required input fields for household creation */
  basicInputs: string[];
  /** Available simulation years */
  timePeriods: TimePeriodOption[];
  /** Pre-configured policy options */
  modelledPolicies: ModelledPolicies;
  /** ID of the current law baseline policy (null in V2 API) */
  currentLawId: null;
}

/**
 * Get all static metadata for a country
 *
 * This is the primary hook for accessing static metadata. It bundles
 * all static data into a single object for easy destructuring.
 *
 * Note: Regions are not included here - use useRegions() from @/hooks/useRegions
 * to fetch region data from the V2 API.
 *
 * @param countryId - Country code ('us' or 'uk')
 */
export function useStaticMetadata(countryId: string): StaticMetadata {
  return useMemo(() => {
    return {
      entities: getEntities(countryId),
      basicInputs: getBasicInputs(countryId),
      timePeriods: getTimePeriods(countryId),
      modelledPolicies: getModelledPolicies(countryId),
      currentLawId: getCurrentLawId(countryId),
    };
  }, [countryId]);
}

// ============================================================================
// Individual hooks for when you only need one piece of static data
// ============================================================================

/**
 * Get entity definitions for a country
 */
export function useEntities(countryId: string): EntitiesRecord {
  return useMemo(() => getEntities(countryId), [countryId]);
}

/**
 * Get basic input fields for a country
 */
export function useBasicInputs(countryId: string): string[] {
  return useMemo(() => getBasicInputs(countryId), [countryId]);
}

/**
 * Get available time periods for a country
 */
export function useTimePeriods(countryId: string): TimePeriodOption[] {
  return useMemo(() => getTimePeriods(countryId), [countryId]);
}

/**
 * Get modelled policies for a country
 */
export function useModelledPolicies(countryId: string): ModelledPolicies {
  return useMemo(() => getModelledPolicies(countryId), [countryId]);
}

/**
 * Get current law ID for a country.
 * Returns null (V2 API convention: policy_id=null means baseline).
 */
export function useCurrentLawId(_countryId: string): null {
  return useMemo(() => getCurrentLawId(_countryId), [_countryId]);
}

// Re-export useRegions for convenience (it's defined in its own file)
export { useRegions, useRegionsList } from './useRegions';
