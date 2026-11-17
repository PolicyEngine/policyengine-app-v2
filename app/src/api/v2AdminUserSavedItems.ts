import type { components } from '@/api/publicApi/schema';
import { adminUserPath } from '@/api/v2AdminUsers';
import type { V2UserClient } from '@/api/v2UserClient';

/**
 * A signed-in user's saved items as an admin reads them: what the user's
 * own `GET /v2/me/export` returns, the user and every policy, household,
 * simulation and report it saved, in every country.
 */
export type UserSavedItems = components['schemas']['AdminUserSavedItemsResponse']['result'];

/**
 * Reads a signed-in user's saved items (`GET /v2/admin/users/{user_id}/saved-items`).
 * Only admins may call it (others get 403); an unauthenticated user's ID is
 * a 404. The Public API records each read with the admin's and the user's
 * IDs. The route is read-only: nothing sent to it changes a saved item.
 */
export function fetchAdminUserSavedItems(
  client: V2UserClient,
  userId: string
): Promise<UserSavedItems> {
  return client.request<UserSavedItems>('GET', `${adminUserPath(userId)}/saved-items`);
}
