import { UserPolicy } from '@/types/ingredients';
import { UserPolicyAssociation } from '@/types/userIngredientAssociations';

/**
 * Adapter for converting between UserPolicy and API formats
 */
export class UserPolicyAdapter {
  /**
   * Converts UserPolicyAssociation from API/storage to UserPolicy type
   */
  static fromAssociation(association: UserPolicyAssociation): UserPolicy {
    return {
      id: parseInt(association.policyId), // Using policyId as the UserPolicy id for now
      userId: parseInt(association.userId),
      policyId: parseInt(association.policyId),
      label: association.label,
      createdAt: association.createdAt,
      updatedAt: association.updatedAt,
      isCreated: true, // If we have an association, it's been created
    };
  }
  
  /**
   * Converts UserPolicy to format for creating/updating association
   */
  static toAssociation(userPolicy: UserPolicy): Omit<UserPolicyAssociation, 'createdAt'> {
    return {
      userId: userPolicy.userId.toString(),
      policyId: userPolicy.policyId.toString(),
      label: userPolicy.label,
      updatedAt: new Date().toISOString(),
    };
  }
}