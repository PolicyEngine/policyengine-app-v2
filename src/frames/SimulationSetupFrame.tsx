import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  updateSimulationPolicyId,
  updateSimulationPopulationId,
} from '@/reducers/simulationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';

export default function SimulationSetupFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const simulation = useSelector((state: RootState) => state.simulation);
  const policy = useSelector((state: RootState) => state.policy);

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

  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => console.log('Cancel clicked'), // TODO: Fix when cancel buttons are fixed
    },
    {
      label: 'Next',
      variant: canProceed ? 'filled' : 'disabled',
      onClick: canProceed ? handleNext : () => null,
    },
  ];

  const selectionCards = [
    {
      title: 'Add population',
      description: 'Select a geographic scope or specific household',
      onClick: handlePopulationSelect,
      isSelected: !!simulation.populationId,
      isDisabled: true, // Currently disabled
    },
    {
      title: policy && policy.isCreated ? policy.label : 'Add policy',
      description: policy && policy.isCreated 
        ? policy.label 
        : 'Select a policy to apply to the simulation',
      onClick: policy && policy.isCreated ? () => {} : handlePolicySelect, // No-op if already selected
      isSelected: policy && policy.isCreated,
      isDisabled: false,
    },
  ];

  return (
    <FlowView
      title="Setup Simulation"
      variant="selection"
      selectionCards={selectionCards}
      buttons={buttons}
    />
  );
}
