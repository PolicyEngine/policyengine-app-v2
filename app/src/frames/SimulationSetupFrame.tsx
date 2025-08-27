import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import {
  updateSimulationPolicyId,
  updateSimulationPopulationId,
} from '@/reducers/simulationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

type SetupCard = 'population' | 'policy';

export default function SimulationSetupFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const simulation = useSelector((state: RootState) => state.simulation);
  const policy = useSelector((state: RootState) => state.policy);
  const population = useSelector((state: RootState) => state.population);
  const [selectedCard, setSelectedCard] = useState<SetupCard | null>(null);

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
    } else if (simulation.policyId && simulation.populationId) {
      // Both are fulfilled, proceed to next step
      onNavigate('next');
    }
  };

  // Listen for policy creation and update simulation with policy ID
  useEffect(() => {
    if (policy.isCreated && policy.id && !simulation.policyId) {
      dispatch(updateSimulationPolicyId(policy.id));
    }
  }, [policy.isCreated, policy.id, simulation.policyId, dispatch]);

  // Listen for population creation and update simulation with population ID
  useEffect(() => {
    if (population.isCreated && !simulation.populationId) {
      if (population.household?.id) {
        dispatch(updateSimulationPopulationId({ id: population.household.id, type: 'household' }));
      } else if (population.geography?.id) {
        dispatch(updateSimulationPopulationId({ id: population.geography.id, type: 'geography' }));
      }
    }
  }, [
    population.isCreated,
    population.household,
    population.geography,
    simulation.populationId,
    dispatch,
  ]);

  const canProceed: boolean = !!(simulation.policyId && simulation.populationId);

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
