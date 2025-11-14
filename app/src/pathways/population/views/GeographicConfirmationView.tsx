import { useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { RootState } from '@/store';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { getCountryLabel, getRegionLabel, getRegionTypeLabel } from '@/utils/geographyUtils';
import { PopulationState } from '../types';

interface GeographicConfirmationViewProps {
  state: PopulationState;
  onStateChange: (newState: Partial<PopulationState>) => void;
  onNext: () => void;
  onBack: () => void;
  onCancel?: () => void;
}

/**
 * GeographicConfirmationView - Fourth step in population pathway (geographic path).
 *
 * Shows a summary of the geographic population selection and creates the
 * geographic association via API.
 */
export default function GeographicConfirmationView({
  state,
  onStateChange,
  onNext,
}: GeographicConfirmationViewProps) {
  const { mutateAsync: createGeographicAssociation, isPending } = useCreateGeographicAssociation();

  // Hardcoded for now - TODO: Replace with actual user from auth context
  const currentUserId = MOCK_USER_ID;
  // Get metadata from state
  const metadata = useSelector((state: RootState) => state.metadata);
  const userDefinedLabel = state.label || null;

  // Build geographic population data from existing geography in state
  const buildGeographicPopulation = (): Omit<UserGeographyPopulation, 'createdAt' | 'type'> => {
    if (!state.geography) {
      throw new Error('No geography found in population state');
    }

    const basePopulation = {
      id: `${currentUserId}-${Date.now()}`, // TODO: May need to modify this after changes to API
      userId: currentUserId,
      countryId: state.geography.countryId,
      geographyId: state.geography.geographyId,
      scope: state.geography.scope,
      label: userDefinedLabel || state.geography.name || undefined,
    };

    return basePopulation;
  };

  const handleSubmit = async () => {
    const populationData = buildGeographicPopulation();
    console.log('Creating geographic population:', populationData);

    try {
      const result = await createGeographicAssociation(populationData);
      console.log('Geographic population created successfully:', result);

      // Update state with the created geography ID and mark as created
      onStateChange({
        geography: {
          ...state.geography!,
          geographyId: result.geographyId,
        },
        label: result.label || state.label,
        isCreated: true,
      });

      // Navigate to next step
      onNext();
    } catch (err) {
      console.error('Failed to create geographic association:', err);
    }
  };

  // Build display content based on geographic scope
  const buildDisplayContent = () => {
    if (!state.geography) {
      return (
        <Stack gap="md">
          <Text c="red">No geography selected</Text>
        </Stack>
      );
    }

    const geographyCountryId = state.geography.countryId;

    if (state.geography.scope === 'national') {
      return (
        <Stack gap="md">
          <Text fw={600} fz="lg">
            Confirm household collection
          </Text>
          <Text>
            <strong>Scope:</strong> National
          </Text>
          <Text>
            <strong>Country:</strong> {getCountryLabel(geographyCountryId)}
          </Text>
        </Stack>
      );
    }

    // Subnational
    // geographyId now contains full prefixed value like "constituency/Sheffield Central"
    const regionCode = state.geography.geographyId;
    const regionLabel = getRegionLabel(regionCode, metadata);
    const regionTypeName = getRegionTypeLabel(geographyCountryId, regionCode, metadata);

    console.log(
      `[GeographicConfirmationView] regionTypeName: ${regionTypeName}, regionLabel: ${regionLabel}`
    );

    return (
      <Stack gap="md">
        <Text fw={600} fz="lg">
          Confirm household collection
        </Text>
        <Text>
          <strong>Scope:</strong> {regionTypeName}
        </Text>
        <Text>
          <strong>{regionTypeName}:</strong> {regionLabel}
        </Text>
      </Stack>
    );
  };

  const primaryAction = {
    label: 'Create household collection',
    onClick: handleSubmit,
    isLoading: isPending,
  };

  return (
    <FlowView
      title="Confirm household collection"
      content={buildDisplayContent()}
      primaryAction={primaryAction}
    />
  );
}
