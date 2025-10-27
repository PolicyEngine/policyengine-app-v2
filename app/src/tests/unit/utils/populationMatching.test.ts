import { describe, expect, it } from 'vitest';
import { findMatchingPopulation } from '@/utils/populationMatching';
import type { Simulation } from '@/types/ingredients/Simulation';
import type { UserHouseholdMetadataWithAssociation } from '@/hooks/useUserHousehold';
import type { UserGeographicMetadataWithAssociation } from '@/hooks/useUserGeographic';

describe('populationMatching', () => {
  describe('findMatchingPopulation', () => {
    const mockHouseholdData: UserHouseholdMetadataWithAssociation[] = [
      {
        association: { id: 'user-hh-1', userId: '1', householdId: 'hh-123', countryId: 'us' },
        household: { id: 'hh-123', countryId: 'us', people: {} },
        isLoading: false,
        error: null,
      },
      {
        association: { id: 'user-hh-2', userId: '1', householdId: 'hh-456', countryId: 'us' },
        household: { id: 'hh-456', countryId: 'us', people: {} },
        isLoading: false,
        error: null,
      },
    ];

    const mockGeographicData: UserGeographicMetadataWithAssociation[] = [
      {
        association: { id: 'user-geo-1', userId: '1', geographyId: 'geo-abc', countryId: 'us' },
        geography: { id: 'geo-abc', name: 'California', countryId: 'us' },
        isLoading: false,
        error: null,
      },
      {
        association: { id: 'user-geo-2', userId: '1', geographyId: 'geo-xyz', countryId: 'uk' },
        geography: { id: 'geo-xyz', name: 'London', countryId: 'uk' },
        isLoading: false,
        error: null,
      },
    ];

    it('given null simulation then returns null', () => {
      // Given
      const simulation = null;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given simulation without populationId then returns null', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'household',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given household simulation with matching populationId then returns matched household', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'household',
        populationId: 'hh-123',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect('household' in result).toBe(true);
        expect((result as UserHouseholdMetadataWithAssociation).household?.id).toBe('hh-123');
      }
    });

    it('given household simulation with non-matching populationId then returns null', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'household',
        populationId: 'hh-999',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given geography simulation with matching populationId then returns matched geography', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'geography',
        populationId: 'geo-abc',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeDefined();
      expect(result).not.toBeNull();
      if (result) {
        expect('geography' in result).toBe(true);
        expect((result as UserGeographicMetadataWithAssociation).geography?.id).toBe('geo-abc');
      }
    });

    it('given geography simulation with non-matching populationId then returns null', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'geography',
        populationId: 'geo-999',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given household simulation with undefined household data then returns null', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'household',
        populationId: 'hh-123',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, undefined, mockGeographicData);

      // Then
      expect(result).toBeNull();
    });

    it('given geography simulation with undefined geographic data then returns null', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'geography',
        populationId: 'geo-abc',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, mockHouseholdData, undefined);

      // Then
      expect(result).toBeNull();
    });

    it('given simulation with empty household data array then returns null', () => {
      // Given
      const simulation: Simulation = {
        id: 'sim-1',
        countryId: 'us',
        policyId: 'policy-1',
        populationType: 'household',
        populationId: 'hh-123',
      } as Simulation;

      // When
      const result = findMatchingPopulation(simulation, [], mockGeographicData);

      // Then
      expect(result).toBeNull();
    });
  });
});
