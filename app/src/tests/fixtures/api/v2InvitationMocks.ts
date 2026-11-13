import type { Mock } from 'vitest';
import type {
  InvitableUserType,
  InvitationAcceptance,
  InvitationRefusalCode,
  UserInvitationItem,
} from '@/api/v2Invitations';
import { publicApiPathOf, requestUrlOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import { answerAdminApi } from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  errorResponse,
  itemResponse,
  noContentResponse,
  okResponse,
  PE_USER_ID,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';
import type { LatestUserTypeChange, MeItem } from '@/types/v2User';

export const INVITATION_IDS = {
  GRACE: 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
  ALAN: 'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
  NEW: 'c3d4e5f6-a7b8-4c9d-8e1f-2a3b4c5d6e7f',
} as const;

/** An invitation token as the email's link carries it (URL-safe base64 of 32 bytes). */
export const INVITATION_TOKEN = 'k9X2c7VbqLwT4nE1sR8uYm3hJ6pA0dZfGtQiWoKxCyB';
export const OTHER_INVITATION_TOKEN = 'Zq1W2e3R4t5Y6u7I8o9P0aSdFgHjKlZxCvBnM-_qwer';

export const INVITATION_TIMESTAMPS = {
  SENT: '2026-11-12T10:00:00+00:00',
  EXPIRES: '2026-11-19T10:00:00+00:00',
} as const;

/** The Public API's messages for the invitation routes' refusals (the app shows its own words). */
export const INVITATION_API_MESSAGES = {
  NO_OPEN_INVITATION: 'No open invitation has this ID.',
  EMAIL_NOT_VERIFIED: "The signed-in account's email address is not verified yet.",
  EMAIL_MISMATCH: 'This invitation was sent to another email address.',
  INVITATION_GONE: 'This invitation can no longer be accepted.',
  INVITER_NOT_ADMIN: 'The admin who sent this invitation is no longer an admin.',
  AUTH0_UNAVAILABLE: 'Auth0 could not be reached; try again.',
} as const;

/** An open invitation, by default the signed-in admin's of grace@example.org to become an author. */
export function invitationItem(overrides: Partial<UserInvitationItem> = {}): UserInvitationItem {
  return {
    id: INVITATION_IDS.GRACE,
    email: 'grace@example.org',
    user_type: 'author',
    invited_by_user_id: PE_USER_ID,
    created_at: INVITATION_TIMESTAMPS.SENT,
    expires_at: INVITATION_TIMESTAMPS.EXPIRES,
    expired: false,
    last_sent_at: INVITATION_TIMESTAMPS.SENT,
    last_send_error: null,
    ...overrides,
  };
}

export const GRACE_INVITATION = invitationItem();
/** An invitation whose last email Postmark refused (406: an address it suppresses). */
export const ALAN_INVITATION = invitationItem({
  id: INVITATION_IDS.ALAN,
  email: 'alan@example.org',
  user_type: 'admin',
  last_sent_at: null,
  last_send_error: 'postmark_406',
});

/** A refused acceptance, with the code the Public API gives it. */
export function acceptRefusalResponse(
  status: number,
  code: InvitationRefusalCode,
  message: string = INVITATION_API_MESSAGES.INVITATION_GONE
): Response {
  return new Response(JSON.stringify({ status: 'error', message, code }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** The 409 the acceptance answers while the signed-in identity's email is not verified. */
export function emailNotVerifiedResponse(): Response {
  return acceptRefusalResponse(
    409,
    'email_not_verified',
    INVITATION_API_MESSAGES.EMAIL_NOT_VERIFIED
  );
}

/** An accepted invitation, by default one that made a standard user an author. */
export function acceptanceResponse(overrides: Partial<InvitationAcceptance> = {}): Response {
  return itemResponse({
    user_type: 'author',
    previous_user_type: 'standard',
    type_changed: true,
    ...overrides,
  } satisfies InvitationAcceptance);
}

/** A type change as `/v2/me` names it until the user dismisses it. */
export function latestTypeChange(
  overrides: Partial<LatestUserTypeChange> = {}
): LatestUserTypeChange {
  return {
    id: '5e6f7a8b-9c0d-4e1f-8a2b-3c4d5e6f7a8b',
    previous_user_type: 'standard',
    user_type: 'author',
    changed_at: TIMESTAMPS.UPDATED,
    ...overrides,
  };
}

/**
 * `GET /v2/me`'s answer: the user in `item`, and its latest type change
 * beside it, as the Public API sends them.
 */
export function meResponse(
  user: MeItem,
  latestChange: LatestUserTypeChange | null = null
): Response {
  return okResponse({ item: user, latest_type_change: latestChange });
}

/** Whether a POST body is exactly `{email, user_type}`, with an invitable type. */
function isInvitationBody(body: unknown): body is { email: string; user_type: InvitableUserType } {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const { email, user_type: userType } = body as Record<string, unknown>;
  return (
    Object.keys(body).sort().join(',') === 'email,user_type' &&
    typeof email === 'string' &&
    (userType === 'author' || userType === 'admin')
  );
}

export interface FakeInvitationApiOptions {
  invitations?: UserInvitationItem[];
  /** The `last_send_error` of every new or resent invitation; null when its email is sent. */
  sendError?: string | null;
}

/**
 * Makes `fetchMock` behave like the Public API's admin invitation routes
 * over `invitations`, and like `answerAdminApi` for `/v2/me` and the admin
 * user routes. Returns the invitations' state, so a test can read or
 * change what the API holds. A new invitation to an address with an open
 * one revokes it, as the API does; the list is paged by offset and limit.
 */
export function answerInvitationApi(
  fetchMock: Mock,
  {
    invitations = [GRACE_INVITATION, ALAN_INVITATION],
    sendError = null,
  }: FakeInvitationApiOptions = {}
) {
  answerAdminApi(fetchMock);
  const answerAsAdminApi = fetchMock.getMockImplementation()!;
  const state = { invitations: invitations.map((invitation) => ({ ...invitation })) };
  const sendOutcome = {
    last_sent_at: sendError ? null : INVITATION_TIMESTAMPS.SENT,
    last_send_error: sendError,
  };

  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const path = publicApiPathOf(url);
    const method = init.method ?? 'GET';
    if (path === '/v2/admin/invitations' && method === 'GET') {
      const query = requestUrlOf(url).searchParams;
      const offset = Number(query.get('offset') ?? 0);
      const limit = Number(query.get('limit') ?? 100);
      return okResponse({
        items: state.invitations.slice(offset, offset + limit),
        offset,
        limit,
        has_more: offset + limit < state.invitations.length,
      });
    }
    if (path === '/v2/admin/invitations' && method === 'POST') {
      const body: unknown = JSON.parse(String(init.body));
      if (!isInvitationBody(body)) {
        return errorResponse(422, 'The request does not match the schema.');
      }
      const created = invitationItem({
        id: INVITATION_IDS.NEW,
        email: body.email,
        user_type: body.user_type,
        ...sendOutcome,
      });
      state.invitations = [
        created,
        ...state.invitations.filter(
          (invitation) => invitation.email.toLowerCase() !== body.email.toLowerCase()
        ),
      ];
      return itemResponse(created, 201);
    }
    const invitationRoute = /^\/v2\/admin\/invitations\/([^/]+)(\/resend)?$/.exec(path);
    if (invitationRoute) {
      const invitation = state.invitations.find((candidate) => candidate.id === invitationRoute[1]);
      if (!invitation) {
        return errorResponse(404, INVITATION_API_MESSAGES.NO_OPEN_INVITATION);
      }
      if (invitationRoute[2] && method === 'POST') {
        Object.assign(invitation, sendOutcome, { expired: false });
        return itemResponse(invitation);
      }
      if (!invitationRoute[2] && method === 'DELETE') {
        state.invitations = state.invitations.filter((candidate) => candidate !== invitation);
        return noContentResponse();
      }
    }
    return answerAsAdminApi(url, init);
  });

  return state;
}

/**
 * Makes `fetchMock` answer `GET /v2/me` with the state's user and latest
 * type change, the acceptance with `acceptResponse` (by default one that
 * made the user an author, which the state then holds), and the dismissal
 * with 204. Returns the state and the acceptance requests' bodies.
 */
export function answerAcceptanceApi(
  fetchMock: Mock,
  {
    signedInUser,
    acceptResponse,
  }: {
    signedInUser: MeItem;
    acceptResponse?: () => Response | Promise<Response>;
  }
) {
  const acceptBodies: unknown[] = [];
  const state = { me: { ...signedInUser }, latestChange: null as LatestUserTypeChange | null };
  const answerAcceptance = acceptResponse ?? (() => acceptanceResponse());
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const path = publicApiPathOf(url);
    const method = init.method ?? 'GET';
    if (path === '/v2/me' && method === 'GET') {
      return meResponse(state.me, state.latestChange);
    }
    if (path === '/v2/me/invitations/accept' && method === 'POST') {
      acceptBodies.push(JSON.parse(String(init.body)));
      const response = await answerAcceptance();
      if (response.ok) {
        const { item } = (await response.clone().json()).result as { item: InvitationAcceptance };
        if (item.type_changed) {
          state.me = { ...state.me, user_type: item.user_type };
          state.latestChange = latestTypeChange({
            previous_user_type: item.previous_user_type,
            user_type: item.user_type,
          });
        }
      }
      return response;
    }
    if (/^\/v2\/me\/type-changes\/[^/]+\/dismiss$/.test(path) && method === 'POST') {
      state.latestChange = null;
      return noContentResponse();
    }
    return errorResponse(404, 'Not found');
  });
  return { acceptBodies, state };
}
