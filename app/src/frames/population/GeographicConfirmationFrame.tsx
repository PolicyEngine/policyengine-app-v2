import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { selectActivePopulation, selectCurrentPosition } from '@/reducers/activeSelectors';
import {
  updatePopulationAtPosition,
  updatePopulationIdAtPosition,
} from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { getCountryLabel, getRegionLabel, getRegionTypeLabel } from '@/utils/geographyUtils';

export default function GeographicConfirmationFrame({
  onNavigate,
  onReturn,
  isInSubflow,
}: FlowComponentProps) {
  const dispatch = useDispatch();
  const currentPosition = useSelector((state: RootState) => selectCurrentPosition(state));
  const populationState = useSelector((state: RootState) => selectActivePopulation(state));
  const { mutateAsync: createGeographicAssociation, isPending } = useCreateGeographicAssociation();
  const { resetIngredient } = useIngredientReset();

  // Hardcoded for now - TODO: Replace with actual user from auth context
  const currentUserId = MOCK_USER_ID;
  // Get metadata from state
  const metadata = useSelector((state: RootState) => state.metadata);
  const userDefinedLabel = populationState?.label || null;

  // Build geographic population data from existing geography in reducer
  const buildGeographicPopulation = (): Omit<UserGeographyPopulation, 'createdAt' | 'type'> => {
    if (!populationState?.geography) {
      throw new Error('No geography found in population state');
    }

    const basePopulation = {
      id: `${currentUserId}-${Date.now()}`, // TODO: May need to modify this after changes to API
      userId: currentUserId,
      countryId: populationState.geography.countryId,
      geographyId: populationState.geography.geographyId,
      scope: populationState.geography.scope,
      label: userDefinedLabel || populationState.geography.name || undefined,
    };

    return basePopulation;
  };

  const handleSubmit = async () => {
    const populationData = buildGeographicPopulation();
    console.log('Creating geographic population:', populationData);

    try {
      const result = await createGeographicAssociation(populationData);
      console.log('Geographic population created successfully:', result);

      // Update population state with the created population ID and mark as created
      dispatch(
        updatePopulationIdAtPosition({
          position: currentPosition,
          id: result.geographyId,
        })
      );
      dispatch(
        updatePopulationAtPosition({
          position: currentPosition,
          updates: {
            label: result.label || '',
            isCreated: true,
          },
        })
      );

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
    if (!populationState?.geography) {
      return (
        <Stack gap="md">
          <Text c="red">No geography selected</Text>
        </Stack>
      );
    }

    const geographyCountryId = populationState.geography.countryId;

    if (populationState.geography.scope === 'national') {
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
    const regionCode = populationState.geography.geographyId;
    const regionLabel = getRegionLabel(regionCode, metadata);
    const regionTypeName = getRegionTypeLabel(geographyCountryId, regionCode, metadata);

    console.log(
      `[GeographicConfirmationFrame] regionTypeName: ${regionTypeName}, regionLabel: ${regionLabel}`
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
