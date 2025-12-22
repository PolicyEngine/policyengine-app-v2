/**
 * PolicyExistingView - View for selecting existing policy
 * Duplicated from SimulationSelectExistingPolicyFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { Text } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { MOCK_USER_ID } from '@/constants';
import {
  isPolicyWithAssociation,
  UserPolicyWithAssociation,
  useUserPolicies,
} from '@/hooks/useUserPolicy';
import { Parameter } from '@/types/subIngredients/parameter';

interface PolicyExistingViewProps {
  onSelectPolicy: (policyId: string, label: string, parameters: Parameter[]) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

export default function PolicyExistingView({
  onSelectPolicy,
  onBack,
  onCancel,
}: PolicyExistingViewProps) {
  const userId = MOCK_USER_ID.toString();

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicy, setLocalPolicy] = useState<UserPolicyWithAssociation | null>(null);

  function canProceed() {
    if (!localPolicy) {
      return false;
    }
    if (isPolicyWithAssociation(localPolicy)) {
      return localPolicy.policy?.id !== null && localPolicy.policy?.id !== undefined;
    }
    return false;
  }

  function handlePolicySelect(association: UserPolicyWithAssociation) {
    if (!association) {
      console.warn('[PolicyExistingView] handlePolicySelect called with null/undefined association');
      return;
    }

    setLocalPolicy(association);
  }

  function handleSubmit() {
    if (!localPolicy) {
      console.warn('[PolicyExistingView] handleSubmit called with no policy selected');
      return;
    }

    if (isPolicyWithAssociation(localPolicy)) {
      handleSubmitPolicy();
    } else {
      console.warn('[PolicyExistingView] handleSubmit: localPolicy is not a valid PolicyWithAssociation');
    }
  }

  function handleSubmitPolicy() {
    if (!localPolicy || !isPolicyWithAssociation(localPolicy)) {
      console.warn('[PolicyExistingView] handleSubmitPolicy called with invalid localPolicy state');
      return;
    }

    const policyId = localPolicy.policy?.id?.toString();
    const label = localPolicy.association?.label || '';

    // Policy now has parameters directly (already transformed from policy_json)
    const parameters = localPolicy.policy?.parameters || [];

    // Call parent callback instead of dispatching to Redux
    if (policyId) {
      onSelectPolicy(policyId, label, parameters);
    } else {
      console.error('[PolicyExistingView] Cannot submit: policy ID is missing from selected policy');
    }
  }

  const userPolicies = data || [];

  if (isLoading) {
    return (
      <PathwayView
        title="Select an existing policy"
        content={<Text>Loading policies...</Text>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <PathwayView
        title="Select an existing policy"
        content={
          <Text c="red">
            Error: {(error as Error)?.message || 'Failed to load policies. Please refresh and try again.'}
          </Text>
        }
        buttonPreset="none"
      />
    );
  }

  if (userPolicies.length === 0) {
    return (
      <PathwayView
        title="Select an existing policy"
        content={<Text>No policies available. Please create a new policy.</Text>}
        primaryAction={{
          label: 'Next',
          onClick: () => {},
          isDisabled: true,
        }}
        backAction={onBack ? { onClick: onBack } : undefined}
        cancelAction={onCancel ? { onClick: onCancel } : undefined}
      />
    );
  }

  // Filter policies with loaded data
  const filteredPolicies = userPolicies.filter((association) =>
    isPolicyWithAssociation(association)
  );

  // Build card list items from ALL filtered policies (pagination handled by PathwayView)
  const policyCardItems = filteredPolicies.map((association) => {
    const policyId = association.policy?.id ?? 'unknown';
    let title = '';
    let subtitle = '';
    if ('label' in association.association && association.association.label) {
      title = association.association.label;
      subtitle = `Policy #${policyId}`;
    } else {
      title = `Policy #${policyId}`;
    }

    return {
      id: association.association.id?.toString() || policyId.toString(), // Use association ID for unique key
      title,
      subtitle,
      onClick: () => handlePolicySelect(association),
      isSelected:
        isPolicyWithAssociation(localPolicy) && localPolicy.policy?.id === association.policy?.id,
    };
  });

  const primaryAction = {
    label: 'Next',
    onClick: handleSubmit,
    isDisabled: !canProceed(),
  };

  return (
    <PathwayView
      title="Select an existing policy"
      variant="cardList"
      cardListItems={policyCardItems}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
      cancelAction={onCancel ? { onClick: onCancel } : undefined}
      itemsPerPage={5}
    />
  );
}
