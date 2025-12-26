import { useCallback } from 'react';
import { Geography } from '@/types/ingredients/Geography';
import { Household } from '@/types/ingredients/Household';
import { PopulationStateProps } from '@/types/pathwayState';

/**
 * Factory for creating reusable population-related callbacks
 * Can be used across Report, Simulation, and Population pathways
 *
 * @param setState - State setter function
 * @param populationSelector - Function to extract population from state
 * @param populationUpdater - Function to update population in state
 * @param navigateToMode - Navigation function
 * @param returnMode - Mode to navigate to after completing population operations
 * @param labelMode - Mode to navigate to for labeling
 * @param onPopulationComplete - Optional callbacks for custom navigation after population submission
 */
export function createPopulationCallbacks<TState, TMode>(
  setState: React.Dispatch<React.SetStateAction<TState>>,
  populationSelector: (state: TState) => PopulationStateProps,
  populationUpdater: (state: TState, population: PopulationStateProps) => TState,
  navigateToMode: (mode: TMode) => void,
  returnMode: TMode,
  labelMode: TMode,
  onPopulationComplete?: {
    onHouseholdComplete?: (householdId: string, household: Household) => void;
    onGeographyComplete?: (geographyId: string, label: string) => void;
  }
) {
  const updateLabel = useCallback(
    (label: string) => {
      setState((prev) => {
        const population = populationSelector(prev);
        return populationUpdater(prev, { ...population, label });
      });
    },
    [setState, populationSelector, populationUpdater]
  );

  const handleScopeSelected = useCallback(
    (geography: Geography | null, _scopeType: string) => {
      setState((prev) => {
        const population = populationSelector(prev);
        return populationUpdater(prev, {
          ...population,
          geography: geography || null,
          type: geography ? 'geography' : 'household',
        });
      });
      navigateToMode(labelMode);
    },
    [setState, populationSelector, populationUpdater, navigateToMode, labelMode]
  );

  const handleSelectExistingHousehold = useCallback(
    (householdId: string, household: Household, label: string) => {
      setState((prev) =>
        populationUpdater(prev, {
          household: { ...household, id: householdId },
          geography: null,
          label,
          type: 'household',
        })
      );
      navigateToMode(returnMode);
    },
    [setState, populationUpdater, navigateToMode, returnMode]
  );

  const handleSelectExistingGeography = useCallback(
    (geographyId: string, geography: Geography, label: string) => {
      setState((prev) =>
        populationUpdater(prev, {
          household: null,
          geography: { ...geography, id: geographyId },
          label,
          type: 'geography',
        })
      );
      navigateToMode(returnMode);
    },
    [setState, populationUpdater, navigateToMode, returnMode]
  );

  const handleHouseholdSubmitSuccess = useCallback(
    (householdId: string, household: Household) => {
      setState((prev) => {
        const population = populationSelector(prev);
        return populationUpdater(prev, {
          ...population,
          household: { ...household, id: householdId },
        });
      });

      // Use custom navigation if provided, otherwise use default
      if (onPopulationComplete?.onHouseholdComplete) {
        onPopulationComplete.onHouseholdComplete(householdId, household);
      } else {
        navigateToMode(returnMode);
      }
    },
    [
      setState,
      populationSelector,
      populationUpdater,
      navigateToMode,
      returnMode,
      onPopulationComplete,
    ]
  );

  const handleGeographicSubmitSuccess = useCallback(
    (geographyId: string, label: string) => {
      setState((prev) => {
        const population = populationSelector(prev);
        const updatedPopulation = { ...population };
        if (updatedPopulation.geography) {
          updatedPopulation.geography.id = geographyId;
        }
        updatedPopulation.label = label;
        return populationUpdater(prev, updatedPopulation);
      });

      // Use custom navigation if provided, otherwise use default
      if (onPopulationComplete?.onGeographyComplete) {
        onPopulationComplete.onGeographyComplete(geographyId, label);
      } else {
        navigateToMode(returnMode);
      }
    },
    [
      setState,
      populationSelector,
      populationUpdater,
      navigateToMode,
      returnMode,
      onPopulationComplete,
    ]
  );

  return {
    updateLabel,
    handleScopeSelected,
    handleSelectExistingHousehold,
    handleSelectExistingGeography,
    handleHouseholdSubmitSuccess,
    handleGeographicSubmitSuccess,
  };
}
