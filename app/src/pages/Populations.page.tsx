import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { PopulationCreationFlow } from '@/flows/populationCreationFlow';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { setFlow } from '@/reducers/flowReducer';

export default function PopulationsPage() {
  const userId = 'anonymous'; // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything

  // TODO: All we're doing right now is fetching user-household associations;
  // we should also fetch policies and display them in the view
  // TODO: Fix isError
  const { data, isLoading, isError, error } = useUserHouseholds(userId);
  const dispatch = useDispatch();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

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

  // TODO: Refactor this func to accurately determine scope, depending on schema changes
  // Helper function to determine if a household has geographic scope or household configuration
  const getDetailsType = (/*geography: any*/): 'geographic' | 'household' => {
    // To implement: check if household has state information (geographic scope)
    // Default to household configuration
    return 'household';
  };

  // To implement: Helper function to get geographic scope details
  const getGeographicDetails = (/*geography: any*/) => {
    // To implement: get geographic scope details
    return [];
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

  // Transform the data to match the new structure
  const transformedData: IngredientRecord[] =
    data?.map((item) => {
      // TODO: Implement this
      const detailsType = getDetailsType(/*item.household*/);
      const detailsItems =
        detailsType === 'geographic'
          ? getGeographicDetails(/*item.household*/)
          : getHouseholdDetails(item.household);

      return {
        id: item.association.householdId,
        populationName: {
          text: item.household?.label || `Population #${item.association.householdId}`,
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
