import { describe, expect, test, vi } from 'vitest';
import type { Simulation } from '@/types/ingredients/Simulation';
import { findMatchingPopulation } from '@/utils/populationMatching';

// Mock the type guard to always return true for simplicity
vi.mock('@/hooks/useUserHousehold', () => ({
  isHouseholdMetadataWithAssociation: (h: any) => !!h?.household,
}));

const HOUSEHOLD_ID = '12345';

const mockHouseholdSimulation: Simulation = {
  id: 'sim-1',
  populationId: HOUSEHOLD_ID,
  populationType: 'household',
  label: null,
  isCreated: true,
};

const mockGeographySimulation: Simulation = {
  id: 'sim-2',
  populationId: 'state/ca',
  populationType: 'geography',
  label: null,
  isCreated: true,
};

const mockHouseholdData = [
  {
    household: { id: HOUSEHOLD_ID, people: [{ name: 'Person 1' }] },
    isLoading: false,
  },
  {
    household: { id: '99999', people: [{ name: 'Person 2' }] },
    isLoading: false,
  },
];

describe('findMatchingPopulation', () => {
  test('given household simulation with matching data then returns match', () => {
    const result = findMatchingPopulation(mockHouseholdSimulation, mockHouseholdData as any);
    expect(result).not.toBeNull();
    expect((result as any).household.id).toBe(HOUSEHOLD_ID);
  });

  test('given household simulation with no match then returns null', () => {
    const noMatchSim = { ...mockHouseholdSimulation, populationId: 'nonexistent' };
    const result = findMatchingPopulation(noMatchSim, mockHouseholdData as any);
    expect(result).toBeNull();
  });

  test('given geography simulation then returns null', () => {
    const result = findMatchingPopulation(mockGeographySimulation, mockHouseholdData as any);
    expect(result).toBeNull();
  });

  test('given null simulation then returns null', () => {
    const result = findMatchingPopulation(null, mockHouseholdData as any);
    expect(result).toBeNull();
  });

  test('given simulation without populationId then returns null', () => {
    const noPop = { ...mockHouseholdSimulation, populationId: undefined };
    const result = findMatchingPopulation(noPop, mockHouseholdData as any);
    expect(result).toBeNull();
  });

  test('given undefined householdData then returns null', () => {
    const result = findMatchingPopulation(mockHouseholdSimulation, undefined);
    expect(result).toBeNull();
  });
});
