/**
 * GeographicConfirmationView - View for confirming geographic population selection
 * Users can select a geography for simulation without creating a user association
 */

import { Stack, Text } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { MetadataRegionEntry } from '@/types/metadata';
import { PopulationStateProps } from '@/types/pathwayState';
import { getCountryLabel, getRegionLabel, getRegionTypeLabel } from '@/utils/geographyUtils';

interface GeographicConfirmationViewProps {
  population: PopulationStateProps;
  regions: MetadataRegionEntry[];
  onSubmitSuccess: (geographyId: string, label: string) => void;
  onBack?: () => void;
}

export default function GeographicConfirmationView({
  population,
  regions,
  onSubmitSuccess,
  onBack,
}: GeographicConfirmationViewProps) {
  const handleSubmit = () => {
    if (!population?.geography) {
      return;
    }

    const geographyId = population.geography.geographyId;
    const label = population.geography.name || getRegionLabel(geographyId, regions);
    onSubmitSuccess(geographyId, label);
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
    const regionLabel = getRegionLabel(regionCode, regions);
    const regionTypeName = getRegionTypeLabel(geographyCountryId, regionCode, regions);

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
  };

  return (
    <PathwayView
      title="Confirm household collection"
      content={buildDisplayContent()}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
    />
  );
}
