import { toLegacyId } from '@/api/v2Associations';
import { UserPolicy } from '@/types/ingredients/UserPolicy';
import type {
  AssociationCountryId,
  UserPolicyCreateBody,
  UserPolicyItem,
  UserPolicyPatchBody,
} from '@/types/v2User';

/**
 * Converts between UserPolicy and the `/v2/user-policies` wire format.
 * The association's `id` is the server UUID; `policyId` is the v1 policy
 * ID (`legacy_policy_id`) as a string. No user ID is ever sent.
 */
export class UserPolicyAdapter {
  static toCreationPayload(
    userPolicy: Pick<UserPolicy, 'policyId' | 'label'>,
    countryId: AssociationCountryId
  ): UserPolicyCreateBody {
    return {
      country_id: countryId,
      legacy_policy_id: toLegacyId(userPolicy.policyId, 'policy'),
      ...(userPolicy.label ? { name: userPolicy.label } : {}),
    };
  }

  static toUpdatePayload(updates: Partial<UserPolicy>): UserPolicyPatchBody {
    const body: UserPolicyPatchBody = {};
    if ('label' in updates) {
      body.name = updates.label || null;
    }
    if (updates.policyId !== undefined) {
      body.legacy_policy_id = toLegacyId(updates.policyId, 'policy');
    }
    return body;
  }

  /** Rows without a v1 policy (v2-only) cannot be shown by this app yet. */
  static hasLegacyPolicy(item: UserPolicyItem): boolean {
    return item.legacy_policy_id !== null && item.legacy_policy_id !== undefined;
  }

  static fromApiItem(item: UserPolicyItem): UserPolicy {
    return {
      id: item.id,
      userId: item.user_id,
      policyId: String(item.legacy_policy_id),
      countryId: item.country_id,
      label: item.name ?? undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      isCreated: true,
    };
  }
}
