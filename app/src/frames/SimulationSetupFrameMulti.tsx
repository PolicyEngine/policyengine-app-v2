import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import {
  updateSimulationPolicyId as updateSimulationPolicyIdNew,
  updateSimulationPopulationId as updateSimulationPopulationIdNew,
  selectActiveSimulation,
  selectActiveSimulationId,
  createSimulation,
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

type SetupCard = 'population' | 'policy';

interface SimulationSetupFrameMultiProps extends FlowComponentProps {
  simulationId?: string; // Optional specific simulation ID to edit
}

/**
 * Multi-mode version of SimulationSetupFrame that uses the normalized simulations reducer
 * This component works with the new state structure while maintaining the same UI/UX
 */
export default function SimulationSetupFrameMulti({ 
  onNavigate, 
  simulationId 
}: SimulationSetupFrameMultiProps) {
  const dispatch = useDispatch();
  
  // Get the active simulation from the new normalized state
  const activeSimulationId = useSelector((state: RootState) => selectActiveSimulationId(state));
  const simulation = useSelector((state: RootState) => selectActiveSimulation(state));
  
  // Still use the old policy and population reducers for now (they haven't been migrated yet)
  const policy = useSelector((state: RootState) => state.policy);
  const population = useSelector((state: RootState) => state.population);
  
  const [selectedCard, setSelectedCard] = useState<SetupCard | null>(null);
  
  // Ensure we have an active simulation in the new reducer
  useEffect(() => {
    if (!activeSimulationId) {
      dispatch(createSimulation());
    }
  }, [activeSimulationId, dispatch]);

  const handlePopulationSelect = () => {
    setSelectedCard('population');
  };

  const handlePolicySelect = () => {
    setSelectedCard('policy');
  };

  const handleNext = () => {
    if (selectedCard === 'population' && !population.isCreated) {
      onNavigate('setupPopulation');
    } else if (selectedCard === 'policy' && !policy.isCreated) {
      onNavigate('setupPolicy');
    } else if (simulation?.policyId && simulation?.populationId) {
      // Both are fulfilled, proceed to next step
      onNavigate('next');
    }
  };

  // Listen for policy creation and update simulation with policy ID
  useEffect(() => {
    if (policy.isCreated && policy.id && !simulation?.policyId) {
      // Dispatch to new reducer with the specific simulation ID
      dispatch(updateSimulationPolicyIdNew({ 
        simulationId: simulationId || activeSimulationId || undefined,
        policyId: policy.id 
      }));
    }
  }, [policy.isCreated, policy.id, simulation?.policyId, simulationId, activeSimulationId, dispatch]);

  // Listen for population creation and update simulation with population ID
  useEffect(() => {

    console.log("Population state in new effect hook:", population);
    console.log("Simulation state in new effect hook:", simulation)
    if (population.isCreated && !simulation?.populationId) {
      console.log("Responding to update to population in new effect hook");
      if (population.household?.id) {
        dispatch(updateSimulationPopulationIdNew({ 
          simulationId: simulationId || activeSimulationId || undefined,
          populationId: population.household.id, 
          populationType: 'household' 
        }));
      } else if (population.geography?.id) {
        dispatch(updateSimulationPopulationIdNew({ 
          simulationId: simulationId || activeSimulationId || undefined,
          populationId: population.geography.id, 
          populationType: 'geography' 
        }));
      }
    }
  }, [
    population.isCreated,
    population.household,
    population.geography,
    simulation?.populationId,
    simulationId,
    activeSimulationId,
    dispatch,
  ]);

  const canProceed: boolean = !!(simulation?.policyId && simulation?.populationId);

  const setupConditionCards = [
    {
      title:
        population && population.isCreated
          ? population.label ||
            `Population #${population.household?.id || population.geography?.id}`
          : 'Add Population',
      description:
        population && population.isCreated
          ? population.label || ''
          : 'Select a geographic scope or specific household',
      onClick: handlePopulationSelect,
      isSelected: selectedCard === 'population',
      isFulfilled: population && population.isCreated,
      isDisabled: false,
    },
    {
      title: policy && policy.isCreated ? policy.label || `Policy #${policy.id}` : 'Add Policy',
      description:
        policy && policy.isCreated
          ? policy.label || ''
          : 'Select a policy to apply to the simulation',
      onClick: handlePolicySelect,
      isSelected: selectedCard === 'policy',
      isFulfilled: policy && policy.isCreated,
      isDisabled: false,
    },
  ];

  // Determine the primary action label and state
  const getPrimaryAction = () => {
    if (selectedCard === 'population' && !population.isCreated) {
      return {
        label: 'Setup Population',
        onClick: handleNext,
        isDisabled: false,
      };
    } else if (selectedCard === 'policy' && !policy.isCreated) {
      return {
        label: 'Setup Policy',
        onClick: handleNext,
        isDisabled: false,
      };
    } else if (canProceed) {
      return {
        label: 'Next',
        onClick: handleNext,
        isDisabled: false,
      };
    }
    return {
      label: 'Next',
      onClick: handleNext,
      isDisabled: true,
    };
  };

  const primaryAction = getPrimaryAction();

  return (
    <FlowView
      title="Setup Simulation"
      variant="setupConditions"
      setupConditionCards={setupConditionCards}
      primaryAction={primaryAction}
    />
  );
}