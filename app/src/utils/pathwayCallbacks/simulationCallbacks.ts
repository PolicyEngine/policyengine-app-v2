import { useCallback } from 'react';
import { SimulationStateProps, PolicyStateProps, PopulationStateProps } from '@/types/pathwayState';
import { EnhancedUserSimulation } from '@/hooks/useUserSimulations';

/**
 * Factory for creating reusable simulation-related callbacks
 * Can be used across Report and Simulation pathways
 *
 * @param setState - State setter function
 * @param simulationSelector - Function to extract simulation from state
 * @param simulationUpdater - Function to update simulation in state
 * @param navigateToMode - Navigation function
 * @param returnMode - Mode to navigate to after completing simulation operations
 */
export function createSimulationCallbacks<TState, TMode>(
  setState: React.Dispatch<React.SetStateAction<TState>>,
  simulationSelector: (state: TState) => SimulationStateProps,
  simulationUpdater: (state: TState, simulation: SimulationStateProps) => TState,
  navigateToMode: (mode: TMode) => void,
  returnMode: TMode
) {
  const updateLabel = useCallback((label: string) => {
    setState((prev) => {
      const simulation = simulationSelector(prev);
      return simulationUpdater(prev, { ...simulation, label });
    });
  }, [setState, simulationSelector, simulationUpdater]);

  const handleSubmitSuccess = useCallback((simulationId: string) => {
    setState((prev) => {
      const simulation = simulationSelector(prev);
      return simulationUpdater(prev, {
        ...simulation,
        id: simulationId,
      });
    });
    navigateToMode(returnMode);
  }, [setState, simulationSelector, simulationUpdater, navigateToMode, returnMode]);

  const handleSelectExisting = useCallback((enhancedSimulation: EnhancedUserSimulation) => {
    if (!enhancedSimulation.simulation) {
      console.error('[simulationCallbacks] No simulation data in enhancedSimulation');
      return;
    }

    const simulation = enhancedSimulation.simulation;
    const label = enhancedSimulation.userSimulation?.label || simulation.label || '';

    // Reconstruct PolicyStateProps from enhanced data
    const policy: PolicyStateProps = {
      id: enhancedSimulation.policy?.id || simulation.policyId,
      label: enhancedSimulation.userPolicy?.label || enhancedSimulation.policy?.label || null,
      parameters: enhancedSimulation.policy?.parameters || [],
    };

    // Reconstruct PopulationStateProps from enhanced data
    let population: PopulationStateProps;

    if (simulation.populationType === 'household' && enhancedSimulation.household) {
      population = {
        household: enhancedSimulation.household,
        geography: null,
        label: enhancedSimulation.userHousehold?.label || null,
        type: 'household',
      };
    } else if (simulation.populationType === 'geography' && enhancedSimulation.geography) {
      population = {
        household: null,
        geography: enhancedSimulation.geography,
        label: enhancedSimulation.userHousehold?.label || null,
        type: 'geography',
      };
    } else {
      console.error('[simulationCallbacks] Unable to determine population type or missing population data');
      return;
    }

    setState((prev) =>
      simulationUpdater(prev, {
        ...simulationSelector(prev),
        id: simulation.id,
        label,
        countryId: simulation.countryId,
        apiVersion: simulation.apiVersion,
        policy,
        population,
      })
    );
    navigateToMode(returnMode);
  }, [setState, simulationSelector, simulationUpdater, navigateToMode, returnMode]);

  return {
    updateLabel,
    handleSubmitSuccess,
    handleSelectExisting,
  };
}
