// src/frames/population/GeographicConfirmationFrame.tsx

import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { uk_regions, us_regions } from '@/mocks/regions';
import {
  markPopulationAsCreated,
  updatePopulationId,
  updatePopulationLabel,
} from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

export default function GeographicConfirmationFrame({
  onNavigate,
  onReturn,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();
  const population = useSelector((state: RootState) => state.population);
  const { mutateAsync: createGeographicAssociation, isPending } = useCreateGeographicAssociation();
  const { resetIngredient } = useIngredientReset();

  // Hardcoded for now - TODO: Replace with actual user from auth context
  const currentUserId = MOCK_USER_ID;
  // Get current country from metadata state, fallback to 'us' if not available
  const currentCountry = useSelector((state: RootState) => state.metadata.currentCountry) || 'us';

  // Helper function to get region label
  const getRegionLabel = (regionCode: string, countryCode: string): string => {
    if (countryCode === 'us') {
      const region = us_regions.result.economy_options.region.find(
        (r) => r.name === regionCode || r.name === `state/${regionCode}`
      );
      return region?.label || regionCode;
    }

    if (countryCode === 'uk') {
      const region = uk_regions.result.economy_options.region.find(
        (r) => r.name === regionCode || r.name === `constituency/${regionCode}`
      );
      return region?.label || regionCode;
    }

    return regionCode;
  };

  // Helper function to get country label
  const getCountryLabel = (countryCode: string): string => {
    const countryLabels: Record<string, string> = {
      us: 'United States',
      uk: 'United Kingdom',
    };
    return countryLabels[countryCode] || countryCode;
  };

  // Helper function to determine region type
  const getRegionType = (countryCode: string): 'state' | 'constituency' => {
    return countryCode === 'us' ? 'state' : 'constituency';
  };

  // Build geographic population data
  const buildGeographicPopulation = (): Omit<UserGeographyPopulation, 'createdAt' | 'type'> => {
    const basePopulation = {
      id: `${currentUserId}-${Date.now()}`, // TODO: May need to modify this after changes to API
      userId: currentUserId,
      countryId: currentCountry,
      geographyId: population.geography?.id || '',
      scope: population.geography?.scope || 'national' as const,
    };

    if (population.geography?.scope === 'national') {
      return {
        ...basePopulation,
        label: getCountryLabel(currentCountry),
      };
    }

    // Subnational (state/constituency)
    const regionCode = population.geography?.geographyId || '';
    return {
      ...basePopulation,
      label: getRegionLabel(regionCode, currentCountry),
    };
  };

  const handleSubmit = async () => {
    const populationData = buildGeographicPopulation();
    console.log('Creating geographic population:', populationData);

    try {
      const result = await createGeographicAssociation(populationData);
      console.log('Geographic population created successfully:', result);

      // Update population state with the created population ID and mark as created
      dispatch(updatePopulationId(result.geographyId));
      dispatch(updatePopulationLabel(result.label || ''));
      dispatch(markPopulationAsCreated());

      // If we've created this population as part of a standalone population creation flow,
      // we're done; clear the population reducer
      if (!isInSubflow) {
        resetIngredient('population');
      }

      // Return to calling flow or navigate back
      if (onReturn) {
        onReturn();
      } else {
        // For standalone flows, we should return/exit instead of navigating to 'next'
        onNavigate('__return__');
      }
    } catch (err) {
      console.error('Failed to create geographic association:', err);
    }
  };

  // Build display content based on geographic scope
  const buildDisplayContent = () => {
    if (population.geography?.scope === 'national') {
      return (
        <Stack gap="md">
          <Text fw={600} fz="lg">
            Confirm Geographic Selection
          </Text>
          <Text>
            <strong>Scope:</strong> National
          </Text>
          <Text>
            <strong>Country:</strong> {getCountryLabel(currentCountry)}
          </Text>
        </Stack>
      );
    }

    // Subnational
    const regionCode = population.geography?.geographyId || '';
    const regionLabel = getRegionLabel(regionCode, currentCountry);
    const regionTypeName = getRegionType(currentCountry) === 'state' ? 'State' : 'Constituency';

    return (
      <Stack gap="md">
        <Text fw={600} fz="lg">
          Confirm Geographic Selection
        </Text>
        <Text>
          <strong>Scope:</strong> {regionTypeName}
        </Text>
        <Text>
          <strong>Country:</strong> {getCountryLabel(currentCountry)}
        </Text>
        <Text>
          <strong>{regionTypeName}:</strong> {regionLabel}
        </Text>
      </Stack>
    );
  };

  const primaryAction = {
    label: 'Create Geographic Association',
    onClick: handleSubmit,
    isLoading: isPending,
  };

  return (
    <FlowView
      title="Confirm Geography"
      content={buildDisplayContent()}
      primaryAction={primaryAction}
    />
  );
}
