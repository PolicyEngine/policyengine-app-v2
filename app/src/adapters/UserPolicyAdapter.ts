import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserPolicyCreationPayload } from '@/types/payloads';

/**
 * Adapter for converting between UserPolicy and API formats
 */
export class UserPolicyAdapter {
  /**
   * Convert UserPolicy to API creation payload
   * Note: API endpoint doesn't exist yet
   *
   */
  static toCreationPayload(
    userPolicy: Omit<UserPolicy, 'id' | 'createdAt'>
  ): UserPolicyCreationPayload {
    return {
      user_id: String(userPolicy.userId),
      policy_id: String(userPolicy.policyId),
      country_id: userPolicy.countryId,
      label: userPolicy.label,
      created_at: userPolicy.createdAt,
      updated_at: userPolicy.updatedAt || new Date().toISOString(),
    } as any;
  }

  /**
   * Convert API response to UserPolicy
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   * Note: API endpoint doesn't exist yet
   */
  static fromApiResponse(apiData: any): UserPolicy {
    return {
      id: String(apiData.policy_id),
      userId: String(apiData.user_id),
      policyId: String(apiData.policy_id),
      countryId: apiData.country_id,
      label: apiData.label,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at,
      isCreated: true,
    };
  }
}
