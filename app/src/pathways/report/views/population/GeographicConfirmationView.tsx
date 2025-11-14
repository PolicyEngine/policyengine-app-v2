/**
 * GeographicConfirmationView - View for confirming geographic population
 * Duplicated from GeographicConfirmationFrame
 * Props-based instead of Redux-based
 */

import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { PopulationStateProps } from '@/types/pathwayState';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { getCountryLabel, getRegionLabel, getRegionTypeLabel } from '@/utils/geographyUtils';

interface GeographicConfirmationViewProps {
  population: PopulationStateProps;
  metadata: any;
  onSubmitSuccess: (geographyId: string, label: string) => void;
  onReturn: () => void;
}

export default function GeographicConfirmationView({
  population,
  metadata,
  onSubmitSuccess,
  onReturn,
}: GeographicConfirmationViewProps) {
  const { mutateAsync: createGeographicAssociation, isPending } = useCreateGeographicAssociation();
  const currentUserId = MOCK_USER_ID;

  // Build geographic population data from existing geography
  const buildGeographicPopulation = (): Omit<UserGeographyPopulation, 'createdAt' | 'type'> => {
    if (!population?.geography) {
      throw new Error('No geography found in population state');
    }

    const basePopulation = {
      id: `${currentUserId}-${Date.now()}`,
      userId: currentUserId,
      countryId: population.geography.countryId,
      geographyId: population.geography.geographyId,
      scope: population.geography.scope,
      label: population.label || population.geography.name || undefined,
    };

    return basePopulation;
  };

  const handleSubmit = async () => {
    const populationData = buildGeographicPopulation();
    console.log('Creating geographic population:', populationData);

    try {
      const result = await createGeographicAssociation(populationData);
      console.log('Geographic population created successfully:', result);
      onSubmitSuccess(result.geographyId, result.label || '');
    } catch (err) {
      console.error('Failed to create geographic association:', err);
    }
  };

  // Build display content based on geographic scope
  const buildDisplayContent = () => {
    if (!population?.geography) {
      return (
        <Stack gap="md">
          <Text c="red">No geography selected</Text>
        </Stack>
      );
    }

    const geographyCountryId = population.geography.countryId;

    if (population.geography.scope === 'national') {
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
    const regionCode = population.geography.geographyId;
    const regionLabel = getRegionLabel(regionCode, metadata);
    const regionTypeName = getRegionTypeLabel(geographyCountryId, regionCode, metadata);

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
