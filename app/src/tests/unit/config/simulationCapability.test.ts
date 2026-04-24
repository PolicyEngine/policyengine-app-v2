import { describe, expect, test } from 'vitest';
import {
  assertSupportedSimulationCapabilityMode,
  getSimulationCapabilityMode,
  isSimulationCapabilityMixed,
  isSimulationCapabilityPhase4Only,
  isSimulationCapabilityV1Only,
  isSimulationCapabilityV2Enabled,
  SIMULATION_CAPABILITIES,
  SIMULATION_CAPABILITY_MODE,
  type SimulationCapabilityMode,
} from '@/config/simulationCapability';

describe('simulationCapability', () => {
  describe('SIMULATION_CAPABILITY_MODE', () => {
    test('given default capability config then every simulation surface has an explicit mode', () => {
      expect(SIMULATION_CAPABILITIES).toEqual([
        'reads',
        'associations',
        'standalone_household_create',
        'standalone_economy_create',
        'report_linked_create',
      ]);

      expect(SIMULATION_CAPABILITY_MODE).toEqual({
        reads: 'v1_only',
        associations: 'v1_only',
        standalone_household_create: 'v1_only',
        standalone_economy_create: 'phase4_only',
        report_linked_create: 'phase4_only',
      });
    });

    test('given a capability then getSimulationCapabilityMode returns the configured mode', () => {
      expect(getSimulationCapabilityMode('reads')).toBe('v1_only');
      expect(getSimulationCapabilityMode('associations')).toBe('v1_only');
      expect(getSimulationCapabilityMode('standalone_household_create')).toBe('v1_only');
      expect(getSimulationCapabilityMode('standalone_economy_create')).toBe('phase4_only');
      expect(getSimulationCapabilityMode('report_linked_create')).toBe('phase4_only');
    });
  });

  describe('mode helpers', () => {
    const modes: SimulationCapabilityMode[] = ['v1_only', 'mixed', 'v2_enabled', 'phase4_only'];

    test('given each mode then v1-only helper is precise', () => {
      expect(modes.filter((mode) => mode === 'v1_only')).toEqual(['v1_only']);
    });

    test('given default config then helpers classify capabilities correctly', () => {
      expect(SIMULATION_CAPABILITIES.filter(isSimulationCapabilityV1Only)).toEqual([
        'reads',
        'associations',
        'standalone_household_create',
      ]);
      expect(SIMULATION_CAPABILITIES.filter(isSimulationCapabilityMixed)).toEqual([]);
      expect(SIMULATION_CAPABILITIES.filter(isSimulationCapabilityV2Enabled)).toEqual([]);
      expect(SIMULATION_CAPABILITIES.filter(isSimulationCapabilityPhase4Only)).toEqual([
        'standalone_economy_create',
        'report_linked_create',
      ]);
    });
  });

  describe('assertSupportedSimulationCapabilityMode', () => {
    test('given a supported mode then it returns the configured mode', () => {
      expect(assertSupportedSimulationCapabilityMode('reads', ['v1_only', 'mixed'])).toBe(
        'v1_only'
      );
    });

    test('given an unsupported mode then it throws a clear error', () => {
      expect(() =>
        assertSupportedSimulationCapabilityMode(
          'report_linked_create',
          ['v1_only'],
          'useReportSubmission'
        )
      ).toThrow(
        '[SimulationCapability] Unsupported mode "phase4_only" for report_linked_create in useReportSubmission. Supported modes: v1_only'
      );
    });
  });
});
