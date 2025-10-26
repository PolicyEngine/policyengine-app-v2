import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Adapter for converting between UserGeographyPopulation and API formats
 */
export class UserGeographicAdapter {
  /**
   * Convert UserGeographyPopulation to API creation payload
   * Note: This endpoint doesn't exist yet
   */
  static toCreationPayload(population: UserGeographyPopulation): any {
    return {
      user_id: population.userId,
      geography_id: population.geographyId,
      country_id: population.countryId,
      label: population.label,
      scope: population.scope,
      created_at: population.createdAt,
      updated_at: population.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserGeographyPopulation
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   * Note: API endpoint doesn't exist yet
   */
  static fromApiResponse(apiData: any): UserGeographyPopulation {
    return {
      type: 'geography' as const,
      id: String(apiData.geography_id),
      userId: String(apiData.user_id),
      geographyId: String(apiData.geography_id),
      countryId: apiData.country_id,
      scope: apiData.scope || 'national',
      label: apiData.label,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at,
      isCreated: true,
    };
  }
}
