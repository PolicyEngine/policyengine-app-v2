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

  useEffect(() => {
    console.log("Current Simulation State:", simulation);
  }, [simulation]);

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
    console.log("Population state in effect hook:", population);
    console.log("Simulation state in effect hook:", simulation)
    if (population.isCreated && !simulation.populationId) {
      if (population.household?.id) {
        dispatch(updateSimulationPopulationId({ id: population.household.id, type: 'household' }));
        console.log("Dispatched updateSimulationPopulationId with household ID:", population.household.id);
      } else if (population.geography?.id) {
        dispatch(updateSimulationPopulationId({ id: population.geography.id, type: 'geography' }));
        console.log("Dispatched updateSimulationPopulationId with geography ID:", population.geography.id);
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

  function generatePopulationCardTitle() {
    if (!population || !population.isCreated) {
      return 'Add Population';
    }
    if (population.label) {
      return population.label;
    }
    if (population.household) {
      return `Population #${population.household.id}`;
    }
    // TODO: Add proper labelling for geographic populations here
    if (population.geography) {
      return `Population #${population.geography.id}`;
    }
    return "";

  }

  function generatePopulationCardDescription() {
    if (!population || !population.isCreated) {
      return 'Select a geographic scope or specific household';
    }
    if (population.label && population.household) {
      return `Population #${population.household.id}`;
    }
    // TODO: Add proper descriptions for geographic populations here
    if (population.label && population.geography) {
      return `Population #${population.geography.id}`;
    }
    return '';

  }

  const setupConditionCards = [
    {
      title: generatePopulationCardTitle(),
      description: generatePopulationCardDescription(),
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
