/**
 * PolicyExistingView - View for selecting existing policy
 * Duplicated from SimulationSelectExistingPolicyFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import PathwayView from '@/components/common/PathwayView';
import { MOCK_USER_ID } from '@/constants';
import {
  isPolicyWithAssociation,
  UserPolicyWithAssociation,
  useUserPolicies,
} from '@/hooks/useUserPolicy';
import { Parameter } from '@/types/subIngredients/parameter';
import { getUserPolicyAvailability, isUserPolicySelectable } from '@/utils/ingredientAvailability';

interface PolicyExistingViewProps {
  onSelectPolicy: (policyId: string, label: string, parameters: Parameter[]) => void;
  onBack?: () => void;
  onCancel?: () => void;
}

function getPolicyAssociationKey(association: UserPolicyWithAssociation): string {
  return association.association.id?.toString() || association.association.policyId.toString();
}

export default function PolicyExistingView({
  onSelectPolicy,
  onBack,
  onCancel,
}: PolicyExistingViewProps) {
  const userId = MOCK_USER_ID.toString();

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const userPolicies = data || [];
  const [selectedPolicyKey, setSelectedPolicyKey] = useState<string | null>(null);
  const localPolicy =
    userPolicies.find(
      (association) => getPolicyAssociationKey(association) === selectedPolicyKey
    ) ?? null;

  function canProceed() {
    return (
      !!localPolicy &&
      isUserPolicySelectable(localPolicy) &&
      localPolicy.policy.id !== null &&
      localPolicy.policy.id !== undefined
    );
  }

  function handlePolicySelect(association: UserPolicyWithAssociation) {
    if (!association || !isUserPolicySelectable(association)) {
      console.warn('[PolicyExistingView] handlePolicySelect called with unavailable association');
      return;
    }

    setSelectedPolicyKey(getPolicyAssociationKey(association));
  }

  function handleSubmit() {
    if (!localPolicy || !isUserPolicySelectable(localPolicy)) {
      console.warn('[PolicyExistingView] handleSubmit called with no available policy selected');
      return;
    }

    const policyId = localPolicy.policy.id?.toString();
    const label = localPolicy.association?.label || '';

    // Policy now has parameters directly (already transformed from policy_json)
    const parameters = localPolicy.policy.parameters || [];

    // Call parent callback instead of dispatching to Redux
    if (policyId) {
      onSelectPolicy(policyId, label, parameters);
    } else {
      console.error(
        '[PolicyExistingView] Cannot submit: policy ID is missing from selected policy'
      );
    }
  }

  if (isLoading) {
    return (
      <PathwayView
        title="Select an existing policy"
        content={<p>Loading policies...</p>}
        buttonPreset="none"
      />
    );
  }

  if (isError) {
    return (
      <PathwayView
        title="Select an existing policy"
        content={
          <p className="tw:text-red-600">
            Error:{' '}
            {(error as Error)?.message || 'Failed to load policies. Please refresh and try again.'}
          </p>
        }
        buttonPreset="none"
      />
    );
  }

  if (userPolicies.length === 0) {
    return (
      <PathwayView
        title="Select an existing policy"
        content={<p>No policies available. Please create a new policy.</p>}
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
      subtitle = association.error ? 'Failed to load' : `Policy #${policyId}`;
    } else {
      title = `Policy #${policyId}`;
    }

    const associationKey = getPolicyAssociationKey(association);
    const isSelectable = isUserPolicySelectable(association);
    const availability = getUserPolicyAvailability(association);

    return {
      id: associationKey,
      title,
      subtitle,
      onClick: () => handlePolicySelect(association),
      ...availability,
      isSelected: isSelectable && selectedPolicyKey === associationKey,
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
