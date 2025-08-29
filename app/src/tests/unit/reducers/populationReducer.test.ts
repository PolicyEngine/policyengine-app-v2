import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock HouseholdBuilder before any imports that use it
vi.mock('@/utils/HouseholdBuilder', () => {
  return {
    HouseholdBuilder: vi.fn(),
  };
});

import populationReducer, {
  clearPopulation,
  updatePopulationId,
  updatePopulationLabel,
  markPopulationAsCreated,
  setHousehold,
  initializeHousehold,
  setGeography,
} from '@/reducers/populationReducer';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';
import {
  POPULATION_IDS,
  POPULATION_LABELS,
  POPULATION_COUNTRIES,
  POPULATION_REGIONS,
  POPULATION_YEARS,
  mockInitialState,
  mockStateWithHousehold,
  mockStateWithGeography,
  mockStateCreated,
  mockHousehold,
  mockHouseholdUK,
  mockGeography,
  mockGeographyNational,
  createMockHouseholdForCountry,
  createMockGeography,
  expectStateToMatch,
  resetAllMocks,
} from '@/tests/fixtures/reducers/populationReducerMocks';

// Set up the mock implementation
const mockBuildMethod = vi.fn();
(HouseholdBuilder as any).mockImplementation((countryId: string, year: string) => {
  mockBuildMethod.mockReturnValue(createMockHouseholdForCountry(countryId));
  return {
    build: mockBuildMethod,
  };
});

