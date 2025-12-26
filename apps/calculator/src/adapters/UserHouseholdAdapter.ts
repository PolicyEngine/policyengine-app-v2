import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Adapter for converting between UserHouseholdPopulation and API formats
 */
export class UserHouseholdAdapter {
  /**
   * Convert UserHouseholdPopulation to API creation payload
   * Note: This endpoint doesn't exist yet
   */
  static toCreationPayload(userHousehold: UserHouseholdPopulation): any {
    return {
      user_id: userHousehold.userId,
      household_id: userHousehold.householdId,
      country_id: userHousehold.countryId,
      label: userHousehold.label,
      created_at: userHousehold.createdAt,
      updated_at: userHousehold.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserHouseholdPopulation
   * Note: This endpoint doesn't exist yet
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   */
  static fromApiResponse(apiData: any): UserHouseholdPopulation {
    return {
      type: 'household' as const,
      id: String(apiData.household_id),
      userId: String(apiData.user_id),
      householdId: String(apiData.household_id),
      countryId: apiData.country_id,
      label: apiData.label,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at,
      isCreated: true,
    };
  }
}
