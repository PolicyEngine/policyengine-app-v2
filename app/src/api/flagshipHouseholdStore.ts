import {
  AccountAssociationRoutes,
  isAccountId,
  isLegacyId,
  type ApiStoreContext,
} from '@/api/v2Associations';
import { clampStoreText } from '@/libs/flagship/storeText';
import type { UserHouseholdCreateBody } from '@/types/v2Households';
import type { UserHouseholdItem } from '@/types/v2User';

/**
 * The households v3 calculates, saved to the user as `/v2/user-households`
 * rows, as v3 saves its reforms and reports: on the v1 routes a row points
 * at the v1 household (`legacy_household_id`), and on the v2 routes at the
 * stored v2 household (`household_id`). Nothing in v3 reads these rows
 * yet: they keep each user's households for API v1's `/v2/` household
 * routes.
 */
export class ApiFlagshipHouseholdStore {
  private readonly routes: AccountAssociationRoutes<UserHouseholdItem>;

  constructor(context: ApiStoreContext) {
    this.routes = new AccountAssociationRoutes(context, 'user-households', 'Household');
  }

  /**
   * The user's row for a calculated household: the one already saved, or
   * a new one named with the household's summary.
   */
  async saveCalculated({
    householdId,
    name,
  }: {
    /** The v1 household ID the calculation created, or the stored v2 household's ID. */
    householdId: string;
    name: string;
  }): Promise<UserHouseholdItem> {
    const household = householdReference(householdId);
    const saved = await this.routes.findFirst(household);
    if (saved) {
      return saved;
    }
    const body: UserHouseholdCreateBody = {
      country_id: this.routes.countryId,
      ...household,
      name: clampStoreText(name) || null,
    };
    return this.routes.create(body);
  }
}

/** How a row names a calculated household: a stored v2 household by its UUID, a v1 one by its number. */
function householdReference(
  householdId: string
): { household_id: string } | { legacy_household_id: number } {
  if (isAccountId(householdId)) {
    return { household_id: householdId };
  }
  if (isLegacyId(householdId)) {
    return { legacy_household_id: Number(householdId) };
  }
  throw new Error(
    `Household ${householdId} is neither a v1 household nor a stored v2 household, so it cannot be saved`
  );
}
