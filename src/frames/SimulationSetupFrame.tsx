import { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { FlowComponentProps } from '@/types/flow';
import { RootState } from '@/store';
import { updatePolicyId, updatePopulationId } from '@/reducers/simulationReducer';
import SimulationSetupView from '@/components/SimulationSetupView';

export default function SimulationSetupFrame({ onNavigate }: FlowComponentProps) {
  const dispatch = useDispatch();
  const simulation = useSelector((state: RootState) => state.simulation);
  const policy = useSelector((state: RootState) => state.policy);

  const handlePolicySelect = () => {
    onNavigate('selectPolicy');
  };

  const handleNext = () => {
    onNavigate('next');
  };

  // Listen for policy creation and update simulation with policy ID
  // Use the isCreated flag as the reliable indicator of policy completion
  useEffect(() => {
    if (policy.isCreated && !simulation.policyId) {
      // In real implementation, this would come from the API response
      // when the policy is actually created/submitted
      const mockPolicyId = `policy_${Date.now()}`;
      dispatch(updatePolicyId(mockPolicyId));
    }
  }, [policy.isCreated, simulation.policyId, dispatch]);

  // Set default population ID when policy is selected
  useEffect(() => {
    if (simulation.policyId && !simulation.populationId) {
      dispatch(updatePopulationId('default-population'));
    }
  }, [simulation.policyId, simulation.populationId, dispatch]);

  const canProceed = simulation.policyId && simulation.populationId;

  return (
    <SimulationSetupView
      onPolicySelect={handlePolicySelect}
      selectedPolicy={simulation.policyId ? `Policy: ${simulation.policyId}` : undefined}
      selectedPopulation={simulation.populationId ? `Population: ${simulation.populationId}` : undefined}
      isPopulationDisabled={true}
      onNext={handleNext}
      canProceed={canProceed}
    />
  );
}
