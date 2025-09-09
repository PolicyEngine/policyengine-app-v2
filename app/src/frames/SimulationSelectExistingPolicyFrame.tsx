import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useUserPolicies, UserPolicyMetadataWithAssociation, isPolicyMetadataWithAssociation } from '@/hooks/useUserPolicy';
import { loadPolicyParametersToStore } from '@/libs/policyParameterTransform';
import {
  clearPolicy,
  markPolicyAsCreated,
  updateLabel,
  updatePolicyId,
} from '@/reducers/policyReducer';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationSelectExistingPolicyFrame({ onNavigate }: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicy, setLocalPolicy] = useState<UserPolicyMetadataWithAssociation | null>(null);
  const dispatch = useDispatch();

  console.log('Policy Data:', data);
  console.log('Policy Loading:', isLoading);
  console.log('Policy Error:', isError);
  console.log('Policy Error Message:', error);

  function canProceed() {
    if (!localPolicy) {
      return false;
    }
    if (isPolicyMetadataWithAssociation(localPolicy)) {
      return localPolicy.policy?.id !== null && localPolicy.policy?.id !== undefined;
    }
    return false;
  }

  function handlePolicySelect(association: UserPolicyMetadataWithAssociation) {
    if (!association) return;

    setLocalPolicy(association);
  }

  function handleSubmit() {
    if (!localPolicy) return;

    console.log("Submitting Policy in handleSubmit:", localPolicy);

    if (isPolicyMetadataWithAssociation(localPolicy)) {
      console.log("Use policy handler");
      handleSubmitPolicy();
    }

    onNavigate('next');
  }

  function handleSubmitPolicy() {
    if (!localPolicy || !isPolicyMetadataWithAssociation(localPolicy)) return;

    dispatch(clearPolicy());

    console.log("Local Policy on Submit:", localPolicy);
    dispatch(updatePolicyId(localPolicy.policy?.id?.toString() || ''));
    dispatch(updateLabel(localPolicy.association?.label || ''));

    // Load all policy parameters using the utility function
    if (localPolicy.policy?.policy_json) {
      loadPolicyParametersToStore(localPolicy.policy.policy_json, dispatch);
    }

    dispatch(markPolicyAsCreated());
  }

  const userPolicies = data || [];

  console.log("User Policies:", userPolicies);

  // TODO: For all of these, refactor into something more reusable
  if (isLoading) {
    return (
      <FlowView
        title="Select an Existing Policy"
        content={<Text>Loading policies...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <FlowView
        title="Select an Existing Policy"
        content={
          <Text color="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>
        }
        buttonPreset="none"
      />
    );
  }

  if (userPolicies.length === 0) {
    return (
      <FlowView
        title="Select an Existing Policy"
        content={<Text>No policies available. Please create a new policy.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  // Build card list items from user policies
  const policyCardItems = userPolicies
    .filter((association) => isPolicyMetadataWithAssociation(association)) // Only include associations with loaded policies
    .slice(0, 5) // Display only the first 5 policies
    .map((association) => {
      let title = "";
      let subtitle = "";
      if ('label' in association.association && association.association.label) {
        title = association.association.label;
        subtitle = `Policy #${association.policy!.id}`;
      } else {
        title = `Policy #${association.policy!.id}`;
      }

      return {
        title: title,
        subtitle: subtitle,
        onClick: () => handlePolicySelect(association),
        isSelected: isPolicyMetadataWithAssociation(localPolicy) && localPolicy.policy?.id === association.policy!.id,
      }
    });

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Text fw={700}>Your Policies</Text>
      <Text size="sm" c="dimmed">
        Showing {policyCardItems.length} policies
      </Text>
    </Stack>
  );

  const primaryAction = {
    label: 'Next',
    onClick: handleSubmit,
    isDisabled: !canProceed(),
  };

  return (
    <FlowView
      title="Select an Existing Policy"
      variant="cardList"
      content={content}
      cardListItems={policyCardItems}
      primaryAction={primaryAction}
    />
  );
}
