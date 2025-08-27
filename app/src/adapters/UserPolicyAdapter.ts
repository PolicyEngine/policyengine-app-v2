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
      userId: userPolicy.userId.toString(),
      policyId: userPolicy.policyId.toString(),
      label: userPolicy.label,
      updatedAt: userPolicy.updatedAt || new Date().toISOString(),
    };
  }

  /**
   * Convert API response to UserPolicy
   */
  static fromApiResponse(apiData: any): UserPolicy {
    return {
      id: apiData.policyId,
      userId: apiData.userId,
      policyId: apiData.policyId,
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: true,
    };
  }
}
