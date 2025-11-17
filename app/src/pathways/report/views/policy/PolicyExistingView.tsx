/**
 * PolicyExistingView - View for selecting existing policy
 * Duplicated from SimulationSelectExistingPolicyFrame
 * Props-based instead of Redux-based
 */

import { useState } from 'react';
import { Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import {
  isPolicyMetadataWithAssociation,
  UserPolicyMetadataWithAssociation,
  useUserPolicies,
} from '@/hooks/useUserPolicy';
import { PolicyStateProps } from '@/types/pathwayState';
import { Parameter } from '@/types/subIngredients/parameter';

interface PolicyExistingViewProps {
  onSelectPolicy: (policyId: string, label: string, parameters: Parameter[]) => void;
  onReturn: () => void;
}

export default function PolicyExistingView({ onSelectPolicy, onReturn }: PolicyExistingViewProps) {
  const userId = MOCK_USER_ID.toString();

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicy, setLocalPolicy] = useState<UserPolicyMetadataWithAssociation | null>(null);

  console.log('[PolicyExistingView] ========== DATA FETCH ==========');
  console.log('[PolicyExistingView] Raw data:', data);
  console.log('[PolicyExistingView] Raw data length:', data?.length);
  console.log('[PolicyExistingView] isLoading:', isLoading);
  console.log('[PolicyExistingView] isError:', isError);
  console.log('[PolicyExistingView] Error:', error);

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
    if (!association) {
      return;
    }

    setLocalPolicy(association);
  }

  function handleSubmit() {
    if (!localPolicy) {
      return;
    }

    console.log('[PolicyExistingView] Submitting Policy in handleSubmit:', localPolicy);

    if (isPolicyMetadataWithAssociation(localPolicy)) {
      console.log('[PolicyExistingView] Use policy handler');
      handleSubmitPolicy();
    }
  }

  function handleSubmitPolicy() {
    if (!localPolicy || !isPolicyMetadataWithAssociation(localPolicy)) {
      return;
    }

    console.log('[PolicyExistingView] === SUBMIT START ===');
    console.log('[PolicyExistingView] Local Policy on Submit:', localPolicy);
    console.log('[PolicyExistingView] Association:', localPolicy.association);
    console.log('[PolicyExistingView] Association countryId:', localPolicy.association?.countryId);
    console.log('[PolicyExistingView] Policy metadata:', localPolicy.policy);
    console.log('[PolicyExistingView] Policy ID:', localPolicy.policy?.id);

    const policyId = localPolicy.policy?.id?.toString();
    const label = localPolicy.association?.label || '';

    // Convert policy_json to Parameter[] format
    const parameters: Parameter[] = [];

    if (localPolicy.policy?.policy_json) {
      const policyJson = localPolicy.policy.policy_json;
      console.log('[PolicyExistingView] Converting parameters from policy_json:', Object.keys(policyJson));

      Object.entries(policyJson).forEach(([paramName, valueIntervals]) => {
        if (Array.isArray(valueIntervals) && valueIntervals.length > 0) {
          // Convert each value interval to the proper format
          const values = valueIntervals.map((vi: any) => ({
            startDate: vi.start || vi.startDate,
            endDate: vi.end || vi.endDate,
            value: vi.value,
          }));

          parameters.push({
            name: paramName,
            values,
          });
        }
      });
    }

    console.log('[PolicyExistingView] Converted parameters:', parameters);
    console.log('[PolicyExistingView] === SUBMIT END ===');

    // Call parent callback instead of dispatching to Redux
    if (policyId) {
      onSelectPolicy(policyId, label, parameters);
    }
  }

  const userPolicies = data || [];

  console.log('[PolicyExistingView] ========== BEFORE FILTERING ==========');
  console.log('[PolicyExistingView] User policies count:', userPolicies.length);
  console.log('[PolicyExistingView] User policies:', userPolicies);

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
          <Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>
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
        cancelAction={{ onClick: onReturn }}
        buttonPreset="cancel-only"
      />
    );
  }

  // Filter policies with loaded data
  const filteredPolicies = userPolicies.filter((association) =>
    isPolicyMetadataWithAssociation(association)
  );

  console.log('[PolicyExistingView] ========== AFTER FILTERING ==========');
  console.log('[PolicyExistingView] Filtered policies count:', filteredPolicies.length);
  console.log(
    '[PolicyExistingView] Filter criteria: isPolicyMetadataWithAssociation(association)'
  );
  console.log('[PolicyExistingView] Filtered policies:', filteredPolicies);

  // Build card list items from ALL filtered policies (pagination handled by FlowView)
  const policyCardItems = filteredPolicies.map((association) => {
    let title = '';
    let subtitle = '';
    if ('label' in association.association && association.association.label) {
      title = association.association.label;
      subtitle = `Policy #${association.policy!.id}`;
    } else {
      title = `Policy #${association.policy!.id}`;
    }

    return {
      title,
      subtitle,
      onClick: () => handlePolicySelect(association),
      isSelected:
        isPolicyMetadataWithAssociation(localPolicy) &&
        localPolicy.policy?.id === association.policy!.id,
    };
  });

  const primaryAction = {
    label: 'Next',
    onClick: handleSubmit,
    isDisabled: !canProceed(),
  };

  return (
    <FlowView
      title="Select an Existing Policy"
      variant="cardList"
      cardListItems={policyCardItems}
      primaryAction={primaryAction}
      itemsPerPage={5}
    />
  );
}
