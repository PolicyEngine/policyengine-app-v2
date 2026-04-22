import { describe, expect, test } from 'vitest';
import {
  assertSupportedMode,
  ENTITY_MIGRATION_MODE,
  getMigrationMode,
  isV1Only,
  isV1OnlyMode,
  isV1PrimaryV2Shadow,
  isV1PrimaryV2ShadowMode,
  isV2Only,
  isV2OnlyMode,
  isV2Primary,
  isV2PrimaryMode,
  MIGRATION_ENTITIES,
  usesV1Shadow,
  usesV1ShadowMode,
  usesV2Shadow,
  usesV2ShadowMode,
  type MigrationMode,
} from '@/config/migrationMode';

describe('migrationMode', () => {
  describe('ENTITY_MIGRATION_MODE', () => {
    test('given default migration config then every entity has an explicit mode', () => {
      expect(MIGRATION_ENTITIES).toEqual([
        'policies',
        'households',
        'regions',
        'simulations',
        'reports',
      ]);

      expect(ENTITY_MIGRATION_MODE).toEqual({
        policies: 'v1_primary_v2_shadow',
        households: 'v1_primary_v2_shadow',
        regions: 'v1_primary_v2_shadow',
        simulations: 'v1_only',
        reports: 'v1_only',
      });
    });

    test('given an entity then getMigrationMode returns its configured mode', () => {
      expect(getMigrationMode('policies')).toBe('v1_primary_v2_shadow');
      expect(getMigrationMode('households')).toBe('v1_primary_v2_shadow');
      expect(getMigrationMode('regions')).toBe('v1_primary_v2_shadow');
      expect(getMigrationMode('simulations')).toBe('v1_only');
      expect(getMigrationMode('reports')).toBe('v1_only');
    });
  });

  describe('mode helpers', () => {
    const modes: MigrationMode[] = [
      'v1_only',
      'v1_primary_v2_shadow',
      'v2_primary_v1_shadow',
      'v2_only',
    ];

    test('given each mode then v1-only helper is precise', () => {
      expect(modes.filter(isV1OnlyMode)).toEqual(['v1_only']);
    });

    test('given each mode then v1-primary-v2-shadow helper is precise', () => {
      expect(modes.filter(isV1PrimaryV2ShadowMode)).toEqual(['v1_primary_v2_shadow']);
    });

    test('given each mode then v2-primary helper covers both v2-primary states', () => {
      expect(modes.filter(isV2PrimaryMode)).toEqual(['v2_primary_v1_shadow', 'v2_only']);
    });

    test('given each mode then v2-only helper is precise', () => {
      expect(modes.filter(isV2OnlyMode)).toEqual(['v2_only']);
    });

    test('given each mode then shadow helpers identify the correct shadow direction', () => {
      expect(modes.filter(usesV2ShadowMode)).toEqual(['v1_primary_v2_shadow']);
      expect(modes.filter(usesV1ShadowMode)).toEqual(['v2_primary_v1_shadow']);
    });
  });

  describe('entity helpers', () => {
    test('given default entity config then v1-only entities are simulations and reports', () => {
      expect(MIGRATION_ENTITIES.filter(isV1Only)).toEqual(['simulations', 'reports']);
    });

    test('given default entity config then v1-primary-v2-shadow entities are policies households and regions', () => {
      expect(MIGRATION_ENTITIES.filter(isV1PrimaryV2Shadow)).toEqual([
        'policies',
        'households',
        'regions',
      ]);
    });

    test('given default entity config then no entity is v2-primary yet', () => {
      expect(MIGRATION_ENTITIES.filter(isV2Primary)).toEqual([]);
      expect(MIGRATION_ENTITIES.filter(isV2Only)).toEqual([]);
      expect(MIGRATION_ENTITIES.filter(usesV1Shadow)).toEqual([]);
    });

    test('given default entity config then only policy household and region use v2 shadow', () => {
      expect(MIGRATION_ENTITIES.filter(usesV2Shadow)).toEqual([
        'policies',
        'households',
        'regions',
      ]);
    });
  });

  describe('assertSupportedMode', () => {
    test('given a supported mode then it returns the configured mode', () => {
      expect(assertSupportedMode('regions', ['v1_primary_v2_shadow', 'v1_only'])).toBe(
        'v1_primary_v2_shadow'
      );
    });

    test('given an unsupported mode then it throws a clear error', () => {
      expect(() =>
        assertSupportedMode('reports', ['v1_primary_v2_shadow'], 'useCreateReport')
      ).toThrow(
        '[MigrationMode] Unsupported mode "v1_only" for reports in useCreateReport. Supported modes: v1_primary_v2_shadow'
      );
    });
  });
});
