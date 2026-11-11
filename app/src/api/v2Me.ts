import { UNAUTHENTICATED_USER_HEADER, type V2UserClient } from '@/api/v2UserClient';
import type {
  AssociationCountryId,
  MeExportResult,
  MeItem,
  MeUpgradeResult,
  V2ItemResult,
} from '@/types/v2User';

/**
 * "Who am I": the PolicyEngine user behind the session. Signed in, the
 * first call provisions the account, with `primary_country` set from
 * `countryId`.
 */
export async function fetchMe(
  client: V2UserClient,
  countryId: AssociationCountryId
): Promise<MeItem> {
  const result = await client.request<V2ItemResult<MeItem>>('GET', 'me', {
    query: { country_id: countryId },
  });
  return result.item;
}

/** Everything saved to the account, across all countries. */
export function exportMe(
  client: V2UserClient,
  countryId: AssociationCountryId
): Promise<MeExportResult> {
  return client.request<MeExportResult>('GET', 'me/export', { query: { country_id: countryId } });
}

/** Deletes the user, their identities, and every association (and the Auth0 user). */
export async function deleteMe(
  client: V2UserClient,
  countryId: AssociationCountryId
): Promise<void> {
  await client.request<void>('DELETE', 'me', { query: { country_id: countryId } });
}

/**
 * Upgrades this browser's unauthenticated user at sign-in: on a first
 * sign-in it becomes the account (same user, so every saved reform and
 * report stays); for an existing account its work moves into that
 * account. Sent with the session's token and the browser's user.
 */
export async function upgradeAccount(
  client: V2UserClient,
  countryId: AssociationCountryId,
  browserUserId: string
): Promise<MeUpgradeResult> {
  return client.request<MeUpgradeResult>('POST', 'me/upgrade', {
    query: { country_id: countryId },
    headers: { [UNAUTHENTICATED_USER_HEADER]: browserUserId },
  });
}
