import { useDispatch } from 'react-redux';
import { Space, Stack } from '@mantine/core';
import IngredientReadView from '@/components/IngredientReadView';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { useGeographicAssociationsByUser } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { setFlow } from '@/reducers/flowReducer';

export default function PopulationsPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything

  // Fetch household associations
  const {
    data: householdData,
    isLoading: isHouseholdLoading,
    isError: isHouseholdError,
    error: householdError,
  } = useUserHouseholds(userId);

  // Fetch geographic associations
  const {
    data: geographicData,
    isLoading: isGeographicLoading,
    isError: isGeographicError,
    error: geographicError,
  } = useGeographicAssociationsByUser(userId);

  const dispatch = useDispatch();

  const handleNavigateToCreate = () => {
    dispatch(setFlow(PopulationCreationFlow));
    // onNavigate('next')
  };

  // Household table configuration
  const householdColumns = [
    { key: 'id', header: 'ID' } as const,
    { key: 'label', header: 'Label' } as const,
    { key: 'country_id', header: 'Country' } as const,
    { key: 'api_version', header: 'API Version' } as const,
  ];

  const householdTableData =
    householdData?.map((item) => ({
      id: item.association.householdId,
      label: item.household?.label || 'Unknown',
      country_id: item.household?.country_id || 'Unknown',
      api_version: item.household?.api_version || 'Unknown',
    })) || [];

  // Geographic associations table configuration
  const geographicColumns = [
    { key: 'id', header: 'Association ID' } as const,
    { key: 'type', header: 'Type' } as const,
    { key: 'label', header: 'Geography' } as const,
    { key: 'country', header: 'Country' } as const,
    { key: 'region', header: 'Region' } as const,
    { key: 'createdAt', header: 'Created' } as const,
  ];

  const geographicTableData =
    geographicData?.map((association) => ({
      id: association.id,
      type: association.geographyType === 'national' ? 'National' : 'Subnational',
      label: association.label,
      country: association.countryCode.toUpperCase(),
      region: association.regionCode || '-',
      createdAt: new Date(association.createdAt).toLocaleDateString(),
    })) || [];

  return (
    <Stack>
      <IngredientReadView
        title="Households"
        onCreate={handleNavigateToCreate}
        isLoading={isHouseholdLoading}
        isError={isHouseholdError}
        error={householdError}
        data={householdTableData}
        columns={householdColumns}
      />

      <Space h="xl" />

      <IngredientReadView
        title="Geographic Associations"
        onCreate={handleNavigateToCreate}
        isLoading={isGeographicLoading}
        isError={isGeographicError}
        error={geographicError}
        data={geographicTableData}
        columns={geographicColumns}
      />
    </Stack>
  );
}
