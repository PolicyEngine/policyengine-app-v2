/**
 * GeographicConfirmationView - View for confirming geographic population
 * Duplicated from GeographicConfirmationFrame
 * Props-based instead of Redux-based
 */

import { Stack } from '@/components/ui';
import PathwayView from '@/components/common/PathwayView';
import { MOCK_USER_ID } from '@/constants';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { PopulationStateProps } from '@/types/pathwayState';
import { getCountryLabel, getRegionLabel, getRegionTypeLabel } from '@/utils/geographyUtils';

interface GeographicConfirmationViewProps {
  population: PopulationStateProps;
  metadata: any;
  onSubmitSuccess: (geographyId: string, label: string) => void;
  onBack?: () => void;
}

export default function GeographicConfirmationView({
  population,
  metadata,
  onSubmitSuccess,
  onBack,
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

    try {
      const result = await createGeographicAssociation(populationData);
      onSubmitSuccess(result.geographyId, result.label || '');
    } catch (err) {
      // Error is handled by the mutation
    }
  };

  // Build display content based on geographic scope
  const buildDisplayContent = () => {
    if (!population?.geography) {
      return (
        <Stack gap="md">
          <p className="tw:text-red-600">No geography selected</p>
        </Stack>
      );
    }

    const geographyCountryId = population.geography.countryId;

    if (population.geography.scope === 'national') {
      return (
        <Stack gap="md">
          <p className="tw:font-semibold tw:text-lg">
            Confirm household collection
          </p>
          <p>
            <strong>Scope:</strong> National
          </p>
          <p>
            <strong>Country:</strong> {getCountryLabel(geographyCountryId)}
          </p>
        </Stack>
      );
    }

    // Subnational
    const regionCode = population.geography.geographyId;
    const regionLabel = getRegionLabel(regionCode, metadata);
    const regionTypeName = getRegionTypeLabel(geographyCountryId, regionCode, metadata);

    return (
      <Stack gap="md">
        <p className="tw:font-semibold tw:text-lg">
          Confirm household collection
        </p>
        <p>
          <strong>Scope:</strong> {regionTypeName}
        </p>
        <p>
          <strong>{regionTypeName}:</strong> {regionLabel}
        </p>
      </Stack>
    );
  };

  const primaryAction = {
    label: 'Create household collection',
    onClick: handleSubmit,
    isLoading: isPending,
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
