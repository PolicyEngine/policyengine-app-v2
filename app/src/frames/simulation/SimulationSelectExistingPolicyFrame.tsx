import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import {
  isPolicyMetadataWithAssociation,
  UserPolicyMetadataWithAssociation,
  useUserPolicies,
} from '@/hooks/useUserPolicy';
import { countryIds } from '@/libs/countries';
import { selectCurrentPosition } from '@/reducers/activeSelectors';
import { addPolicyParamAtPosition, createPolicyAtPosition } from '@/reducers/policyReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';

export default function SimulationSelectExistingPolicyFrame({ onNavigate }: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const dispatch = useDispatch();

  // Read position from report reducer via cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicy, setLocalPolicy] = useState<UserPolicyMetadataWithAssociation | null>(null);

  console.log('[SimulationSelectExistingPolicyFrame] ========== DATA FETCH ==========');
  console.log('[SimulationSelectExistingPolicyFrame] Raw data:', data);
  console.log('[SimulationSelectExistingPolicyFrame] Raw data length:', data?.length);
  console.log('[SimulationSelectExistingPolicyFrame] isLoading:', isLoading);
  console.log('[SimulationSelectExistingPolicyFrame] isError:', isError);
  console.log('[SimulationSelectExistingPolicyFrame] Error:', error);

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

    console.log('Submitting Policy in handleSubmit:', localPolicy);

    if (isPolicyMetadataWithAssociation(localPolicy)) {
      console.log('Use policy handler');
      handleSubmitPolicy();
    }

    onNavigate('next');
  }

  function handleSubmitPolicy() {
    if (!localPolicy || !isPolicyMetadataWithAssociation(localPolicy)) {
      return;
    }

    console.log('[POLICY SELECT] === SUBMIT START ===');
    console.log('[POLICY SELECT] Local Policy on Submit:', localPolicy);
    console.log('[POLICY SELECT] Association:', localPolicy.association);
    console.log('[POLICY SELECT] Association countryId:', localPolicy.association?.countryId);
    console.log('[POLICY SELECT] Policy metadata:', localPolicy.policy);
    console.log('[POLICY SELECT] Policy ID:', localPolicy.policy?.id);

    // Create a new policy at the current position
    console.log('[POLICY SELECT] Dispatching createPolicyAtPosition with:', {
      position: currentPosition,
      id: localPolicy.policy?.id?.toString(),
      label: localPolicy.association?.label || '',
      isCreated: true,
      countryId: localPolicy.policy?.country_id,
    });
    dispatch(
      createPolicyAtPosition({
        position: currentPosition,
        policy: {
          id: localPolicy.policy?.id?.toString(),
          label: localPolicy.association?.label || '',
          isCreated: true,
          countryId: localPolicy.policy?.country_id as (typeof countryIds)[number],
          parameters: [],
        },
      })
    );

    // Load all policy parameters using position-based action
    // Parameters must be added one at a time with individual value intervals
    if (localPolicy.policy?.policy_json) {
      const policyJson = localPolicy.policy.policy_json;
      console.log('[POLICY SELECT] Adding parameters from policy_json:', Object.keys(policyJson));
      Object.entries(policyJson).forEach(([paramName, valueIntervals]) => {
        if (Array.isArray(valueIntervals) && valueIntervals.length > 0) {
          // Add each value interval separately as required by PolicyParamAdditionPayload
          valueIntervals.forEach((vi: any) => {
            dispatch(
              addPolicyParamAtPosition({
                position: currentPosition,
                name: paramName,
                valueInterval: {
                  startDate: vi.start || vi.startDate,
                  endDate: vi.end || vi.endDate,
                  value: vi.value,
                },
              })
            );
          });
        }
      });
    }
    console.log('[POLICY SELECT] === SUBMIT END ===');
  }

  const userPolicies = data || [];

  console.log('[SimulationSelectExistingPolicyFrame] ========== BEFORE FILTERING ==========');
  console.log('[SimulationSelectExistingPolicyFrame] User policies count:', userPolicies.length);
  console.log('[SimulationSelectExistingPolicyFrame] User policies:', userPolicies);

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
        content={<Text c="red">Error: {(error as Error)?.message || 'Something went wrong.'}</Text>}
        buttonPreset="none"
      />
    );
  }

  if (userPolicies.length === 0) {
    const cancelAction = {
      ingredientType: 'simulation' as const,
    };

    return (
      <FlowView
        title="Select an Existing Policy"
        content={<Text>No policies available. Please create a new policy.</Text>}
        buttonPreset="cancel-only"
        cancelAction={cancelAction}
      />
    );
  }

  // Filter policies with loaded data
  const filteredPolicies = userPolicies.filter((association) =>
    isPolicyMetadataWithAssociation(association)
  );

  console.log('[SimulationSelectExistingPolicyFrame] ========== AFTER FILTERING ==========');
  console.log(
    '[SimulationSelectExistingPolicyFrame] Filtered policies count:',
    filteredPolicies.length
  );
  console.log(
    '[SimulationSelectExistingPolicyFrame] Filter criteria: isPolicyMetadataWithAssociation(association)'
  );
  console.log('[SimulationSelectExistingPolicyFrame] Filtered policies:', filteredPolicies);

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

  const cancelAction = {
    ingredientType: 'simulation' as const,
  };

  return (
    <FlowView
      title="Select an Existing Policy"
      variant="cardList"
      cardListItems={policyCardItems}
      primaryAction={primaryAction}
      itemsPerPage={5}
      cancelAction={cancelAction}
    />
  );
}
