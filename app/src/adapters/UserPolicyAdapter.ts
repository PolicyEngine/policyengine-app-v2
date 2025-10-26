import { UserPolicy } from '@/types/ingredients/UserPolicy';
import { UserPolicyCreationPayload } from '@/types/payloads';

/**
 * Adapter for converting between UserPolicy and API formats
 */
export class UserPolicyAdapter {
  /**
   * Convert UserPolicy to API creation payload
   */
  static toCreationPayload(
    userPolicy: Omit<UserPolicy, 'id' | 'createdAt'>
  ): UserPolicyCreationPayload {
    return {
      userId: String(userPolicy.userId),
      policyId: String(userPolicy.policyId),
      countryId: userPolicy.countryId,
      label: userPolicy.label,
      updatedAt: userPolicy.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserPolicy
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   */
  static fromApiResponse(apiData: any): UserPolicy {
    return {
      id: String(apiData.policyId),
      userId: String(apiData.userId),
      policyId: String(apiData.policyId),
      countryId: apiData.countryId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
  }
}
