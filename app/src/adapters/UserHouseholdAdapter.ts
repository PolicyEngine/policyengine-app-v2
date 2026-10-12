import { toLegacyId } from '@/api/v2Associations';
import { UserHouseholdPopulation } from '@/types/ingredients/UserPopulation';
import type {
  AssociationCountryId,
  UserHouseholdCreateBody,
  UserHouseholdItem,
  UserHouseholdPatchBody,
} from '@/types/v2User';

/**
 * Converts between UserHouseholdPopulation and the `/v2/user-households`
 * wire format. `householdId` is the v1 household ID (`legacy_household_id`).
 */
export class UserHouseholdAdapter {
  static toCreationPayload(
    userHousehold: Pick<UserHouseholdPopulation, 'householdId' | 'label'>,
    countryId: AssociationCountryId
  ): UserHouseholdCreateBody {
    return {
      country_id: countryId,
      legacy_household_id: toLegacyId(userHousehold.householdId, 'household'),
      ...(userHousehold.label ? { name: userHousehold.label } : {}),
    };
  }

  static toUpdatePayload(updates: Partial<UserHouseholdPopulation>): UserHouseholdPatchBody {
    const body: UserHouseholdPatchBody = {};
    if ('label' in updates) {
      body.name = updates.label || null;
    }
    if (updates.householdId !== undefined) {
      body.legacy_household_id = toLegacyId(updates.householdId, 'household');
    }
    return body;
  }

  static hasLegacyHousehold(item: UserHouseholdItem): boolean {
    return item.legacy_household_id !== null && item.legacy_household_id !== undefined;
  }

  static fromApiItem(item: UserHouseholdItem): UserHouseholdPopulation {
    return {
      type: 'household' as const,
      id: item.id,
      userId: item.user_id,
      householdId: String(item.legacy_household_id),
      countryId: item.country_id,
      label: item.name ?? undefined,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      isCreated: true,
    };
  }
}
