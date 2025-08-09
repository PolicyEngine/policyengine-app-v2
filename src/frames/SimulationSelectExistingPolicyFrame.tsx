import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Card, Stack, Text } from '@mantine/core';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import { loadPolicyParametersToStore } from '@/libs/policyParameterTransform';
import {
  clearPolicy,
  markPolicyAsCreated,
  updateLabel,
  updatePolicyId,
} from '@/reducers/policyReducer';
import { FlowComponentProps } from '@/types/flow';
import { PolicyMetadata } from '@/types/policyMetadata';
import FlowView, { ButtonConfig } from '@/components/common/FlowView';

export default function SimulationSelectExistingPolicyFrame({ onNavigate }: FlowComponentProps) {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  
  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicyId, setLocalPolicyId] = useState<string | null>(null);
  const dispatch = useDispatch();

  const canProceed = localPolicyId !== null;

  function handlePolicySelect(policy: PolicyMetadata) {
    // Blank out any existing policy
    dispatch(clearPolicy());

    // Fill in all policy details
    // TODO: Fix ID types
    dispatch(updatePolicyId(policy.id.toString()));
    dispatch(updateLabel(policy.label || ''));

    // Load all policy parameters using the utility function
    loadPolicyParametersToStore(policy.policy_json, dispatch);

    dispatch(markPolicyAsCreated());
    setLocalPolicyId(policy.id.toString());
  }

  function handleSubmit() {
    dispatch(updatePolicyId(localPolicyId || ''));
    dispatch(markPolicyAsCreated());
    onNavigate('next');
  }

  const buttons: ButtonConfig[] = [
    {
      label: 'Cancel',
      variant: 'default',
      onClick: () => console.log('Cancel clicked'),
    },
    {
      label: 'Next',
      variant: canProceed ? 'filled' : 'disabled',
      onClick: canProceed ? handleSubmit : () => null,
    },
  ];

  const userPolicies = data || [];
  let displayPolicies = null;

  if (userPolicies.length === 0) {
    displayPolicies = <Text>No policies available. Please create a new policy.</Text>;
  } else {
    const recentUserPolicies = userPolicies.slice(0, 5); // Display only the first 5 policies
    displayPolicies = recentUserPolicies
      .filter((association) => association.policy) // Only include associations with loaded policies
      .map((association) => (
        // TODO: Fix ID types
        <Card
          key={association.policy!.id}
          withBorder
          p="md"
          component="button"
          onClick={() => handlePolicySelect(association.policy!)}
        >
          <Stack>
            <Text fw={600}>{association.policy!.label}</Text>
          </Stack>
        </Card>
      ));
  }

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Recents</Text>
      <Stack>{displayPolicies}</Stack>
    </Stack>
  );

  return (
    <FlowView
      title="Select an Existing Policy"
      variant="custom"
      content={content}
      buttons={buttons}
      isLoading={isLoading}
      isError={isError}
      error={error}
    />
  );
}
