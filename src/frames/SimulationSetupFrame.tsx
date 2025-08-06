import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FlowComponentProps } from '@/types/flow';
import { RootState } from '@/store';
import { updateSimulationPolicyId, updateSimulationPopulationId } from '@/reducers/simulationReducer';
import SimulationSetupView from '@/components/SimulationSetupView';

export default function SimulationSetupFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const simulation = useSelector((state: RootState) => state.simulation);
  const policy = useSelector((state: RootState) => state.policy);

  const handlePolicySelect = () => {
    console.log('Policy selection triggered');
    onNavigate('setupPolicy');
  };

  const handlePopulationSelect = () => {
    console.log('Population selection triggered');
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
      selectedPolicy={simulation.policyId ? `Policy: ${simulation.policyId}` : undefined}
      selectedPopulation={simulation.populationId ? `Population: ${simulation.populationId}` : undefined}
      isPopulationDisabled={true}
      onNext={handleNext}
      canProceed={canProceed}
    />
  );
}