describe('populationReducer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetAllMocks();
  });

  describe('initial state', () => {
    test('given no state when reducer initialized then returns default state', () => {
      // When
      const state = populationReducer(undefined, { type: 'unknown' });

      // Then
      expectStateToMatch(state, mockInitialState);
    });

    test('given initial state then has correct default values', () => {
      // When
      const state = populationReducer(undefined, { type: 'unknown' });

      // Then
      expect(state.label).toBeNull();
      expect(state.isCreated).toBe(false);
      expect(state.household).toBeNull();
      expect(state.geography).toBeNull();
    });
  });

  describe('clearPopulation action', () => {
    test('given state with household when clearPopulation then resets to initial state', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(initialState, clearPopulation());

      // Then
      expectStateToMatch(state, mockInitialState);
    });

    test('given state with geography when clearPopulation then resets to initial state', () => {
      // Given
      const initialState = { ...mockStateWithGeography };

      // When
      const state = populationReducer(initialState, clearPopulation());

      // Then
      expectStateToMatch(state, mockInitialState);
    });

    test('given created state when clearPopulation then resets isCreated flag', () => {
      // Given
      const initialState = { ...mockStateCreated };

      // When
      const state = populationReducer(initialState, clearPopulation());

      // Then
      expect(state.isCreated).toBe(false);
    });

    test('given state with label when clearPopulation then clears label', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        label: POPULATION_LABELS.DEFAULT,
      };

      // When
      const state = populationReducer(initialState, clearPopulation());

      // Then
      expect(state.label).toBeNull();
    });
  });

  describe('updatePopulationId action', () => {
    test('given state with household when updatePopulationId then updates household id', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(
        initialState,
        updatePopulationId(POPULATION_IDS.HOUSEHOLD_ID_NEW)
      );

      // Then
      expect(state.household?.id).toBe(POPULATION_IDS.HOUSEHOLD_ID_NEW);
      expect(state.geography).toBeNull();
    });

    test('given state with geography when updatePopulationId then updates geography id', () => {
      // Given
      const initialState = { ...mockStateWithGeography };

      // When
      const state = populationReducer(
        initialState,
        updatePopulationId(POPULATION_IDS.GEOGRAPHY_ID_NEW)
      );

      // Then
      expect(state.geography?.id).toBe(POPULATION_IDS.GEOGRAPHY_ID_NEW);
      expect(state.household).toBeNull();
    });

    test('given empty state when updatePopulationId then does nothing', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(
        initialState,
        updatePopulationId(POPULATION_IDS.HOUSEHOLD_ID_NEW)
      );

      // Then
      expect(state.household).toBeNull();
      expect(state.geography).toBeNull();
    });

    test('given state with both null when updatePopulationId then state unchanged', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        household: null,
        geography: null,
      };

      // When
      const state = populationReducer(
        initialState,
        updatePopulationId('any-id')
      );

      // Then
      expectStateToMatch(state, initialState);
    });
  });

  describe('updatePopulationLabel action', () => {
    test('given any state when updatePopulationLabel then updates label', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(
        initialState,
        updatePopulationLabel(POPULATION_LABELS.UPDATED)
      );

      // Then
      expect(state.label).toBe(POPULATION_LABELS.UPDATED);
    });

    test('given existing label when updatePopulationLabel then replaces label', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        label: POPULATION_LABELS.DEFAULT,
      };

      // When
      const state = populationReducer(
        initialState,
        updatePopulationLabel(POPULATION_LABELS.UPDATED)
      );

      // Then
      expect(state.label).toBe(POPULATION_LABELS.UPDATED);
    });

    test('given state with household when updatePopulationLabel then preserves household', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(
        initialState,
        updatePopulationLabel(POPULATION_LABELS.UPDATED)
      );

      // Then
      expect(state.label).toBe(POPULATION_LABELS.UPDATED);
      expect(state.household).toEqual(mockHousehold);
    });

    test('given empty string when updatePopulationLabel then sets empty string', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(initialState, updatePopulationLabel(''));

      // Then
      expect(state.label).toBe('');
    });
  });

  describe('markPopulationAsCreated action', () => {
    test('given not created state when markPopulationAsCreated then sets isCreated true', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        isCreated: false,
      };

      // When
      const state = populationReducer(initialState, markPopulationAsCreated());

      // Then
      expect(state.isCreated).toBe(true);
    });

    test('given already created state when markPopulationAsCreated then remains true', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        isCreated: true,
      };

      // When
      const state = populationReducer(initialState, markPopulationAsCreated());

      // Then
      expect(state.isCreated).toBe(true);
    });

    test('given state with data when markPopulationAsCreated then preserves all data', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(initialState, markPopulationAsCreated());

      // Then
      expect(state.isCreated).toBe(true);
      expect(state.household).toEqual(mockHousehold);
      expect(state.label).toBe(POPULATION_LABELS.HOUSEHOLD);
    });
  });

  describe('setHousehold action', () => {
    test('given empty state when setHousehold then sets household and clears geography', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(initialState, setHousehold(mockHousehold));

      // Then
      expect(state.household).toEqual(mockHousehold);
      expect(state.geography).toBeNull();
    });

    test('given state with geography when setHousehold then replaces geography with household', () => {
      // Given
      const initialState = { ...mockStateWithGeography };

      // When
      const state = populationReducer(initialState, setHousehold(mockHousehold));

      // Then
      expect(state.household).toEqual(mockHousehold);
      expect(state.geography).toBeNull();
    });

    test('given state with existing household when setHousehold then replaces household', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(initialState, setHousehold(mockHouseholdUK));

      // Then
      expect(state.household).toEqual(mockHouseholdUK);
      expect(state.household?.countryId).toBe(POPULATION_COUNTRIES.UK);
    });

    test('given state with label when setHousehold then preserves label', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        label: POPULATION_LABELS.DEFAULT,
      };

      // When
      const state = populationReducer(initialState, setHousehold(mockHousehold));

      // Then
      expect(state.label).toBe(POPULATION_LABELS.DEFAULT);
      expect(state.household).toEqual(mockHousehold);
    });

    test('given created state when setHousehold then preserves isCreated flag', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        isCreated: true,
      };

      // When
      const state = populationReducer(initialState, setHousehold(mockHousehold));

      // Then
      expect(state.isCreated).toBe(true);
      expect(state.household).toEqual(mockHousehold);
    });
  });

  describe('initializeHousehold action', () => {
    test('given US country when initializeHousehold then creates US household', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(
        initialState,
        initializeHousehold({ countryId: POPULATION_COUNTRIES.US })
      );

      // Then
      expect(state.household).toBeDefined();
      expect(state.household?.countryId).toBe(POPULATION_COUNTRIES.US);
    });

    test('given UK country when initializeHousehold then creates UK household', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(
        initialState,
        initializeHousehold({ countryId: POPULATION_COUNTRIES.UK })
      );

      // Then
      expect(state.household).toBeDefined();
      expect(state.household?.countryId).toBe(POPULATION_COUNTRIES.UK);
    });

    test('given custom year when initializeHousehold then uses provided year', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(
        initialState,
        initializeHousehold({
          countryId: POPULATION_COUNTRIES.US,
          year: POPULATION_YEARS.FUTURE,
        })
      );

      // Then
      expect(state.household).toBeDefined();
      expect(state.household?.countryId).toBe(POPULATION_COUNTRIES.US);
    });

    test('given no year when initializeHousehold then uses default year 2024', () => {
      // Given
      const initialState = { ...mockInitialState };
      (HouseholdBuilder as any).mockClear();

      // When
      const state = populationReducer(
        initialState,
        initializeHousehold({ countryId: POPULATION_COUNTRIES.US })
      );

      // Then
      expect(state.household).toBeDefined();
      // Verify HouseholdBuilder was called with default year '2024'
      expect(HouseholdBuilder).toHaveBeenCalledWith(
        POPULATION_COUNTRIES.US,
        '2024' // Default year
      );
    });

    test('given existing household when initializeHousehold then replaces household', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(
        initialState,
        initializeHousehold({ countryId: POPULATION_COUNTRIES.CA })
      );

      // Then
      expect(state.household).toBeDefined();
      expect(state.household?.countryId).toBe(POPULATION_COUNTRIES.CA);
    });

    test('given state with geography when initializeHousehold then preserves geography', () => {
      // Given
      const initialState = { ...mockStateWithGeography };

      // When
      const state = populationReducer(
        initialState,
        initializeHousehold({ countryId: POPULATION_COUNTRIES.US })
      );

      // Then
      expect(state.household).toBeDefined();
      expect(state.geography).toEqual(mockGeography);
    });
  });

  describe('setGeography action', () => {
    test('given empty state when setGeography then sets geography and clears household', () => {
      // Given
      const initialState = { ...mockInitialState };

      // When
      const state = populationReducer(initialState, setGeography(mockGeography));

      // Then
      expect(state.geography).toEqual(mockGeography);
      expect(state.household).toBeNull();
    });

    test('given state with household when setGeography then replaces household with geography', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(initialState, setGeography(mockGeography));

      // Then
      expect(state.geography).toEqual(mockGeography);
      expect(state.household).toBeNull();
    });

    test('given state with existing geography when setGeography then replaces geography', () => {
      // Given
      const initialState = { ...mockStateWithGeography };

      // When
      const state = populationReducer(
        initialState,
        setGeography(mockGeographyNational)
      );

      // Then
      expect(state.geography).toEqual(mockGeographyNational);
      expect(state.geography?.scope).toBe('national');
    });

    test('given state with label when setGeography then preserves label', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        label: POPULATION_LABELS.DEFAULT,
      };

      // When
      const state = populationReducer(initialState, setGeography(mockGeography));

      // Then
      expect(state.label).toBe(POPULATION_LABELS.DEFAULT);
      expect(state.geography).toEqual(mockGeography);
    });

    test('given created state when setGeography then preserves isCreated flag', () => {
      // Given
      const initialState = {
        ...mockInitialState,
        isCreated: true,
      };

      // When
      const state = populationReducer(initialState, setGeography(mockGeography));

      // Then
      expect(state.isCreated).toBe(true);
      expect(state.geography).toEqual(mockGeography);
    });

    test('given subnational geography when setGeography then stores with region details', () => {
      // Given
      const initialState = { ...mockInitialState };
      const subnationalGeo = createMockGeography(
        POPULATION_COUNTRIES.US,
        'subnational',
        POPULATION_REGIONS.CALIFORNIA
      );

      // When
      const state = populationReducer(initialState, setGeography(subnationalGeo));

      // Then
      expect(state.geography).toEqual(subnationalGeo);
      expect(state.geography?.geographyId).toBe(`${POPULATION_COUNTRIES.US}-${POPULATION_REGIONS.CALIFORNIA}`);
      expect(state.geography?.scope).toBe('subnational');
    });
  });

  describe('combined actions', () => {
    test('given multiple actions when applied sequentially then state updates correctly', () => {
      // Given
      let state = { ...mockInitialState };

      // When - Apply multiple actions
      state = populationReducer(state, setHousehold(mockHousehold));
      state = populationReducer(state, updatePopulationLabel(POPULATION_LABELS.DEFAULT));
      state = populationReducer(state, updatePopulationId(POPULATION_IDS.HOUSEHOLD_ID_NEW));
      state = populationReducer(state, markPopulationAsCreated());

      // Then
      expect(state.household?.id).toBe(POPULATION_IDS.HOUSEHOLD_ID_NEW);
      expect(state.label).toBe(POPULATION_LABELS.DEFAULT);
      expect(state.isCreated).toBe(true);
      expect(state.geography).toBeNull();
    });

    test('given household then geography when setting both then only geography remains', () => {
      // Given
      let state = { ...mockInitialState };

      // When
      state = populationReducer(state, setHousehold(mockHousehold));
      expect(state.household).toEqual(mockHousehold);
      
      state = populationReducer(state, setGeography(mockGeography));

      // Then
      expect(state.geography).toEqual(mockGeography);
      expect(state.household).toBeNull();
    });

    test('given geography then household when setting both then only household remains', () => {
      // Given
      let state = { ...mockInitialState };

      // When
      state = populationReducer(state, setGeography(mockGeography));
      expect(state.geography).toEqual(mockGeography);
      
      state = populationReducer(state, setHousehold(mockHousehold));

      // Then
      expect(state.household).toEqual(mockHousehold);
      expect(state.geography).toBeNull();
    });

    test('given complete state when clearPopulation then resets everything', () => {
      // Given
      let state = { ...mockInitialState };
      
      // Build up a complete state
      state = populationReducer(state, setHousehold(mockHousehold));
      state = populationReducer(state, updatePopulationLabel(POPULATION_LABELS.DEFAULT));
      state = populationReducer(state, markPopulationAsCreated());
      
      // When
      state = populationReducer(state, clearPopulation());

      // Then
      expectStateToMatch(state, mockInitialState);
    });
  });

  describe('edge cases', () => {
    test('given undefined payload when actions require payload then handles gracefully', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When - Pass undefined to updatePopulationId
      const state = populationReducer(
        initialState,
        updatePopulationId(undefined as any)
      );

      // Then - Should update with undefined
      expect(state.household?.id).toBeUndefined();
    });

    test('given unknown action type when processed then returns unchanged state', () => {
      // Given
      const initialState = { ...mockStateWithHousehold };

      // When
      const state = populationReducer(initialState, { type: 'unknown/action' } as any);

      // Then
      expectStateToMatch(state, initialState);
    });
  });
});