import { EnhancedUserSimulation } from '@/hooks/useUserSimulations';
import { PolicyStateProps, PopulationStateProps, SimulationStateProps } from '@/types/pathwayState';

/**
 * Reconstructs a SimulationStateProps object from an EnhancedUserSimulation
 * Used when loading existing simulations in pathways
 *
 * @param enhancedSimulation - The enhanced simulation data from useUserSimulations
 * @returns A fully-formed SimulationStateProps object
 * @throws Error if simulation data is missing or invalid
 */
export function reconstructSimulationFromEnhanced(
  enhancedSimulation: EnhancedUserSimulation
): SimulationStateProps {
  if (!enhancedSimulation.simulation) {
    throw new Error('[reconstructSimulation] No simulation data in enhancedSimulation');
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
    throw new Error(
      '[reconstructSimulation] Unable to determine population type or missing population data'
    );
  }

  return {
    id: simulation.id,
    label,
    countryId: simulation.countryId,
    apiVersion: simulation.apiVersion,
    status: simulation.status,
    output: simulation.output,
    policy,
    population,
  };
}
