import {
  getMigrationMode,
  isV2PrimaryMode,
  usesV2ShadowMode,
  type MigrationMode,
} from '@/config/migrationMode';

export type RegionSurfaceSource = 'metadata' | 'api';

export function getRegionSurfaceSource(mode: MigrationMode): RegionSurfaceSource {
  return isV2PrimaryMode(mode) ? 'api' : 'metadata';
}

export function shouldLoadApiRegionShadow(mode: MigrationMode): boolean {
  return usesV2ShadowMode(mode);
}

export const REGION_MIGRATION_MODE = getMigrationMode('regions');

// `regions` controls canonical region sourcing for selectors and lookup helpers.
// Persisted user geography rows are governed separately by `saved_geographies`.
export const REGION_SURFACE_SOURCE = getRegionSurfaceSource(REGION_MIGRATION_MODE);

// Separate from surfaced source: keep v2 region loading available for
// canonicalization, shadow resolution, and later migration work.
export const LOAD_API_REGION_SHADOW = shouldLoadApiRegionShadow(REGION_MIGRATION_MODE);
