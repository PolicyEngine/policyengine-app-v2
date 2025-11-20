import { useCallback } from 'react';
import { ReportStateProps, SimulationStateProps } from '@/types/pathwayState';
import { EnhancedUserSimulation } from '@/hooks/useUserSimulations';
import { reconstructSimulationFromEnhanced } from '@/utils/ingredientReconstruction';

/**
 * Factory for creating reusable report-related callbacks
 * Handles report-level operations including label updates, simulation selection,
 * and simulation management
 *
 * @param setState - State setter function for report state
 * @param navigateToMode - Navigation function
 * @param activeSimulationIndex - Currently active simulation (0 or 1)
 * @param simulationSelectionMode - Mode to navigate to for simulation selection
 * @param setupMode - Mode to return to after operations (typically REPORT_SETUP)
 */
export function createReportCallbacks<TMode>(
  setState: React.Dispatch<React.SetStateAction<ReportStateProps>>,
  navigateToMode: (mode: TMode) => void,
  activeSimulationIndex: 0 | 1,
  simulationSelectionMode: TMode,
  setupMode: TMode
) {
  /**
   * Updates the report label
   */
  const updateLabel = useCallback((label: string) => {
    setState((prev) => ({ ...prev, label }));
  }, [setState]);

  /**
   * Updates the report year
   */
  const updateYear = useCallback((year: string) => {
    setState((prev) => ({ ...prev, year }));
  }, [setState]);

  /**
   * Navigates to simulation selection for a specific simulation slot
   */
  const navigateToSimulationSelection = useCallback((simulationIndex: 0 | 1) => {
    // Note: activeSimulationIndex must be updated by caller before navigation
    navigateToMode(simulationSelectionMode);
  }, [navigateToMode, simulationSelectionMode]);

  /**
   * Handles selecting an existing simulation
   * Reconstructs the simulation from enhanced format and updates state
   */
  const handleSelectExistingSimulation = useCallback((enhancedSimulation: EnhancedUserSimulation) => {
    try {
      const reconstructedSimulation = reconstructSimulationFromEnhanced(enhancedSimulation);

      setState((prev) => {
        const newSimulations = [...prev.simulations] as [SimulationStateProps, SimulationStateProps];
        newSimulations[activeSimulationIndex] = reconstructedSimulation;
        return { ...prev, simulations: newSimulations };
      });

      navigateToMode(setupMode);
    } catch (error) {
      console.error('[ReportCallbacks] Error reconstructing simulation:', error);
      throw error;
    }
  }, [setState, activeSimulationIndex, navigateToMode, setupMode]);

  /**
   * Copies population from the other simulation to the active simulation
   * Report-specific feature for maintaining population consistency
   */
  const copyPopulationFromOtherSimulation = useCallback(() => {
    const otherIndex = activeSimulationIndex === 0 ? 1 : 0;

    setState((prev) => {
      const newSimulations = [...prev.simulations] as [SimulationStateProps, SimulationStateProps];
      newSimulations[activeSimulationIndex].population = {
        ...prev.simulations[otherIndex].population
      };
      return { ...prev, simulations: newSimulations };
    });

    navigateToMode(setupMode);
  }, [setState, activeSimulationIndex, navigateToMode, setupMode]);

  /**
   * Pre-fills simulation 2's population from simulation 1
   * Used when creating second simulation to maintain population consistency
   */
  const prefillPopulation2FromSimulation1 = useCallback(() => {
    setState((prev) => {
      const sim1Population = prev.simulations[0].population;
      const newSimulations = [...prev.simulations] as [SimulationStateProps, SimulationStateProps];
      newSimulations[1] = {
        ...newSimulations[1],
        population: { ...sim1Population },
      };
      return {
        ...prev,
        simulations: newSimulations,
      };
    });
  }, [setState]);

  return {
    updateLabel,
    updateYear,
    navigateToSimulationSelection,
    handleSelectExistingSimulation,
    copyPopulationFromOtherSimulation,
    prefillPopulation2FromSimulation1,
  };
}
