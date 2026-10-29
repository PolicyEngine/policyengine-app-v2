import { createV2UserClient, type V2UserClient } from '@/api/v2UserClient';
import type { Household } from '@/models/Household';
import { householdToV2CreateBody } from '@/models/household/v2DocumentCodec';
import type { V2HouseholdItem } from '@/types/v2Households';
import type { V2ItemResult } from '@/types/v2User';

/**
 * Stored households on the Public API's `/v2/households`: content stored
 * once, never changed, and returned again for identical content. The
 * saved-household store sends these as the account; a household
 * calculation and a saved household report need no credential.
 */

/** A client for routes anyone may call: stored households need no account. */
function anyoneClient(): V2UserClient {
  return createV2UserClient({ credentials: { kind: 'none' } });
}

/** Stores a household's content (`POST /v2/households`), or finds the identical stored one. */
export async function storeV2Household(
  household: Household,
  client: V2UserClient = anyoneClient()
): Promise<V2HouseholdItem> {
  const body = householdToV2CreateBody(household);
  const result = await client.request<V2ItemResult<V2HouseholdItem>>('POST', 'households', {
    query: { country_id: body.country_id },
    body,
  });
  return result.item;
}

/** A stored household by its ID. Stored households never change, so callers may cache them. */
export async function fetchV2Household(
  countryId: string,
  householdId: string,
  client: V2UserClient = anyoneClient()
): Promise<V2HouseholdItem> {
  const result = await client.request<V2ItemResult<V2HouseholdItem>>(
    'GET',
    `households/${encodeURIComponent(householdId)}`,
    { query: { country_id: countryId } }
  );
  return result.item;
}
