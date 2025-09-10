import { UserGeographyPopulation } from '@/types/ingredients/UserPopulation';

/**
 * Adapter for converting between UserGeographyPopulation and API formats
 */
export class UserGeographicAdapter {
  /**
   * Convert UserGeographyPopulation to API creation payload
   */
  static toCreationPayload(population: UserGeographyPopulation): any {
    // For now, just return the object as-is since the API structure isn't defined
    // When the API is ready, this will transform to the proper payload format
    return population;
  }

  /**
   * Convert API response to UserGeographyPopulation
   */
  static fromApiResponse(apiData: any): UserGeographyPopulation {
    return apiData as UserGeographyPopulation;
  }
}
