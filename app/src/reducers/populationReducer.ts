// src/reducers/populationReducer.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CURRENT_YEAR } from '@/constants';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Population } from '@/types/ingredients/Population';
import { HouseholdBuilder } from '@/utils/HouseholdBuilder';

// Position-based storage for exactly 2 populations
interface PopulationState {
  populations: [Population | null, Population | null];
}

const initialState: PopulationState = {
  populations: [null, null],
};

export const populationSlice = createSlice({
  name: 'population',
  initialState,
  reducers: {
    /**
     * Creates a population at the specified position if one doesn't already exist.
     * If a population already exists at that position, this action does nothing,
     * preserving the existing population data.
     * @param position - The position (0 or 1) where the population should be created
     * @param population - Optional partial population data to initialize with
     */
    createPopulationAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        population?: Partial<Population>;
      }>
    ) => {
      const { position, population } = action.payload;

      // Only create if no population exists at this position
      if (!state.populations[position]) {
        const newPopulation: Population = {
          label: null,
          isCreated: false,
          household: null,
          geography: null,
          ...population,
        };
        state.populations[position] = newPopulation;
      }
    },

    // Update population at position
    updatePopulationAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        updates: Partial<Population>;
      }>
    ) => {
      const population = state.populations[action.payload.position];
      if (!population) {
        throw new Error(
          `Cannot update population at position ${action.payload.position}: no population exists at that position`
        );
      }
      state.populations[action.payload.position] = {
        ...population,
        ...action.payload.updates,
      };
    },

    // Update population ID at position
    updatePopulationIdAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        id: string;
      }>
    ) => {
      const population = state.populations[action.payload.position];
      if (!population) {
        throw new Error(
          `Cannot update population ID at position ${action.payload.position}: no population exists at that position`
        );
      }
      // Update ID in the appropriate population type
      if (population.household) {
        population.household.id = action.payload.id;
      } else if (population.geography) {
        population.geography.id = action.payload.id;
      }
    },

    // Set household at position
    setHouseholdAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        household: Household;
      }>
    ) => {
      const population = state.populations[action.payload.position];
      if (!population) {
        throw new Error(
          `Cannot set household at position ${action.payload.position}: no population exists at that position`
        );
      }
      population.household = action.payload.household;
      population.geography = null; // Clear geography when setting household
    },

    // Initialize household at position
    initializeHouseholdAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        countryId: string;
        year?: string;
      }>
    ) => {
      const population = state.populations[action.payload.position];
      if (!population) {
        // Create population if it doesn't exist
        state.populations[action.payload.position] = {
          label: null,
          isCreated: false,
          household: null,
          geography: null,
        };
      }
      const { countryId, year } = action.payload;
      const householdYear = year || CURRENT_YEAR;
      if (!year) {
        // eslint-disable-next-line no-console -- Legitimate error for debugging missing year parameter
        console.error(
          '[populationReducer.initializeHouseholdAtPosition] No year provided - this is likely a bug. ' +
            `Falling back to CURRENT_YEAR (${CURRENT_YEAR}). ` +
            'Please ensure year is passed from report state.'
        );
      }
      const builder = new HouseholdBuilder(countryId as any, householdYear);
      state.populations[action.payload.position]!.household = builder.build();
      state.populations[action.payload.position]!.geography = null;
    },

    // Set geography at position
    setGeographyAtPosition: (
      state,
      action: PayloadAction<{
        position: 0 | 1;
        geography: Geography;
      }>
    ) => {
      const population = state.populations[action.payload.position];
      if (!population) {
        throw new Error(
          `Cannot set geography at position ${action.payload.position}: no population exists at that position`
        );
      }
      population.geography = action.payload.geography;
      population.household = null; // Clear household when setting geography
    },

    // Clear population at position
    clearPopulationAtPosition: (state, action: PayloadAction<0 | 1>) => {
      state.populations[action.payload] = null;
    },

    // Clear all populations
    clearAllPopulations: (state) => {
      state.populations = [null, null];
    },
  },
});

// Action creators are generated for each case reducer function
export const {
  createPopulationAtPosition,
  updatePopulationAtPosition,
  updatePopulationIdAtPosition,
  setHouseholdAtPosition,
  initializeHouseholdAtPosition,
  setGeographyAtPosition,
  clearPopulationAtPosition,
  clearAllPopulations,
} = populationSlice.actions;

// Selectors
export const selectPopulationAtPosition = (
  state: { population: PopulationState },
  position: 0 | 1
): Population | null => {
  return state.population?.populations[position] || null;
};

export const selectAllPopulations = (state: { population: PopulationState }): Population[] => {
  const populations: Population[] = [];
  const [pop1, pop2] = state.population?.populations || [null, null];
  if (pop1) {
    populations.push(pop1);
  }
  if (pop2) {
    populations.push(pop2);
  }
  return populations;
};

export const selectHasPopulationAtPosition = (
  state: { population: PopulationState },
  position: 0 | 1
): boolean => {
  return state.population?.populations[position] !== null;
};

export const selectHouseholdAtPosition = (
  state: { population: PopulationState },
  position: 0 | 1
): Household | null => {
  return state.population?.populations[position]?.household || null;
};

export const selectGeographyAtPosition = (
  state: { population: PopulationState },
  position: 0 | 1
): Geography | null => {
  return state.population?.populations[position]?.geography || null;
};

export default populationSlice.reducer;
