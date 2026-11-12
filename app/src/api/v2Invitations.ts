import type { components } from '@/api/publicApi/schema';
import { isV2ApiError, type V2UserClient } from '@/api/v2UserClient';
import type { V2ItemResult } from '@/types/v2User';

/**
 * The Public API's invitations to become an author or admin. Admins send,
 * list, resend and revoke them (`/v2/admin/invitations*`, 403 for anyone
 * else); the invitee, signed in, accepts one with the token from the
 * email's link (`/v2/me/invitations/accept`). Each takes the session's
 * bearer token and no country.
 */

/** A pending invitation as admins see it. */
export type UserInvitationItem = components['schemas']['UserInvitationItem'];
/** The types an invitation can give. */
export type InvitableUserType = UserInvitationItem['user_type'];
/** The signed-in user after an accepted invitation, and whether the type changed. */
export type InvitationAcceptResult = components['schemas']['UserInvitationAcceptResult'];

/** The `code` of the acceptance's 409 while the signed-in identity's email is not verified. */
export const EMAIL_NOT_VERIFIED_CODE = 'email_not_verified';

export interface NewInvitation {
  email: string;
  userType: InvitableUserType;
}

function invitationPath(invitationId: string): string {
  return `admin/invitations/${encodeURIComponent(invitationId)}`;
}

/** The pending invitations, newest first. */
export async function listInvitations(client: V2UserClient): Promise<UserInvitationItem[]> {
  const result = await client.request<components['schemas']['UserInvitationListResult']>(
    'GET',
    'admin/invitations'
  );
  return result.items;
}

/**
 * Invites `email` to become `userType` and emails the link. An address
 * with a pending invitation gets a new token in its place. The invitation
 * is created even when its email fails to send (`last_send_failed`).
 */
export async function createInvitation(
  client: V2UserClient,
  { email, userType }: NewInvitation
): Promise<UserInvitationItem> {
  const result = await client.request<V2ItemResult<UserInvitationItem>>(
    'POST',
    'admin/invitations',
    {
      body: {
        email,
        user_type: userType,
      } satisfies components['schemas']['UserInvitationCreateRequest'],
    }
  );
  return result.item;
}

/** Gives the invitation a new token and expiry and emails the new link; the old link stops working. */
export async function resendInvitation(
  client: V2UserClient,
  invitationId: string
): Promise<UserInvitationItem> {
  const result = await client.request<V2ItemResult<UserInvitationItem>>(
    'POST',
    `${invitationPath(invitationId)}/resend`
  );
  return result.item;
}

/** Revokes the invitation: its link stops working. */
export async function revokeInvitation(client: V2UserClient, invitationId: string): Promise<void> {
  await client.request<void>('DELETE', invitationPath(invitationId));
}

/**
 * Accepts the invitation `token` names for the signed-in user. The token
 * is a credential: it goes to this route and nowhere else.
 */
export function acceptInvitation(
  client: V2UserClient,
  token: string
): Promise<InvitationAcceptResult> {
  return client.request<InvitationAcceptResult>('POST', 'me/invitations/accept', {
    body: { token } satisfies components['schemas']['UserInvitationAcceptRequest'],
  });
}

/** Whether an acceptance was refused because the signed-in identity's email is not verified yet. */
export function isEmailNotVerified(error: unknown): boolean {
  return isV2ApiError(error, 409) && error.code === EMAIL_NOT_VERIFIED_CODE;
}
