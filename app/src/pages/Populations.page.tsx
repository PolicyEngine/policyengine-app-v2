import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { useGeographicAssociationsByUser } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { setFlow } from '@/reducers/flowReducer';

export default function PopulationsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
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

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Combined loading and error states
  const isLoading = isHouseholdLoading || isGeographicLoading;
  const isError = isHouseholdError || isGeographicError;
  const error = householdError || geographicError;

  const handleBuildPopulation = () => {
    dispatch(setFlow(PopulationCreationFlow));
  };

  const handleMoreFilters = () => {
    // TODO: Implement more filters modal/dropdown
    console.log('More filters clicked');
  };

  const handleMenuAction = (action: string, recordId: string) => {
    switch (action) {
      case 'view-population':
        // TODO: Implement view population functionality
        console.log('View details:', recordId);
        break;
      case 'bookmark':
        // TODO: Implement bookmark functionality
        console.log('Bookmark population:', recordId);
        break;
      case 'edit':
        // TODO: Implement edit functionality
        console.log('Edit population:', recordId);
        break;
      case 'share':
        // TODO: Implement share functionality
        console.log('Share population:', recordId);
        break;
      case 'delete':
        // TODO: Implement delete functionality
        console.log('Delete population:', recordId);
        break;
      default:
        console.error('Unknown action:', action);
    }
  };

  const handleSelectionChange = (recordId: string, selected: boolean) => {
    setSelectedIds((prev) =>
      selected ? [...prev, recordId] : prev.filter((id) => id !== recordId)
    );
  };

  const isSelected = (recordId: string) => selectedIds.includes(recordId);

  // We have separate sources of data for household vs geographies. Can we remove this?
  // // Helper function to determine if an item is geographic or household
  // const getDetailsType = (item: any): 'geographic' | 'household' => {
  //   // If item has geographyType, it's a geographic association
  //   if (item.geographyType) {
  //     return 'geographic';
  //   }
  //   // Otherwise it's a household
  //   return 'household';
  // };

  // Helper function to get geographic scope details
  const getGeographicDetails = (geography: any) => {
    const details = [];

    // Add geography type
    const typeLabel = geography.geographyType === 'national' ? 'National' : 'Subnational';
    details.push({ text: typeLabel, badge: '' });

    // Add country
    details.push({ text: geography.countryCode.toUpperCase(), badge: '' });

    // Add region if subnational
    if (geography.geographyType === 'subnational' && geography.regionCode) {
      const regionTypeLabel = geography.regionType === 'state' ? 'State' : 'Constituency';
      details.push({ text: `${regionTypeLabel}: ${geography.regionCode}`, badge: '' });
    }

    return details;
  };

  // Helper function to get household configuration details
  // TODO: Improve this placeholder function
  const getHouseholdDetails = (household: any) => {
    const peopleCount = Object.keys(household?.household_json?.people || {}).length;
    const familiesCount = Object.keys(household?.household_json?.families || {}).length;
    return [
      { text: `${peopleCount} person${peopleCount !== 1 ? 's' : ''}`, badge: '' },
      { text: `${familiesCount} household${familiesCount !== 1 ? 's' : ''}`, badge: '' },
    ];
  };

  // Define column configurations for populations
  const populationColumns: ColumnConfig[] = [
    {
      key: 'populationName',
      header: 'Population name',
      type: 'text',
    },
    {
      key: 'dateCreated',
      header: 'Date created',
      type: 'text',
    },
    {
      key: 'details',
      header: 'Details',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'connections',
      header: 'Connections',
      type: 'bullets',
      items: [
        {
          textKey: 'text',
          badgeKey: 'badge',
        },
      ],
    },
    {
      key: 'actions',
      header: '',
      type: 'split-menu',
      actions: [
        { label: 'View details', action: 'view-population' },
        { label: 'Bookmark', action: 'bookmark' },
        { label: 'Edit', action: 'edit' },
        { label: 'Share', action: 'share' },
        { label: 'Delete', action: 'delete', color: 'red' },
      ],
      onAction: handleMenuAction,
    },
  ];

  // Transform household data
  const householdRecords: IngredientRecord[] =
    householdData?.map((item) => {
      const detailsItems = getHouseholdDetails(item.household);

      return {
        id: item.association.householdId.toString(),
        populationName: {
          text: `Population #${item.association.householdId}`,
        } as TextValue,
        dateCreated: {
          text: 'Just now', // TODO: Format actual date from item data
        } as TextValue,
        details: {
          items: detailsItems,
        } as BulletsValue,
        connections: {
          items: [
            {
              text: 'Sample simulation',
              badge: '',
            },
            {
              text: 'Sample report',
              badge: '',
            },
          ],
        } as BulletsValue,
      };
    }) || [];

  // Transform geographic data
  const geographicRecords: IngredientRecord[] =
    geographicData?.map((association) => {
      const detailsItems = getGeographicDetails(association);

      return {
        id: `geographic-${association.id}`,
        populationName: {
          text: association.label,
        } as TextValue,
        dateCreated: {
          text: new Date(association.createdAt).toLocaleDateString(),
        } as TextValue,
        details: {
          items: detailsItems,
        } as BulletsValue,
        connections: {
          items: [
            {
              text: 'Available for simulations',
              badge: '',
            },
          ],
        } as BulletsValue,
      };
    }) || [];

  // Combine both data sources
  const transformedData: IngredientRecord[] = [...householdRecords, ...geographicRecords];

  return (
    <IngredientReadView
      ingredient="population"
      title="Your populations"
      subtitle="Create a population configuration or find and save existing populations to use in your simulation configurations."
      onBuild={handleBuildPopulation}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={transformedData}
      columns={populationColumns}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      onMoreFilters={handleMoreFilters}
      enableSelection
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
    />
  );
}
