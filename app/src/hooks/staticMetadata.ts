/**
 * Static Metadata Hooks
 *
 * This module provides hooks for accessing static (non-API) metadata.
 * Static metadata is country-specific data defined in code that doesn't
 * change at runtime.
 *
 * ## Quick Start
 *
 * ```typescript
 * import {
 *   useStaticMetadata,  // Get all static data at once
 *   useEntities,        // Entity definitions
 *   useBasicInputs,     // Required household input fields
 *   useTimePeriods,     // Available simulation years
 *   useRegions,         // Geographic regions (year-aware)
 *   useModelledPolicies,// Pre-configured policies
 *   useCurrentLawId,    // Baseline policy ID
 * } from '@/hooks/staticMetadata';
 *
 * // Example: Get all static metadata
 * const { entities, basicInputs, regions } = useStaticMetadata('us', 2025);
 *
 * // Example: Get just regions with version info
 * const { regions, versions } = useRegions('us', 2025);
 * // versions.congressionalDistricts = "2020-census"
 * ```
 *
 * ## What's Static vs API-Driven?
 *
 * | Static (this module)     | API-Driven (Redux)        |
 * |--------------------------|---------------------------|
 * | entities                 | variables                 |
 * | basicInputs              | parameters                |
 * | timePeriods              | datasets                  |
 * | regions                  | version                   |
 * | modelledPolicies         | parameterTree             |
 * | currentLawId             |                           |
 *
 * ## Source Files
 *
 * Static data is defined in `src/data/static/`:
 * - `entities.ts` - Person, family, household definitions
 * - `basicInputs.ts` - Required input field names
 * - `timePeriods.ts` - Available years (US: 2022-2035, UK: 2024-2030)
 * - `modelledPolicies.ts` - Baseline and reform policies
 * - `regions/` - Geographic regions with versioning
 *   - `us/congressionalDistricts.ts` - 436 districts (2020 Census)
 *   - `uk/constituencies.ts` - 650 constituencies (2024 boundaries)
 *   - `uk/localAuthorities.ts` - 360 local authorities
 */

export {
  // Main bundled hook
  useStaticMetadata,
  type StaticMetadata,

  // Individual hooks
  useEntities,
  useBasicInputs,
  useTimePeriods,
  useModelledPolicies,
  useCurrentLawId,
  useRegions,
  useRegionsList,
} from './useStaticMetadata';
