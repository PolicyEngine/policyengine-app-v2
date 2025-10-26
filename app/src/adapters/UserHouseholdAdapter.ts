import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Adapter for converting between UserHouseholdPopulation and API formats
 */
export class UserHouseholdAdapter {
  /**
   * Convert UserHouseholdPopulation to API creation payload
   */
  static toCreationPayload(userHousehold: UserHouseholdPopulation): any {
    // For now, just return the object as-is since the API structure isn't defined
    // When the API is ready, this will transform to the proper payload format
    return {
      userId: userHousehold.userId,
      householdId: userHousehold.householdId,
      countryId: userHousehold.countryId,
      label: userHousehold.label,
      updatedAt: userHousehold.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserHouseholdPopulation
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   */
  static fromApiResponse(apiData: any): UserHouseholdPopulation {
    return {
      type: 'household' as const,
      id: String(apiData.householdId),
      userId: String(apiData.userId),
      householdId: String(apiData.householdId),
      countryId: apiData.countryId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
  }
}
