import { HouseholdMetadata } from '@/types/metadata/householdMetadata';
import { HouseholdCreationPayload } from '@/types/payloads';
import { datasetsAPI } from './v2/datasets';

export async function fetchHouseholdById(
  country: string,
  household: string
): Promise<HouseholdMetadata> {
  const versionedDataset = await datasetsAPI.getVersionedDataset(household);
  // Transform to expected format
  return {
    id: versionedDataset.id,
    country_id: country,
    data: versionedDataset.data,
    label: versionedDataset.metadata?.label || `Household ${versionedDataset.id}`,
  } as HouseholdMetadata;
}

export async function createHousehold(
  data: HouseholdCreationPayload
): Promise<{ result: { household_id: string } }> {
  // First create the dataset
  const dataset = await datasetsAPI.createDataset({
    name: data.label || 'Household',
    description: 'Household configuration',
    type: 'household',
    country: data.country_id,
  });

  // Then create a versioned dataset with the household data
  const versionedDataset = await datasetsAPI.createVersionedDataset({
    dataset_id: dataset.id,
    version: '1.0.0',
    data: data.data,
    metadata: {
      label: data.label,
      country_id: data.country_id,
    },
  });

  return {
    result: {
      household_id: versionedDataset.id,
    },
  };
}
