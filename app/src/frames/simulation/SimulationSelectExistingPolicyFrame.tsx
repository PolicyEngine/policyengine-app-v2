import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text, Group, ActionIcon } from '@mantine/core';
import { IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
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

const ITEMS_PER_PAGE = 5;

export default function SimulationSelectExistingPolicyFrame({ onNavigate }: FlowComponentProps) {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  const dispatch = useDispatch();

  // Read position from report reducer via cross-cutting selector
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));

  const { data, isLoading, isError, error } = useUserPolicies(userId);
  const [localPolicy, setLocalPolicy] = useState<UserPolicyMetadataWithAssociation | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

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

    console.log('Local Policy on Submit:', localPolicy);

    // Create a new policy at the current position
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
  }

  const userPolicies = data || [];

  console.log('User Policies:', userPolicies);

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
    return (
      <FlowView
        title="Select an Existing Policy"
        content={<Text>No policies available. Please create a new policy.</Text>}
        buttonPreset="cancel-only"
      />
    );
  }

  // Filter policies with loaded data
  const filteredPolicies = userPolicies.filter((association) =>
    isPolicyMetadataWithAssociation(association)
  );

  // Calculate pagination
  const totalPages = Math.ceil(filteredPolicies.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedPolicies = filteredPolicies.slice(startIndex, endIndex);

  // Build card list items from paginated policies
  const policyCardItems = paginatedPolicies.map((association) => {
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

  const content = (
    <Stack>
      <Text size="sm">Search</Text>
      <Text fw={700}>TODO: Search</Text>
      <Group justify="space-between" align="center">
        <div>
          <Text fw={700}>Your Policies</Text>
          <Text size="sm" c="dimmed">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredPolicies.length)} of {filteredPolicies.length}
          </Text>
        </div>
        {totalPages > 1 && (
          <Group gap="xs">
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              aria-label="Previous page"
            >
              <IconChevronLeft size={18} />
            </ActionIcon>
            <Text size="sm">
              Page {currentPage} of {totalPages}
            </Text>
            <ActionIcon
              variant="default"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              aria-label="Next page"
            >
              <IconChevronRight size={18} />
            </ActionIcon>
          </Group>
        )}
      </Group>
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
