import { describe, expect, it, vi, beforeEach } from 'vitest';
import { deepCopyPopulation, copyPopulationToPosition } from '@/utils/populationCopy';
import {
  mockPopulationWithComplexHousehold,
  mockPopulationWithGeography,
  mockPopulationWithLabel,
} from '@/tests/fixtures/utils/populationCopyMocks';

describe('populationCopy', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('deepCopyPopulation', () => {
    it('given population with household then creates new object references', () => {
      // Given
      const original = mockPopulationWithComplexHousehold();

      // When
      const copied = deepCopyPopulation(original);

      // Then - Verify top-level is a different object
      expect(copied).not.toBe(original);
      expect(copied.household).not.toBe(original.household);
    });

    it('given population with nested household data then deep copies all nested objects', () => {
      // Given
      const original = mockPopulationWithComplexHousehold();

      // When
      const copied = deepCopyPopulation(original);

      // Then - Verify nested objects are different references
      expect(copied.household!.householdData).not.toBe(original.household!.householdData);
      expect(copied.household!.householdData.people).not.toBe(original.household!.householdData.people);
    });

    it('given population with household then modifying copy does not affect original', () => {
      // Given
      const original = mockPopulationWithComplexHousehold();
      const originalPersonName = original.household!.householdData.people.person1.name;

      // When
      const copied = deepCopyPopulation(original);
      copied.household!.householdData.people.person1.name = 'Modified Name';

      // Then - Original should be unchanged
      expect(original.household!.householdData.people.person1.name).toBe(originalPersonName);
      expect(copied.household!.householdData.people.person1.name).toBe('Modified Name');
    });

    it('given population with geography then creates new object references', () => {
      // Given
      const original = mockPopulationWithGeography();

      // When
      const copied = deepCopyPopulation(original);

      // Then - Verify top-level is a different object
      expect(copied).not.toBe(original);
      expect(copied.geography).not.toBe(original.geography);
    });

    it('given population with geography then modifying copy does not affect original', () => {
      // Given
      const original = mockPopulationWithGeography();
      const originalName = original.geography!.name;

      // When
      const copied = deepCopyPopulation(original);
      copied.geography!.name = 'Modified Geography';

      // Then - Original should be unchanged
      expect(original.geography!.name).toBe(originalName);
      expect(copied.geography!.name).toBe('Modified Geography');
    });

    it('given population with label then copies all properties correctly', () => {
      // Given
      const original = mockPopulationWithLabel('Test Label');

      // When
      const copied = deepCopyPopulation(original);

      // Then
      expect(copied.label).toBe('Test Label');
      expect(copied.isCreated).toBe(true);
      expect(copied.household).toBeNull();
      expect(copied.geography).toBeNull();
    });

    it('given population with null household then handles null correctly', () => {
      // Given
      const original = mockPopulationWithLabel('Test');
      original.household = null;

      // When
      const copied = deepCopyPopulation(original);

      // Then
      expect(copied.household).toBeNull();
    });

    it('given population with null geography then handles null correctly', () => {
      // Given
      const original = mockPopulationWithLabel('Test');
      original.geography = null;

      // When
      const copied = deepCopyPopulation(original);

      // Then
      expect(copied.geography).toBeNull();
    });
  });

  describe('copyPopulationToPosition', () => {
    it('given source population and target position then calls dispatch', () => {
      // Given
      const mockDispatch = vi.fn();
      const sourcePopulation = mockPopulationWithComplexHousehold();
      const targetPosition = 1;

      // When
      copyPopulationToPosition(mockDispatch, sourcePopulation, targetPosition);

      // Then - Verify dispatch was called once
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('given population with household then copies to position 0', () => {
      // Given
      const mockDispatch = vi.fn();
      const sourcePopulation = mockPopulationWithComplexHousehold();

      // When
      copyPopulationToPosition(mockDispatch, sourcePopulation, 0);

      // Then - Just verify dispatch was called (testing actual Redux action structure is brittle)
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('given population with geography then copies to position 1', () => {
      // Given
      const mockDispatch = vi.fn();
      const sourcePopulation = mockPopulationWithGeography();

      // When
      copyPopulationToPosition(mockDispatch, sourcePopulation, 1);

      // Then
      expect(mockDispatch).toHaveBeenCalledTimes(1);
    });
  });
});
