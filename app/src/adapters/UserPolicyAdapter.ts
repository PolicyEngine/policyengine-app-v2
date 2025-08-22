import { UserPolicy } from '@/types/ingredients/UserPolicy';

/**
 * Adapter for converting between UserPolicy and API formats
 */
export class UserPolicyAdapter {
  /**
   * Converts API response to UserPolicy type
   * The API typically returns string IDs which we convert to numbers
   */
  static fromApi(apiData: {
    userId: string;
    policyId: string;
    label?: string;
    createdAt: string;
    updatedAt?: string;
    isCreated?: boolean;
  }): UserPolicy {
    return {
      id: parseInt(apiData.policyId), // Using policyId as the UserPolicy id for now
      userId: parseInt(apiData.userId),
      policyId: parseInt(apiData.policyId),
      label: apiData.label,
      createdAt: apiData.createdAt,
      updatedAt: apiData.updatedAt,
      isCreated: apiData.isCreated ?? true, // If we have data from API, it's been created
    };
  }
  
  /**
   * Converts UserPolicy to format for API requests
   */
  static toApi(userPolicy: UserPolicy): {
    userId: string;
    policyId: string;
    label?: string;
    updatedAt?: string;
  } {
    return {
      userId: userPolicy.userId.toString(),
      policyId: userPolicy.policyId.toString(),
      label: userPolicy.label,
      updatedAt: userPolicy.updatedAt || new Date().toISOString(),
    };
  }
}