import { UserGeographicAssociation } from '@/types/userIngredientAssociations';

/**
 * Adapter for converting between UserGeographicAssociation and API formats
 */
export class UserGeographicAdapter {
  /**
   * Convert UserGeographicAssociation to API creation payload
   */
  static toCreationPayload(association: Omit<UserGeographicAssociation, 'createdAt'>): any {
    // For now, just return the object as-is since the API structure isn't defined
    // When the API is ready, this will transform to the proper payload format
    return association;
  }

  /**
   * Convert API response to UserGeographicAssociation
   */
  static fromApiResponse(apiData: any): UserGeographicAssociation {
    return apiData as UserGeographicAssociation;
  }
}
