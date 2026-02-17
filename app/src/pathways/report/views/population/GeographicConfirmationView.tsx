/**
 * GeographicConfirmationView - View for confirming geographic population selection
 * Users can select a geography for simulation without creating a user association
 *
 * Note: With Phase 2 changes, this view is typically skipped for geography selections.
 * It remains for potential future use or edge cases.
 */

import { Stack, Text } from '@mantine/core';
import PathwayView from '@/components/common/PathwayView';
import { isNationalGeography } from '@/types/ingredients/Geography';
import { MetadataRegionEntry } from '@/types/metadata';
import { PopulationStateProps } from '@/types/pathwayState';
import { getCountryLabel, getRegionLabel } from '@/utils/geographyUtils';

interface GeographicConfirmationViewProps {
  population: PopulationStateProps;
  regions: MetadataRegionEntry[];
  onSubmitSuccess: (regionCode: string, label: string) => void;
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

    const regionCode = population.geography.regionCode;
    const label = getRegionLabel(regionCode, regions);
    onSubmitSuccess(regionCode, label);
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
    const regionCode = population.geography.regionCode;

    const label = isNationalGeography(population.geography)
      ? getCountryLabel(geographyCountryId)
      : getRegionLabel(regionCode, regions);

    return (
      <Stack gap="md">
        <Text fw={600} fz="lg">
          Households in {label}
        </Text>
      </Stack>
    );
  };

  const primaryAction = {
    label: 'Confirm',
    onClick: handleSubmit,
  };

  return (
    <PathwayView
      title="Confirm geography"
      content={buildDisplayContent()}
      primaryAction={primaryAction}
      backAction={onBack ? { onClick: onBack } : undefined}
    />
  );
}
