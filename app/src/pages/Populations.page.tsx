import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { BulletsValue, ColumnConfig, IngredientRecord, TextValue } from '@/components/columns';
import IngredientReadView from '@/components/IngredientReadView';
import { MOCK_USER_ID } from '@/constants';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import { useGeographicAssociationsByUser } from '@/hooks/useUserGeographic';
import { useUserHouseholds } from '@/hooks/useUserHousehold';
import { countryIds } from '@/libs/countries';
import { RootState } from '@/store';
import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';
import { formatDate } from '@/utils/dateUtils';
import { getCountryLabel } from '@/utils/geographyUtils';

export default function PopulationsPage() {
  const userId = MOCK_USER_ID.toString(); // TODO: Replace with actual user ID retrieval logic
  // TODO: Session storage hard-fixes "anonymous" as user ID; this should really just be anything
  const metadata = useSelector((state: RootState) => state.metadata);
  const countryId = useCurrentCountry();

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

  const navigate = useNavigate();

  const [searchValue, setSearchValue] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Combined loading and error states
  const isLoading = isHouseholdLoading || isGeographicLoading;
  const isError = isHouseholdError || isGeographicError;
  const error = householdError || geographicError;

  const handleBuildPopulation = () => {
    navigate(`/${countryId}/populations/create`);
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
  const getGeographicDetails = (geography: UserGeographyPopulation) => {
    const details = [];

    // Add geography scope
    const typeLabel = geography.scope === 'national' ? 'National' : 'Subnational';
    details.push({ text: typeLabel, badge: '' });

    // Add country
    const countryLabel = getCountryLabel(geography.countryId);
    details.push({ text: countryLabel, badge: '' });

    // Add region if subnational
    if (geography.scope === 'subnational' && geography.geographyId) {
      // Look up the region label from metadata
      let regionLabel = geography.geographyId;
      if (metadata.economyOptions?.region) {
        const region = metadata.economyOptions.region.find(
          (r) =>
            r.name === geography.geographyId ||
            r.name === `state/${geography.geographyId}` ||
            r.name === `constituency/${geography.geographyId}`
        );
        if (region?.label) {
          regionLabel = region.label;
        }
      }

      // Determine region type based on country
      const regionTypeLabel = geography.countryId === 'us' ? 'State' : 'Constituency';
      details.push({ text: `${regionTypeLabel}: ${regionLabel}`, badge: '' });
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
  ];

  // Transform household data
  const householdRecords: IngredientRecord[] =
    householdData?.map((item) => {
      const detailsItems = getHouseholdDetails(item.household);

      return {
        id: item.association.householdId.toString(),
        populationName: {
          text: item.association.label || `Household #${item.association.householdId}`,
        } as TextValue,
        dateCreated: {
          text: item.association.createdAt
            ? formatDate(
                item.association.createdAt,
                'short-month-day-year',
                item.association.countryId,
                true
              )
            : '',
        } as TextValue,
        details: {
          items: detailsItems,
        } as BulletsValue,
      };
    }) || [];

  // Transform geographic data
  const geographicRecords: IngredientRecord[] =
    geographicData?.map((association) => {
      const detailsItems = getGeographicDetails(association);

      return {
        id: association.id || '',
        populationName: {
          text: association.label,
        } as TextValue,
        dateCreated: {
          text: association.createdAt
            ? formatDate(
                association.createdAt,
                'short-month-day-year',
                association?.countryId as (typeof countryIds)[number],
                true
              )
            : '',
        } as TextValue,
        details: {
          items: detailsItems,
        } as BulletsValue,
      };
    }) || [];

  // Combine both data sources
  const transformedData: IngredientRecord[] = [...householdRecords, ...geographicRecords];

  return (
    <IngredientReadView
      ingredient="population"
      title="Your saved populations"
      subtitle="Create a population configuration or find and save existing populations to use in your simulation configurations."
      onBuild={handleBuildPopulation}
      isLoading={isLoading}
      isError={isError}
      error={error}
      data={transformedData}
      columns={populationColumns}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      enableSelection
      isSelected={isSelected}
      onSelectionChange={handleSelectionChange}
    />
  );
}
