import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Card, Stack, Text } from '@mantine/core';
import MultiButtonFooter, { ButtonConfig } from '@/components/common/MultiButtonFooter';
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

export default function SimulationSelectExistingPolicyFrame({ onNavigate }: FlowComponentProps) {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicyId, setLocalPolicyId] = useState<string | null>(null);

  const canProceed = localPolicyId !== null;

  const dispatch = useDispatch();

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

  const canProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'filled' as const,
    onClick: handleSubmit,
  };

  const cantProceedNextButtonConfig: ButtonConfig = {
    label: 'Next',
    variant: 'disabled' as const,
    onClick: () => {
      return null;
    },
  };

  const cancelButtonConfig: ButtonConfig = {
    label: 'Cancel',
    variant: 'outline' as const,
    onClick: () => {
      console.log('Cancel clicked');
    },
  };

  const buttonConfig: ButtonConfig[] = canProceed
    ? [cancelButtonConfig, canProceedNextButtonConfig]
    : [cancelButtonConfig, cantProceedNextButtonConfig];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error: {error?.message}</div>;
  }

  const userPolicies = data || [];

  let displayPolicies = null;

  if (userPolicies.length === 0) {
    displayPolicies = <Text>No policies available. Please create a new policy.</Text>;
  } else {
    const recentUserPolicies = userPolicies.slice(0, 5); // Display only the first 3 policies
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

  return (
    <Stack>
      <Text fw={700}>Select an Existing Policy</Text>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Recents</Text>
      <Stack>{displayPolicies}</Stack>
      <MultiButtonFooter buttons={buttonConfig} />
    </Stack>
  );
}
