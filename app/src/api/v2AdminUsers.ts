import type { components } from '@/api/publicApi/schema';
import type { V2UserClient } from '@/api/v2UserClient';
import type { V2ItemResult } from '@/types/v2User';

/**
 * The Public API's admin routes for users' types (`/v2/admin/users*`).
 * Only admins may call them (others get 403); they take the session's
 * bearer token and no country.
 */

/** A signed-in user as admins see it. */
export type AdminUserItem = components['schemas']['AdminUserItem'];
export type AdminUserPageResult = components['schemas']['AdminUserPageResult'];
/** One recorded change of a signed-in user's type. */
export type UserTypeChangeItem = components['schemas']['UserTypeChangeItem'];
/** The types an admin can give a user: every signed-in type. */
export type SignedInUserType = components['schemas']['UserTypePatchRequest']['user_type'];

export interface AdminUserSearch {
  /** Part of an email address, matched ignoring case; empty lists every user. */
  email: string;
  offset: number;
  limit: number;
}

function adminUserPath(userId: string): string {
  return `admin/users/${encodeURIComponent(userId)}`;
}

/** One page of signed-in users, newest first. */
export function searchAdminUsers(
  client: V2UserClient,
  { email, offset, limit }: AdminUserSearch
): Promise<AdminUserPageResult> {
  return client.request<AdminUserPageResult>('GET', 'admin/users', {
    query: { email: email || undefined, offset, limit },
  });
}

export async function fetchAdminUser(client: V2UserClient, userId: string): Promise<AdminUserItem> {
  const result = await client.request<V2ItemResult<AdminUserItem>>('GET', adminUserPath(userId));
  return result.item;
}

/** Gives the user `userType`; the same type changes and records nothing. */
export async function changeAdminUserType(
  client: V2UserClient,
  userId: string,
  userType: SignedInUserType
): Promise<AdminUserItem> {
  const result = await client.request<V2ItemResult<AdminUserItem>>('PATCH', adminUserPath(userId), {
    body: { user_type: userType } satisfies components['schemas']['UserTypePatchRequest'],
  });
  return result.item;
}

/** The user's recorded type changes, newest first. */
export async function fetchUserTypeChanges(
  client: V2UserClient,
  userId: string
): Promise<UserTypeChangeItem[]> {
  const result = await client.request<components['schemas']['UserTypeChangeListResult']>(
    'GET',
    `${adminUserPath(userId)}/user-type-changes`
  );
  return result.items;
}
