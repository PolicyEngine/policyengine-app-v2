import { UserPolicy } from '@/types/ingredients/UserPolicy';
import {
  UserPolicyCreationMetadata,
  UserPolicyMetadata,
  UserPolicyUpdateMetadata,
} from '@/types/metadata/userPolicyMetadata';

/**
 * Adapter for converting between UserPolicy and API formats
 */
export class UserPolicyAdapter {
  /**
   * Convert UserPolicy to API creation payload
   * Handles camelCase to snake_case conversion
   */
  static toCreationPayload(
    userPolicy: Omit<UserPolicy, 'id' | 'createdAt'>
  ): UserPolicyCreationMetadata {
    return {
      user_id: String(userPolicy.userId),
      policy_id: String(userPolicy.policyId),
      label: userPolicy.label,
    };
  }

  /**
   * Convert UserPolicy updates to API update payload
   * Handles camelCase to snake_case conversion
   */
  static toUpdatePayload(updates: Partial<UserPolicy>): UserPolicyUpdateMetadata {
    return {
      label: updates.label,
    };
  }

  /**
   * Convert API response to UserPolicy
   * Handles snake_case to camelCase conversion
   * Explicitly coerces IDs to strings to handle JSON.parse type mismatches
   */
  static fromApiResponse(apiData: UserPolicyMetadata): UserPolicy {
    return {
      id: String(apiData.id),
      userId: String(apiData.user_id),
      policyId: String(apiData.policy_id),
      label: apiData.label ?? undefined,
      createdAt: apiData.created_at,
      updatedAt: apiData.updated_at,
      isCreated: true,
    };
  }
}
