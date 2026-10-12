import type { V2UserClient } from '@/api/v2UserClient';
import type {
  AssociationCountryId,
  ImportRequestBody,
  ImportResult,
  MeExportResult,
  MeItem,
  V2ItemResult,
} from '@/types/v2User';

/**
 * "Who am I": the PolicyEngine user behind the session. The first call
 * provisions the user, with `primary_country` set from `countryId`.
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

/** Bulk import of this browser's saved items; idempotent per `client_ref`. */
export function importToAccount(
  client: V2UserClient,
  countryId: AssociationCountryId,
  body: ImportRequestBody
): Promise<ImportResult> {
  return client.request<ImportResult>('POST', 'me/imports', {
    query: { country_id: countryId },
    body,
  });
}
