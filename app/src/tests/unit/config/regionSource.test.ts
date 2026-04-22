import { describe, expect, test } from 'vitest';
import type { MigrationMode } from '@/config/migrationMode';
import {
  getRegionSurfaceSource,
  LOAD_API_REGION_SHADOW,
  REGION_MIGRATION_MODE,
  REGION_SURFACE_SOURCE,
  shouldLoadApiRegionShadow,
} from '@/config/regionSource';

describe('regionSource', () => {
  describe('derived defaults', () => {
    test('given the current region migration mode then metadata stays surfaced and api shadow stays enabled', () => {
      expect(REGION_MIGRATION_MODE).toBe('v1_primary_v2_shadow');
      expect(REGION_SURFACE_SOURCE).toBe('metadata');
      expect(LOAD_API_REGION_SHADOW).toBe(true);
    });
  });

  describe('mode helpers', () => {
    const modes: MigrationMode[] = [
      'v1_only',
      'v1_primary_v2_shadow',
      'v2_primary_v1_shadow',
      'v2_only',
    ];

    test('given each migration mode then region surface source follows the primary side', () => {
      expect(modes.map((mode) => [mode, getRegionSurfaceSource(mode)])).toEqual([
        ['v1_only', 'metadata'],
        ['v1_primary_v2_shadow', 'metadata'],
        ['v2_primary_v1_shadow', 'api'],
        ['v2_only', 'api'],
      ]);
    });

    test('given each migration mode then api shadow loading only happens in v1-primary-v2-shadow mode', () => {
      expect(modes.filter(shouldLoadApiRegionShadow)).toEqual(['v1_primary_v2_shadow']);
    });
  });
});
