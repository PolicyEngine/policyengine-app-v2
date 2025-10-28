import { createPopulationAtPosition } from '@/reducers/populationReducer';
import { AppDispatch } from '@/store';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { Population } from '@/types/ingredients/Population';

/**
 * Deep copies a household object to avoid reference issues.
 * The householdData property contains nested objects (people, families, etc.)
 * that need to be cloned to prevent mutations.
 *
 * @param household - The household to copy
 * @returns A deep copy of the household
 */
function deepCopyHousehold(household: Household): Household {
  return {
    id: household.id,
    countryId: household.countryId,
    // Use JSON serialization for deep nested structures
    // This ensures people, families, taxUnits, etc. are all copied
    householdData: JSON.parse(JSON.stringify(household.householdData)),
  };
}

/**
 * Deep copies a geography object.
 * Geography is relatively flat, so we can copy fields explicitly.
 *
 * @param geography - The geography to copy
 * @returns A deep copy of the geography
 */
function deepCopyGeography(geography: Geography): Geography {
  return {
    id: geography.id,
    countryId: geography.countryId,
    scope: geography.scope,
    geographyId: geography.geographyId,
    name: geography.name,
  };
}

/**
 * Deep copies a population object to avoid reference issues.
 * This ensures that modifying the copied population doesn't affect the original.
 *
 * @param population - The population to copy
 * @returns A deep copy of the population
 */
export function deepCopyPopulation(population: Population): Population {
  return {
    label: population.label,
    isCreated: population.isCreated,
    household: population.household ? deepCopyHousehold(population.household) : null,
    geography: population.geography ? deepCopyGeography(population.geography) : null,
  };
}

/**
 * Copies a population from one source to a target position in the Redux store.
 * This is a utility function that can be used outside of component context.
 *
 * The population is deep-copied to avoid reference issues, then dispatched
 * to the specified position in the store.
 *
 * @param dispatch - The Redux dispatch function
 * @param sourcePopulation - The population to copy
 * @param targetPosition - The position (0 or 1) to copy the population to
 */
export function copyPopulationToPosition(
  dispatch: AppDispatch,
  sourcePopulation: Population,
  targetPosition: 0 | 1
): void {
  const copiedPopulation = deepCopyPopulation(sourcePopulation);

  dispatch(
    createPopulationAtPosition({
      position: targetPosition,
      population: copiedPopulation,
    })
  );
}
