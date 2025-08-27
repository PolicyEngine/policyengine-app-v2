import { HouseholdData as APIHouseholdData } from '@/types/metadata/householdMetadata';

/**
 * Payload format for creating a household via the API
 */
export interface HouseholdCreationPayload {
  country_id: string;
  api_version: string;
  household_json: APIHouseholdData;
  label?: string;
}