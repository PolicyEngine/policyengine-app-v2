import { describe, expect, test } from 'vitest';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserSimulation } from '@/types/ingredients/UserSimulation';

/**
 * Tests the fallback derivation logic from useUserReportById (useUserReports.ts)
 * that synthesizes UserSimulation objects when no localStorage associations exist.
 *
 * This logic ensures the share button works for reports created before
 * UserSimulation associations were stored during report creation.
 */

// Constants
const TEST_USER_ID = 'anonymous';
const TEST_SIMULATION_ID_1 = 'sim-100';
const TEST_SIMULATION_ID_2 = 'sim-200';

const mockSimulations: Simulation[] = [
  {
    id: TEST_SIMULATION_ID_1,
    countryId: 'us',
    policyId: 'policy-1',
    populationId: 'us',
    populationType: 'geography',
    label: 'Baseline vs Reform',
    isCreated: true,
  },
  {
    id: TEST_SIMULATION_ID_2,
    countryId: 'us',
    policyId: 'policy-2',
    populationId: 'state/ca',
    populationType: 'geography',
    label: 'California Reform',
    isCreated: true,
  },
];

const mockUserSimulationsFromLocalStorage: UserSimulation[] = [
  {
    id: 'sus-abc123',
    userId: TEST_USER_ID,
    simulationId: TEST_SIMULATION_ID_1,
    countryId: 'us',
    label: 'Baseline vs Reform',
    isCreated: true,
  },
  {
    id: 'sus-def456',
    userId: TEST_USER_ID,
    simulationId: TEST_SIMULATION_ID_2,
    countryId: 'us',
    label: 'California Reform',
    isCreated: true,
  },
];

/**
 * Replicates the fallback derivation logic from useUserReportById.
 * This is the exact logic at useUserReports.ts lines 435-446.
 */
function deriveUserSimulations(
  matchedUserSimulations: UserSimulation[] | undefined,
  simulations: Simulation[],
  userId: string | undefined
): UserSimulation[] | undefined {
  return matchedUserSimulations && matchedUserSimulations.length > 0
    ? matchedUserSimulations
    : simulations.length > 0 && userId
      ? simulations.map((sim) => ({
          userId,
          simulationId: sim.id ?? '',
          countryId: sim.countryId as 'us' | 'uk',
          label: sim.label ?? undefined,
          isCreated: true,
        }))
      : matchedUserSimulations;
}

describe('userSimulation fallback derivation logic', () => {
  describe('given localStorage associations exist', () => {
    test('given matched associations then returns localStorage associations', () => {
      // Given
      const matchedUserSimulations = mockUserSimulationsFromLocalStorage;

      // When
      const result = deriveUserSimulations(matchedUserSimulations, mockSimulations, TEST_USER_ID);

      // Then
      expect(result).toBe(matchedUserSimulations);
      expect(result).toHaveLength(2);
      expect(result![0].id).toBe('sus-abc123');
    });
  });

  describe('given no localStorage associations exist', () => {
    test('given simulations and userId then synthesizes UserSimulation objects', () => {
      // Given
      const matchedUserSimulations: UserSimulation[] = [];

      // When
      const result = deriveUserSimulations(matchedUserSimulations, mockSimulations, TEST_USER_ID);

      // Then
      expect(result).toHaveLength(2);
      expect(result![0]).toEqual({
        userId: TEST_USER_ID,
        simulationId: TEST_SIMULATION_ID_1,
        countryId: 'us',
        label: 'Baseline vs Reform',
        isCreated: true,
      });
      expect(result![1]).toEqual({
        userId: TEST_USER_ID,
        simulationId: TEST_SIMULATION_ID_2,
        countryId: 'us',
        label: 'California Reform',
        isCreated: true,
      });
    });

    test('given synthesized UserSimulations then they lack id and createdAt fields', () => {
      // Given
      const matchedUserSimulations: UserSimulation[] = [];

      // When
      const result = deriveUserSimulations(matchedUserSimulations, mockSimulations, TEST_USER_ID);

      // Then
      expect(result![0].id).toBeUndefined();
      expect(result![0].createdAt).toBeUndefined();
    });

    test('given simulation with null id then synthesized simulationId is empty string', () => {
      // Given
      const simulationsWithNullId: Simulation[] = [{ ...mockSimulations[0], id: undefined }];

      // When
      const result = deriveUserSimulations([], simulationsWithNullId, TEST_USER_ID);

      // Then
      expect(result![0].simulationId).toBe('');
    });
  });

  describe('given no simulations and no associations', () => {
    test('given empty simulations and empty associations then returns empty array', () => {
      // Given
      const matchedUserSimulations: UserSimulation[] = [];

      // When
      const result = deriveUserSimulations(matchedUserSimulations, [], TEST_USER_ID);

      // Then
      expect(result).toEqual([]);
    });

    test('given undefined associations and no simulations then returns undefined', () => {
      // When
      const result = deriveUserSimulations(undefined, [], TEST_USER_ID);

      // Then
      expect(result).toBeUndefined();
    });
  });

  describe('given no userId', () => {
    test('given simulations but no userId then returns matchedUserSimulations as-is', () => {
      // Given
      const matchedUserSimulations: UserSimulation[] = [];

      // When
      const result = deriveUserSimulations(matchedUserSimulations, mockSimulations, undefined);

      // Then — falls through to return matchedUserSimulations (empty), no synthesis
      expect(result).toEqual([]);
    });

    test('given undefined associations and no userId then returns undefined', () => {
      // When
      const result = deriveUserSimulations(undefined, mockSimulations, undefined);

      // Then
      expect(result).toBeUndefined();
    });
  });
});
