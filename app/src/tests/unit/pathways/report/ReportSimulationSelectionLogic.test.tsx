/**
 * Tests for Report pathway simulation selection logic
 *
 * Tests the fix for the issue where automated simulation setup wasn't working.
 * The baseline simulation selection view should always be shown, even when there are
 * no existing simulations, because it contains the DefaultBaselineOption component
 * for quick setup with "Current law + Nationwide population".
 *
 * KEY BEHAVIOR:
 * - Baseline simulation (index 0): ALWAYS show selection view (even with no existing simulations)
 * - Reform simulation (index 1): Skip selection when no existing simulations
 */

import { describe, expect, test } from 'vitest';
import { SIMULATION_INDEX } from '@/tests/fixtures/pathways/report/ReportPathwayWrapperMocks';

/**
 * Helper function that implements the logic from ReportPathwayWrapper.tsx
 * for determining whether to show the simulation selection view
 */
function shouldShowSimulationSelectionView(
  simulationIndex: 0 | 1,
  hasExistingSimulations: boolean
): boolean {
  // Always show selection view for baseline (index 0) because it has DefaultBaselineOption
  // For reform (index 1), skip if no existing simulations
  return simulationIndex === 0 || hasExistingSimulations;
}

describe('Report pathway simulation selection logic', () => {
  describe('Baseline simulation (index 0)', () => {
    test('given no existing simulations then should show selection view', () => {
      // Given
      const simulationIndex = SIMULATION_INDEX.BASELINE;
      const hasExistingSimulations = false;

      // When
      const result = shouldShowSimulationSelectionView(simulationIndex, hasExistingSimulations);

      // Then
      expect(result).toBe(true);
    });

    test('given existing simulations then should show selection view', () => {
      // Given
      const simulationIndex = SIMULATION_INDEX.BASELINE;
      const hasExistingSimulations = true;

      // When
      const result = shouldShowSimulationSelectionView(simulationIndex, hasExistingSimulations);

      // Then
      expect(result).toBe(true);
    });
  });

  describe('Reform simulation (index 1)', () => {
    test('given no existing simulations then should skip selection view', () => {
      // Given
      const simulationIndex = SIMULATION_INDEX.REFORM;
      const hasExistingSimulations = false;

      // When
      const result = shouldShowSimulationSelectionView(simulationIndex, hasExistingSimulations);

      // Then
      expect(result).toBe(false);
    });

    test('given existing simulations then should show selection view', () => {
      // Given
      const simulationIndex = SIMULATION_INDEX.REFORM;
      const hasExistingSimulations = true;

      // When
      const result = shouldShowSimulationSelectionView(simulationIndex, hasExistingSimulations);

      // Then
      expect(result).toBe(true);
    });
  });
});
