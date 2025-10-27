import { describe, expect, it } from 'vitest';
import {
  getPopulationLockConfig,
  getPopulationSelectionTitle,
  getPopulationSelectionSubtitle,
} from '@/utils/reportPopulationLock';
import {
  mockSimulationWithPopulation,
  mockPopulationCreated,
  mockPopulationNotCreated,
} from '@/tests/fixtures/utils/reportPopulationLockMocks';

describe('reportPopulationLock', () => {
  describe('getPopulationLockConfig', () => {
    it('given standalone mode then returns shouldLock false', () => {
      // Given
      const mode = 'standalone';
      const otherSimulation = mockSimulationWithPopulation('pop-123');
      const otherPopulation = mockPopulationCreated();

      // When
      const result = getPopulationLockConfig(mode, otherSimulation, otherPopulation);

      // Then
      expect(result.shouldLock).toBe(false);
    });

    it('given report mode with no other simulation then returns shouldLock false', () => {
      // Given
      const mode = 'report';
      const otherSimulation = null;
      const otherPopulation = null;

      // When
      const result = getPopulationLockConfig(mode, otherSimulation, otherPopulation);

      // Then
      expect(result.shouldLock).toBe(false);
    });

    it('given report mode with other simulation but no populationId then returns shouldLock false', () => {
      // Given
      const mode = 'report';
      const otherSimulation = mockSimulationWithPopulation(undefined);
      const otherPopulation = mockPopulationCreated();

      // When
      const result = getPopulationLockConfig(mode, otherSimulation, otherPopulation);

      // Then
      expect(result.shouldLock).toBe(false);
    });

    it('given report mode with other simulation having populationId then returns shouldLock true regardless of population state', () => {
      // Given
      const mode = 'report';
      const otherSimulation = mockSimulationWithPopulation('pop-123');
      const otherPopulation = mockPopulationNotCreated();

      // When
      const result = getPopulationLockConfig(mode, otherSimulation, otherPopulation);

      // Then
      // Should lock based on simulation.populationId alone, not population.isCreated
      expect(result.shouldLock).toBe(true);
    });

    it('given report mode with other simulation having populationId but null population then returns shouldLock true', () => {
      // Given
      const mode = 'report';
      const otherSimulation = mockSimulationWithPopulation('pop-123');
      const otherPopulation = null; // Existing simulation scenario - population not loaded in Redux

      // When
      const result = getPopulationLockConfig(mode, otherSimulation, otherPopulation);

      // Then
      // Should lock based on simulation.populationId alone, even if population is null
      expect(result.shouldLock).toBe(true);
    });

    it('given report mode with other simulation having created population then returns shouldLock true', () => {
      // Given
      const mode = 'report';
      const otherSimulation = mockSimulationWithPopulation('pop-123');
      const otherPopulation = mockPopulationCreated();

      // When
      const result = getPopulationLockConfig(mode, otherSimulation, otherPopulation);

      // Then
      expect(result.shouldLock).toBe(true);
    });

    it('given valid lock config then returns other simulation and population', () => {
      // Given
      const mode = 'report';
      const otherSimulation = mockSimulationWithPopulation('pop-123');
      const otherPopulation = mockPopulationCreated();

      // When
      const result = getPopulationLockConfig(mode, otherSimulation, otherPopulation);

      // Then
      expect(result.otherSimulation).toBe(otherSimulation);
      expect(result.otherPopulation).toBe(otherPopulation);
    });
  });

  describe('getPopulationSelectionTitle', () => {
    it('given shouldLock true then returns Apply Population', () => {
      // When
      const result = getPopulationSelectionTitle(true);

      // Then
      expect(result).toBe('Apply Population');
    });

    it('given shouldLock false then returns Select Population', () => {
      // When
      const result = getPopulationSelectionTitle(false);

      // Then
      expect(result).toBe('Select Population');
    });
  });

  describe('getPopulationSelectionSubtitle', () => {
    it('given shouldLock true then returns explanation subtitle', () => {
      // When
      const result = getPopulationSelectionSubtitle(true);

      // Then
      expect(result).toBe(
        'This report requires using the same population as the other simulation'
      );
    });

    it('given shouldLock false then returns undefined', () => {
      // When
      const result = getPopulationSelectionSubtitle(false);

      // Then
      expect(result).toBeUndefined();
    });
  });
});
