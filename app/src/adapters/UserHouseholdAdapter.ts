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
      label: userHousehold.label,
      updatedAt: userHousehold.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserHouseholdPopulation
   */
  static fromApiResponse(apiData: any): UserHouseholdPopulation {
    return {
      type: 'household' as const,
      id: apiData.householdId,
      userId: apiData.userId,
      householdId: apiData.householdId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
  }
}
