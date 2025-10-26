import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserPolicyCreationMetadata, UserPolicyMetadata } from '@/types/metadata/userPolicyMetadata';

/**
 * Adapter for converting between UserPolicy and API formats
 */
export class UserPolicyAdapter {
  /**
   * Convert UserPolicy to API creation payload
   * Handles camelCase to snake_case conversion
   * Note: API endpoint doesn't exist yet
   */
  static toCreationPayload(
    userPolicy: Omit<UserPolicy, 'id' | 'createdAt'>
  ): UserPolicyCreationMetadata {
    return {
      user_id: String(userPolicy.userId),
      policy_id: String(userPolicy.policyId),
      country_id: userPolicy.countryId,
      label: userPolicy.label,
      updated_at: userPolicy.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserPolicy
   * Handles snake_case to camelCase conversion
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   * Note: API endpoint doesn't exist yet
   */
  static fromApiResponse(apiData: UserPolicyMetadata): UserPolicy {
    return {
      id: String(apiData.policy_id),
      userId: String(apiData.user_id),
      policyId: String(apiData.policy_id),
      countryId: apiData.country_id,
      label: apiData.label ?? undefined,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at,
      isCreated: true,
    };
  }
}
