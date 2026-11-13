import { useQuery } from '@tanstack/react-query';
import { fetchHouseholdById } from '@/api/household';
import type { components } from '@/api/publicApi/schema';
import { isLegacyId } from '@/api/v2Associations';
import { V1_HOUSEHOLD_GC_TIME, v1HouseholdKey } from '@/libs/queryKeys';
import { Household } from '@/models/Household';
import type { V1HouseholdMetadataEnvelope } from '@/models/household/v1Types';

/** One of a user's saved households, as the admin's saved-items read returns it. */
export type AdminSavedHousehold = components['schemas']['UserHouseholdItem'];

/** The household model of a v1 household read; one function, so the query keeps its result. */
const householdFromV1 = (read: V1HouseholdMetadataEnvelope) => Household.fromV1Metadata(read);

/**
 * The household a saved household record points to, read from the v1
 * household (`legacy_household_id`), which is what v3 saves. The read is
 * public and changes nothing.
 *
 * Households never change, so each is read once and kept. As the policy
 * reads, a failed read is not retried: the panel offers "Try again". With
 * `enabled` false nothing is read. A record that points only to a v2
 * household (`household_id`) fails without a read: the calculator does not
 * forward `GET /v2/households/{id}`.
 */
export function useAdminSavedHousehold(household: AdminSavedHousehold, enabled: boolean) {
  const countryId = household.country_id;
  const v1HouseholdId = isLegacyId(household.legacy_household_id)
    ? String(household.legacy_household_id)
    : null;
  return useQuery<V1HouseholdMetadataEnvelope, Error, Household>({
    // A record with no v1 household has its own key: its failure is its own.
    queryKey: v1HouseholdId
      ? v1HouseholdKey(countryId, v1HouseholdId)
      : ['saved-household-without-v1-household', household.id],
    queryFn: () => {
      if (v1HouseholdId) {
        return fetchHouseholdById(countryId, v1HouseholdId);
      }
      return Promise.reject(
        new Error(
          household.household_id
            ? 'This household is a v2 household, which this page cannot show yet.'
            : 'This saved household points to no household.'
        )
      );
    },
    select: householdFromV1,
    enabled,
    staleTime: Infinity,
    gcTime: V1_HOUSEHOLD_GC_TIME,
    retry: false,
  });
}
