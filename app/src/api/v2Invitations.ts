import type { paths } from '@/api/publicApi/schema';
import { isV2ApiError, type V2UserClient } from '@/api/v2UserClient';
import type { AssociationCountryId, V2ItemResult } from '@/types/v2User';

/**
 * The Public API's invitations to become an author or admin. Admins send,
 * list, resend and revoke them (`/v2/admin/invitations*`, 403 for anyone
 * else); the invitee, signed in, accepts one with the token from the
 * email's link (`/v2/me/invitations/accept`). Each takes the session's
 * bearer token.
 *
 * The types come from the operations' paths rather than from schema names,
 * so they follow the Public API's document whatever it calls its schemas.
 */

type AdminInvitationsPath = paths['/v2/admin/invitations'];
type AcceptPath = paths['/v2/me/invitations/accept']['post'];

/** An open invitation (not accepted or revoked) as admins see it. */
export type UserInvitationItem =
  AdminInvitationsPath['get']['responses'][200]['content']['application/json']['result']['items'][number];
/** The types an invitation can give. */
export type InvitableUserType = UserInvitationItem['user_type'];
/** The signed-in user's type after accepting, and whether the acceptance changed it. */
export type InvitationAcceptance =
  AcceptPath['responses'][200]['content']['application/json']['result']['item'];
/** The `code` of a refused acceptance, as the Public API's document types it: any short string. */
type DocumentedRefusalCode = AcceptPath['responses'][410]['content']['application/json']['code'];

/**
 * The codes the Public API's route contract gives a refused acceptance.
 * Its document types `code` as any string, so the app names them here.
 */
const INVITATION_REFUSAL_CODES = [
  'auth0_unavailable',
  'invitation_not_found',
  'invitation_revoked',
  'invitation_expired',
  'invitation_accepted',
  'inviter_not_admin',
  'email_not_verified',
  'email_mismatch',
] as const satisfies readonly DocumentedRefusalCode[];

/** Why an acceptance was refused. */
export type InvitationRefusalCode = (typeof INVITATION_REFUSAL_CODES)[number];

function isInvitationRefusalCode(code: string): code is InvitationRefusalCode {
  return (INVITATION_REFUSAL_CODES as readonly string[]).includes(code);
}

export interface NewInvitation {
  email: string;
  userType: InvitableUserType;
}

function invitationPath(invitationId: string): string {
  return `admin/invitations/${encodeURIComponent(invitationId)}`;
}

/** Every open invitation, newest first, expired ones included, read a page at a time. */
export function listInvitations(client: V2UserClient): Promise<UserInvitationItem[]> {
  return client.listAll<UserInvitationItem>('admin/invitations');
}

/**
 * Invites `email` to become `userType` and emails the link. Any open
 * invitation to the same address is revoked first. The invitation is
 * created even when its email fails to send (`last_send_error`).
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
      } satisfies AdminInvitationsPath['post']['requestBody']['content']['application/json'],
    }
  );
  return result.item;
}

/**
 * Gives the invitation a new link and a new expiry, and emails it again;
 * the old link stops working. Expired invitations can be resent.
 */
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
 * Accepts the invitation `token` names for the signed-in user. A user who
 * has no account yet gets one, with `countryId` as its primary country.
 * The token is a credential: it goes to this route and nowhere else.
 */
export async function acceptInvitation(
  client: V2UserClient,
  countryId: AssociationCountryId,
  token: string
): Promise<InvitationAcceptance> {
  const result = await client.request<V2ItemResult<InvitationAcceptance>>(
    'POST',
    'me/invitations/accept',
    {
      query: { country_id: countryId },
      body: { token } satisfies AcceptPath['requestBody']['content']['application/json'],
    }
  );
  return result.item;
}

/** The code of a refused acceptance, or null for any other error. */
export function invitationRefusalCode(error: unknown): InvitationRefusalCode | null {
  return isV2ApiError(error) && error.code !== null && isInvitationRefusalCode(error.code)
    ? error.code
    : null;
}

/** Whether an acceptance was refused because the signed-in identity's email is not verified yet. */
export function isEmailNotVerified(error: unknown): boolean {
  return invitationRefusalCode(error) === 'email_not_verified';
}
