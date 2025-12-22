/**
 * Unified hook for accessing static metadata
 *
 * Static metadata is country-specific data that doesn't come from the API.
 * It's defined in static files and doesn't change at runtime.
 *
 * Usage:
 * ```typescript
 * // Get everything
 * const { entities, basicInputs, timePeriods, regions, modelledPolicies, currentLawId } =
 *   useStaticMetadata('us', 2025);
 *
 * // Or destructure just what you need
 * const { entities, basicInputs } = useStaticMetadata('us', 2025);
 *
 * // Individual hooks are also available
 * const entities = useEntities('us');
 * const { regions, versions } = useRegions('us', 2025);
 * ```
 */

import { useMemo } from 'react';
import {
  getEntities,
  getBasicInputs,
  getTimePeriods,
  getModelledPolicies,
  getCurrentLawId,
  type EntitiesRecord,
  type TimePeriodOption,
  type ModelledPolicies,
} from '@/data/static';
import { resolveRegions, type ResolvedRegions } from '@/data/static/regions';
import { MetadataRegionEntry } from '@/types/metadata';

/**
 * All static metadata for a country
 */
export interface StaticMetadata {
  /** Entity definitions (person, family, household, etc.) */
  entities: EntitiesRecord;
  /** Required input fields for household creation */
  basicInputs: string[];
  /** Available simulation years */
  timePeriods: TimePeriodOption[];
  /** Geographic regions (states, districts, constituencies, etc.) */
  regions: MetadataRegionEntry[];
  /** Region version info (which boundary set is active) */
  regionVersions: ResolvedRegions['versions'];
  /** Pre-configured policy options */
  modelledPolicies: ModelledPolicies;
  /** ID of the current law baseline policy */
  currentLawId: number;
}

/**
 * Get all static metadata for a country and simulation year
 *
 * This is the primary hook for accessing static metadata. It bundles
 * all static data into a single object for easy destructuring.
 *
 * @param countryId - Country code ('us' or 'uk')
 * @param year - Simulation year (affects which region boundaries are used)
 */
export function useStaticMetadata(
  countryId: string,
  year: number
): StaticMetadata {
  return useMemo(() => {
    const { regions, versions } = resolveRegions(countryId, year);

    return {
      entities: getEntities(countryId),
      basicInputs: getBasicInputs(countryId),
      timePeriods: getTimePeriods(countryId),
      regions,
      regionVersions: versions,
      modelledPolicies: getModelledPolicies(countryId),
      currentLawId: getCurrentLawId(countryId),
    };
  }, [countryId, year]);
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
 * Get current law ID for a country
 */
export function useCurrentLawId(countryId: string): number {
  return useMemo(() => getCurrentLawId(countryId), [countryId]);
}

// Re-export useRegions for convenience (it's defined in its own file)
export { useRegions, useRegionsList } from './useRegions';
