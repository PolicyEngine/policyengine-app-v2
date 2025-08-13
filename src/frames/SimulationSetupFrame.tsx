import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateSimulationPolicyId,
  updateSimulationPopulationId,
} from '@/reducers/simulationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import FlowView from '@/components/common/FlowView';

export default function SimulationSetupFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const simulation = useSelector((state: RootState) => state.simulation);
  const policy = useSelector((state: RootState) => state.policy);
  const population = useSelector((state: RootState) => state.population);

  const handlePolicySelect = () => {
    onNavigate('setupPolicy');
  };

  const handlePopulationSelect = () => {
    onNavigate('setupPopulation');
  };

  const handleNext = () => {
    onNavigate('next');
  };

  // Listen for policy creation and update simulation with policy ID
  useEffect(() => {
    if (policy.isCreated && policy.id && !simulation.policyId) {
      dispatch(updateSimulationPolicyId(policy.id));
    }
  }, [policy.isCreated, policy.id, simulation.policyId, dispatch]);

  // Set default population ID when policy is selected
  useEffect(() => {
    if (simulation.policyId && !simulation.populationId) {
      dispatch(updateSimulationPopulationId('default-population'));
    }
  }, [simulation.policyId, simulation.populationId, dispatch]);

  const canProceed: boolean = !!(simulation.policyId && simulation.populationId);

  // TODO: May consider moving to an explicit "isCreated" state entry
  const selectionCards = [
    {
      title: population && population.id ? population.label : 'Add population',
      description: population && population.id 
        ? population.label 
        : 'Select a geographic scope or specific household',
      onClick: population && population.id ? () => {} : handlePopulationSelect,
      isSelected: !!simulation.populationId,
      isDisabled: false, 
    },
    {
      title: policy && policy.isCreated ? policy.label : 'Add policy',
      description: policy && policy.isCreated 
        ? policy.label 
        : 'Select a policy to apply to the simulation',
      onClick: policy && policy.isCreated ? () => {} : handlePolicySelect,
      isSelected: policy && policy.isCreated,
      isDisabled: false,
    },
  ];

  const primaryAction = {
    label: 'Next',
    onClick: handleNext,
    isDisabled: !canProceed
  };

  return (
    <FlowView
      title="Setup Simulation"
      variant="selection"
      selectionCards={selectionCards}
      primaryAction={primaryAction}
    />
  );
}
