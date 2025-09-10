import { useDispatch, useSelector } from 'react-redux';
import { Stack, Text } from '@mantine/core';
import FlowView from '@/components/common/FlowView';
import { MOCK_USER_ID } from '@/constants';
import { useIngredientReset } from '@/hooks/useIngredientReset';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import {
  markPopulationAsCreated,
  updatePopulationId,
  updatePopulationLabel,
} from '@/reducers/populationReducer';
import { RootState } from '@/store';
import { FlowComponentProps } from '@/types/flow';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { getCountryLabel, getRegionLabel, getRegionType } from '@/utils/geographyUtils';

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
  // Get metadata from state
  const metadata = useSelector((state: RootState) => state.metadata);
  const userDefinedLabel = useSelector((state: RootState) => state.population.label);


  // Build geographic population data from existing geography in reducer
  const buildGeographicPopulation = (): Omit<UserGeographyPopulation, 'createdAt' | 'type'> => {
    if (!population.geography) {
      throw new Error('No geography found in population state');
    }

    const basePopulation = {
      id: `${currentUserId}-${Date.now()}`, // TODO: May need to modify this after changes to API
      userId: currentUserId,
      countryId: population.geography.countryId,
      geographyId: population.geography.geographyId,
      scope: population.geography.scope,
      label: userDefinedLabel || population.geography.name || undefined
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
    if (!population.geography) {
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
            Confirm Geographic Selection
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
    const regionTypeName = getRegionType(geographyCountryId) === 'state' ? 'State' : 'Constituency';

    return (
      <Stack gap="md">
        <Text fw={600} fz="lg">
          Confirm Geographic Selection
        </Text>
        <Text>
          <strong>Scope:</strong> {regionTypeName}
        </Text>
        <Text>
          <strong>Country:</strong> {getCountryLabel(geographyCountryId)}
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
