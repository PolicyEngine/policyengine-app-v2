import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import FlowView from '@/components/common/FlowView';
import {
  selectActivePolicy,
  selectActivePopulation,
  selectCurrentPosition,
} from '@/reducers/activeSelectors';
import {
  createSimulationAtPosition,
  selectSimulationAtPosition,
  updateSimulationAtPosition,
} from '@/reducers/simulationsReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

type SetupCard = 'population' | 'policy';

export default function SimulationSetupFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();

  // Get the current position from the cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const simulation = useSelector((state: RootState) =>
    selectSimulationAtPosition(state, currentPosition)
  );

  // Get policy and population at the current position
  const policy = useSelector((state: RootState) => selectActivePolicy(state));
  const population = useSelector((state: RootState) => selectActivePopulation(state));

  console.log("[SimulationSetupFrame] currentPosition: ", currentPosition);
  console.log("[SimulationSetupFrame] policy: ", policy);
  console.log("[SimulationSetupFrame] population: ", population);


  const [selectedCard, setSelectedCard] = useState<SetupCard | null>(null);

  // Ensure we have a simulation at the current position
  useEffect(() => {
    if (!simulation) {
      dispatch(createSimulationAtPosition({ position: currentPosition }));
    }
  }, [simulation, currentPosition, dispatch]);

  const handlePopulationSelect = () => {
    setSelectedCard('population');
  };

  const handlePolicySelect = () => {
    setSelectedCard('policy');
  };

  const handleNext = () => {
    if (selectedCard === 'population' && !population?.isCreated) {
      onNavigate('setupPopulation');
    } else if (selectedCard === 'policy' && !policy?.isCreated) {
      onNavigate('setupPolicy');
    } else if (simulation?.policyId && simulation?.populationId) {
      // Both are fulfilled, proceed to next step
      onNavigate('next');
    }
  };

  // Listen for policy creation and update simulation with policy ID
  useEffect(() => {
    if (policy?.isCreated && policy?.id && !simulation?.policyId) {
      // Update the simulation at the current position
      dispatch(
        updateSimulationAtPosition({
          position: currentPosition,
          updates: { policyId: policy.id },
        })
      );
    }
  }, [policy?.isCreated, policy?.id, simulation?.policyId, currentPosition, dispatch]);

  // Listen for population creation and update simulation with population ID
  useEffect(() => {
    console.log('Population state in new effect hook:', population);
    console.log('Simulation state in new effect hook:', simulation);
    if (population?.isCreated && !simulation?.populationId) {
      console.log('Responding to update to population in new effect hook');
      if (population?.household?.id) {
        dispatch(
          updateSimulationAtPosition({
            position: currentPosition,
            updates: {
              populationId: population.household.id,
              populationType: 'household',
            },
          })
        );
      } else if (population?.geography?.id) {
        dispatch(
          updateSimulationAtPosition({
            position: currentPosition,
            updates: {
              populationId: population.geography.id,
              populationType: 'geography',
            },
          })
        );
      }
    }
  }, [
    population?.isCreated,
    population?.household,
    population?.geography,
    simulation?.populationId,
    currentPosition,
    dispatch,
  ]);

  const canProceed: boolean = !!(simulation?.policyId && simulation?.populationId);

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
    return '';
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

  function generatePolicyCardTitle() {
    if (!policy || !policy.isCreated) {
      return 'Add Policy';
    }
    if (policy.label) {
      return policy.label;
    }
    if (policy.id) {
      return `Policy #${policy.id}`;
    }
    return '';
  }

  function generatePolicyCardDescription() {
    if (!policy || !policy.isCreated) {
      return 'Select a policy to apply to the simulation';
    }
    if (policy.label && policy.id) {
      return `Policy #${policy.id}`;
    }
    return '';
  }

  const setupConditionCards = [
    {
      title: generatePopulationCardTitle(),
      description: generatePopulationCardDescription(),
      onClick: handlePopulationSelect,
      isSelected: selectedCard === 'population',
      isFulfilled: population?.isCreated || false,
      isDisabled: false,
    },
    {
      title: generatePolicyCardTitle(),
      description: generatePolicyCardDescription(),
      onClick: handlePolicySelect,
      isSelected: selectedCard === 'policy',
      isFulfilled: policy?.isCreated || false,
      isDisabled: false,
    },
  ];

  // Determine the primary action label and state
  const getPrimaryAction = () => {
    if (selectedCard === 'population' && !population?.isCreated) {
      return {
        label: 'Setup Population',
        onClick: handleNext,
        isDisabled: false,
      };
    } else if (selectedCard === 'policy' && !policy?.isCreated) {
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
