import { describe, expect, test, vi } from 'vitest';
import populationReducer, {
  clearAllPopulations,
  clearPopulationAtPosition,
  createPopulationAtPosition,
  initializeHouseholdAtPosition,
  selectAllPopulations,
  selectGeographyAtPosition,
  selectHasPopulationAtPosition,
  selectHouseholdAtPosition,
  selectPopulationAtPosition,
  setGeographyAtPosition,
  setHouseholdAtPosition,
  updatePopulationAtPosition,
  updatePopulationIdAtPosition,
} from '@/reducers/populationReducer';
import {
  emptyInitialState,
  mockGeography1,
  mockGeography2,
  mockHousehold1,
  mockHousehold2,
  mockPopulation1,
  mockPopulation2,
  TEST_LABEL,
  TEST_LABEL_UPDATED,
} from '@/tests/fixtures/reducers/populationMocks';
import { Population } from '@/types/ingredients/Population';

// Mock HouseholdBuilder
vi.mock('@/utils/HouseholdBuilder', () => ({
  HouseholdBuilder: vi.fn().mockImplementation((countryId: string) => ({
    build: () => ({
      id: undefined,
      countryId,
      householdData: {
        people: {},
      },
    }),
  })),
}));

describe('populationReducer', () => {
  describe('Creating Populations at Position', () => {
    test('given createPopulationAtPosition with position 0 then population created at first slot', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = populationReducer(
        state,
        createPopulationAtPosition({
          position: 0,
        })
      );

      // Then
      expect(newState.populations[0]).toEqual({
        label: null,
        isCreated: false,
        household: null,
        geography: null,
      });
      expect(newState.populations[1]).toBeNull();
    });

    test('given createPopulationAtPosition with position 1 then population created at second slot', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = populationReducer(
        state,
        createPopulationAtPosition({
          position: 1,
          population: { label: TEST_LABEL },
        })
      );

      // Then
      expect(newState.populations[0]).toBeNull();
      expect(newState.populations[1]).toEqual({
        label: TEST_LABEL,
        isCreated: false,
        household: null,
        geography: null,
      });
    });

    test('given createPopulationAtPosition with existing population then preserves existing population', () => {
      // Given
      const state = {
        populations: [mockPopulation1, null] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        createPopulationAtPosition({
          position: 0,
          population: { label: 'New Population' },
        })
      );

      // Then - existing population should be preserved, not replaced
      expect(newState.populations[0]).toEqual(mockPopulation1);
      expect(newState.populations[0]?.label).toBe(TEST_LABEL); // Original label preserved
      expect(newState.populations[0]?.household).toEqual(mockHousehold1); // Original household preserved
    });

    test('given createPopulationAtPosition with null value then creates new population', () => {
      // Given
      const state = {
        populations: [null, mockPopulation1] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        createPopulationAtPosition({
          position: 0,
          population: { label: 'New Population' },
        })
      );

      // Then - new population should be created since position was null
      expect(newState.populations[0]).toEqual({
        label: 'New Population',
        isCreated: false,
        household: null,
        geography: null,
      });
      expect(newState.populations[1]).toEqual(mockPopulation1); // Other position unchanged
    });
  });

  describe('Updating Populations at Position', () => {
    test('given updatePopulationAtPosition updates existing population', () => {
      // Given
      const state = {
        populations: [mockPopulation1, null] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        updatePopulationAtPosition({
          position: 0,
          updates: { label: TEST_LABEL_UPDATED, isCreated: false },
        })
      );

      // Then
      expect(newState.populations[0]).toEqual({
        ...mockPopulation1,
        label: TEST_LABEL_UPDATED,
        isCreated: false,
      });
    });

    test('given updatePopulationAtPosition on empty slot then throws error', () => {
      // Given
      const state = emptyInitialState;

      // When/Then
      expect(() => {
        populationReducer(
          state,
          updatePopulationAtPosition({
            position: 0,
            updates: { label: TEST_LABEL },
          })
        );
      }).toThrow('Cannot update population at position 0: no population exists at that position');
    });

    test('given updatePopulationIdAtPosition updates ID in household', () => {
      // Given
      const state = {
        populations: [mockPopulation1, null] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        updatePopulationIdAtPosition({
          position: 0,
          id: 'new-household-id',
        })
      );

      // Then
      expect(newState.populations[0]?.household?.id).toBe('new-household-id');
    });

    test('given updatePopulationIdAtPosition updates ID in geography', () => {
      // Given
      const state = {
        populations: [mockPopulation2, null] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        updatePopulationIdAtPosition({
          position: 0,
          id: 'new-geo-id',
        })
      );

      // Then
      expect(newState.populations[0]?.geography?.id).toBe('new-geo-id');
    });

    test('given updatePopulationIdAtPosition on empty slot then throws error', () => {
      // Given
      const state = emptyInitialState;

      // When/Then
      expect(() => {
        populationReducer(
          state,
          updatePopulationIdAtPosition({
            position: 0,
            id: 'some-id',
          })
        );
      }).toThrow(
        'Cannot update population ID at position 0: no population exists at that position'
      );
    });
  });

  describe('Setting Household at Position', () => {
    test('given setHouseholdAtPosition sets household and clears geography', () => {
      // Given
      const state = {
        populations: [mockPopulation2, null] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        setHouseholdAtPosition({
          position: 0,
          household: mockHousehold2,
        })
      );

      // Then
      expect(newState.populations[0]?.household).toEqual(mockHousehold2);
      expect(newState.populations[0]?.geography).toBeNull();
    });

    test('given setHouseholdAtPosition on empty slot then throws error', () => {
      // Given
      const state = emptyInitialState;

      // When/Then
      expect(() => {
        populationReducer(
          state,
          setHouseholdAtPosition({
            position: 0,
            household: mockHousehold1,
          })
        );
      }).toThrow('Cannot set household at position 0: no population exists at that position');
    });

    test('given initializeHouseholdAtPosition creates household', () => {
      // Given
      const state = {
        populations: [
          { label: TEST_LABEL, isCreated: false, household: null, geography: null },
          null,
        ] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        initializeHouseholdAtPosition({
          position: 0,
          countryId: 'us',
          year: '2024',
        })
      );

      // Then
      expect(newState.populations[0]?.household).toEqual({
        id: undefined,
        countryId: 'us',
        householdData: {
          people: {},
        },
      });
      expect(newState.populations[0]?.geography).toBeNull();
    });

    test('given initializeHouseholdAtPosition on empty slot creates population and household', () => {
      // Given
      const state = emptyInitialState;

      // When
      const newState = populationReducer(
        state,
        initializeHouseholdAtPosition({
          position: 0,
          countryId: 'uk',
          year: '2023',
        })
      );

      // Then
      expect(newState.populations[0]).toBeTruthy();
      expect(newState.populations[0]?.household).toEqual({
        id: undefined,
        countryId: 'uk',
        householdData: {
          people: {},
        },
      });
    });
  });

  describe('Setting Geography at Position', () => {
    test('given setGeographyAtPosition sets geography and clears household', () => {
      // Given
      const state = {
        populations: [mockPopulation1, null] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(
        state,
        setGeographyAtPosition({
          position: 0,
          geography: mockGeography2,
        })
      );

      // Then
      expect(newState.populations[0]?.geography).toEqual(mockGeography2);
      expect(newState.populations[0]?.household).toBeNull();
    });

    test('given setGeographyAtPosition on empty slot then throws error', () => {
      // Given
      const state = emptyInitialState;

      // When/Then
      expect(() => {
        populationReducer(
          state,
          setGeographyAtPosition({
            position: 0,
            geography: mockGeography1,
          })
        );
      }).toThrow('Cannot set geography at position 0: no population exists at that position');
    });
  });

  describe('Clearing Populations', () => {
    test('given clearPopulationAtPosition then clears specific position', () => {
      // Given
      const state = {
        populations: [mockPopulation1, mockPopulation2] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(state, clearPopulationAtPosition(0));

      // Then
      expect(newState.populations[0]).toBeNull();
      expect(newState.populations[1]).toEqual(mockPopulation2);
    });

    test('given clearAllPopulations then clears all positions', () => {
      // Given
      const state = {
        populations: [mockPopulation1, mockPopulation2] as [Population | null, Population | null],
      };

      // When
      const newState = populationReducer(state, clearAllPopulations());

      // Then
      expect(newState.populations[0]).toBeNull();
      expect(newState.populations[1]).toBeNull();
    });
  });

  describe('Selectors', () => {
    describe('selectPopulationAtPosition', () => {
      test('given population exists at position then returns population', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation1, mockPopulation2] as [
              Population | null,
              Population | null,
            ],
          },
        };

        // When
        const result = selectPopulationAtPosition(state, 0);

        // Then
        expect(result).toEqual(mockPopulation1);
      });

      test('given no population at position then returns null', () => {
        // Given
        const state = {
          population: {
            populations: [null, mockPopulation2] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectPopulationAtPosition(state, 0);

        // Then
        expect(result).toBeNull();
      });
    });

    describe('selectAllPopulations', () => {
      test('given two populations then returns array with both', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation1, mockPopulation2] as [
              Population | null,
              Population | null,
            ],
          },
        };

        // When
        const result = selectAllPopulations(state);

        // Then
        expect(result).toEqual([mockPopulation1, mockPopulation2]);
      });

      test('given one population then returns array with one', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation1, null] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectAllPopulations(state);

        // Then
        expect(result).toEqual([mockPopulation1]);
      });

      test('given no populations then returns empty array', () => {
        // Given
        const state = {
          population: emptyInitialState,
        };

        // When
        const result = selectAllPopulations(state);

        // Then
        expect(result).toEqual([]);
      });
    });

    describe('selectHasPopulationAtPosition', () => {
      test('given population exists at position then returns true', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation1, null] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectHasPopulationAtPosition(state, 0);

        // Then
        expect(result).toBe(true);
      });

      test('given no population at position then returns false', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation1, null] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectHasPopulationAtPosition(state, 1);

        // Then
        expect(result).toBe(false);
      });
    });

    describe('selectHouseholdAtPosition', () => {
      test('given household exists at position then returns household', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation1, null] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectHouseholdAtPosition(state, 0);

        // Then
        expect(result).toEqual(mockHousehold1);
      });

      test('given no household at position then returns null', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation2, null] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectHouseholdAtPosition(state, 0);

        // Then
        expect(result).toBeNull();
      });
    });

    describe('selectGeographyAtPosition', () => {
      test('given geography exists at position then returns geography', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation2, null] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectGeographyAtPosition(state, 0);

        // Then
        expect(result).toEqual(mockGeography1);
      });

      test('given no geography at position then returns null', () => {
        // Given
        const state = {
          population: {
            populations: [mockPopulation1, null] as [Population | null, Population | null],
          },
        };

        // When
        const result = selectGeographyAtPosition(state, 0);

        // Then
        expect(result).toBeNull();
      });
    });
  });
});
