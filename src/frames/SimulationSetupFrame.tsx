import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import SimulationSetupView from '@/components/SimulationSetupView';
import {
  updateSimulationPolicyId,
  updateSimulationPopulationId,
} from '@/reducers/simulationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

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

  return (
    <SimulationSetupView
      onPolicySelect={handlePolicySelect}
      onPopulationSelect={handlePopulationSelect}
      selectedPopulation={
        simulation.populationId ? `Population: ${simulation.populationId}` : undefined
      }
      isPopulationDisabled
      onNext={handleNext}
      canProceed={canProceed}
    />
  );
}
