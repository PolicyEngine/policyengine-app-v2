import type { Mock } from 'vitest';
import type { AdminUserItem, SignedInUserType, UserTypeChangeItem } from '@/api/v2AdminUsers';
import { publicApiPathOf, requestUrlOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  errorResponse,
  itemResponse,
  meItemOfType,
  noContentResponse,
  okResponse,
  PE_USER_ID,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';
import type { MeItem } from '@/types/v2User';

/** The signed-in admin using the page: `meItemOfType('admin')`. */
export const SIGNED_IN_ADMIN = meItemOfType('admin');

export const ADMIN_USER_IDS = {
  GRACE: '2b9a4f6e-8c1d-4e3a-9f7b-1a2b3c4d5e6f',
  ALAN: '3c8b5e7f-9d2e-4f4b-8a6c-2b3c4d5e6f70',
} as const;

export const CHANGE_IDS = {
  FIRST: '8e1f2a3b-4c5d-4e6f-8a9b-0c1d2e3f4a5b',
  SECOND: '9f2a3b4c-5d6e-4f7a-9b0c-1d2e3f4a5b6c',
  SCRIPT: '0a3b4c5d-6e7f-4a8b-8c1d-2e3f4a5b6c7d',
} as const;

/**
 * The Public API's 409 when the user's stored type is no longer the one the
 * admin read (the API may reword it; the app matches the status, not this).
 */
export function typeChangedMessage(
  currentType: SignedInUserType,
  expectedType: SignedInUserType
): string {
  return `This user's type is now ${currentType}, not ${expectedType}. Nothing was changed.`;
}

const SIGNED_IN_USER_TYPES: readonly string[] = ['standard', 'author', 'admin'];

/** Whether a PATCH body is exactly `{user_type, expected_user_type}`, each a signed-in type. */
function isUserTypePatchBody(
  body: unknown
): body is { user_type: SignedInUserType; expected_user_type: SignedInUserType } {
  if (typeof body !== 'object' || body === null) {
    return false;
  }
  const fields = Object.keys(body).sort();
  const { user_type: userType, expected_user_type: expectedUserType } = body as Record<
    string,
    unknown
  >;
  return (
    fields.join(',') === 'expected_user_type,user_type' &&
    SIGNED_IN_USER_TYPES.includes(String(userType)) &&
    SIGNED_IN_USER_TYPES.includes(String(expectedUserType))
  );
}

/** The Public API's messages for the admin routes' refusals. */
export const ADMIN_API_MESSAGES = {
  LAST_ADMIN_DEMOTION: "The last admin can't be demoted; make another user an admin first",
  NO_SIGNED_IN_USER: 'No signed-in user has this ID.',
  ADMINS_ONLY: 'Only admins may use these routes.',
  LAST_ADMIN_DELETION:
    "The last admin's account can't be deleted; make another user an admin first",
  ACCOUNT_DELETION_UNAVAILABLE: 'Account deletion is temporarily unavailable; nothing was deleted',
  OPERATION_FAILED: 'The operation could not be completed.',
} as const;

/**
 * The Public API's 502 for an admin's deletion whose data was deleted but
 * `undeletedCount` of the user's `totalCount` Auth0 users were not.
 */
export function auth0UsersLeftMessage(undeletedCount: number, totalCount: number): string {
  return (
    `The account's data was deleted, but ${undeletedCount} of the ${totalCount} Auth0 users ` +
    "of its sign-in identities from this Public API's Auth0 tenant could not be deleted; " +
    'find them in Auth0 by the email the admin user routes showed for this user before the ' +
    'deletion, and delete them there'
  );
}

/** A signed-in user as `/v2/admin/users` lists it. */
export function adminUserItem(overrides: Partial<AdminUserItem> = {}): AdminUserItem {
  return {
    id: ADMIN_USER_IDS.GRACE,
    user_type: 'standard',
    email: 'grace@example.org',
    first_name: 'Grace',
    last_name: 'Hopper',
    primary_country: 'us',
    created_at: TIMESTAMPS.CREATED,
    last_seen_at: TIMESTAMPS.UPDATED,
    ...overrides,
  };
}

export const GRACE = adminUserItem();
/** The signed-in admin (`SIGNED_IN_ADMIN`) as the admin routes list them. */
export const SIGNED_IN_ADMIN_USER = adminUserItem({
  id: SIGNED_IN_ADMIN.id,
  user_type: 'admin',
  email: SIGNED_IN_ADMIN.email,
  first_name: SIGNED_IN_ADMIN.first_name,
  last_name: SIGNED_IN_ADMIN.last_name,
});
export const ALAN = adminUserItem({
  id: ADMIN_USER_IDS.ALAN,
  email: 'alan@example.org',
  first_name: 'Alan',
  last_name: 'Turing',
  primary_country: 'uk',
  last_seen_at: null,
});

/** `count` standard users, newest first, with emails `user-1@example.org` onwards. */
export function numberedAdminUsers(count: number): AdminUserItem[] {
  return Array.from({ length: count }, (_, index) =>
    adminUserItem({
      id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
      email: `user-${index + 1}@example.org`,
      first_name: 'User',
      last_name: String(index + 1),
    })
  );
}

/** A recorded type change, by default the signed-in admin's of Grace from standard to author. */
export function userTypeChangeItem(
  overrides: Partial<UserTypeChangeItem> = {}
): UserTypeChangeItem {
  return {
    id: CHANGE_IDS.FIRST,
    user_id: ADMIN_USER_IDS.GRACE,
    previous_user_type: 'standard',
    new_user_type: 'author',
    changed_by_user_id: PE_USER_ID,
    changed_by_email: SIGNED_IN_ADMIN.email,
    source: 'admin_route',
    created_at: TIMESTAMPS.UPDATED,
    ...overrides,
  };
}

/** A change the type script made: it names no admin. */
export const SCRIPT_CHANGE = userTypeChangeItem({
  id: CHANGE_IDS.SCRIPT,
  previous_user_type: 'standard',
  new_user_type: 'admin',
  changed_by_user_id: null,
  changed_by_email: null,
  source: 'script',
});

export interface FakeAdminApiOptions {
  /** The signed-in user `/v2/me` returns; an admin by default. */
  signedInUser?: MeItem;
  users?: AdminUserItem[];
  changes?: UserTypeChangeItem[];
  /**
   * A last-admin refusal: when set, a PATCH that passes the body (422),
   * user (404), same-type and changed-type (409) checks answers with this
   * error and changes nothing.
   */
  patchRefusal?: { status: number; message: string };
  /** A refusal of every account deletion (such as 503): nothing is deleted. */
  deleteRefusal?: { status: number; message: string };
  /** A 502 with this message after a deletion, which deletes the user first, as the API does. */
  auth0DeletionFailure?: string;
}

/**
 * Makes `fetchMock` behave like the Public API's `/v2/me` and admin routes
 * over `users` and `changes`, and returns that state, so a test can read
 * what a PATCH stored. A PATCH is checked as the API checks it: the body
 * (422), then the user (404). The type the user already has is a 200 that
 * records nothing, whatever was expected. Otherwise a stored type other
 * than `expected_user_type` is a 409, and `patchRefusal` (a last-admin
 * refusal) applies; a change is recorded newest first, as the signed-in
 * admin's. A DELETE of a user who exists answers `deleteRefusal` if set;
 * otherwise it deletes the user and their changes, and answers 204, or
 * `auth0DeletionFailure`'s 502.
 */
export function answerAdminApi(
  fetchMock: Mock,
  {
    signedInUser = SIGNED_IN_ADMIN,
    users = [GRACE, ALAN],
    changes = [],
    patchRefusal,
    deleteRefusal,
    auth0DeletionFailure,
  }: FakeAdminApiOptions = {}
) {
  const state = {
    users: users.map((user) => ({ ...user })),
    changes: [...changes],
  };

  function userResponse(userId: string): Response {
    const user = state.users.find((candidate) => candidate.id === userId);
    return user ? itemResponse(user) : errorResponse(404, ADMIN_API_MESSAGES.NO_SIGNED_IN_USER);
  }

  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const requestUrl = requestUrlOf(url);
    const path = publicApiPathOf(url);
    const method = init.method ?? 'GET';
    if (path === '/v2/me' && method === 'GET') {
      return itemResponse(signedInUser);
    }
    if (path === '/v2/admin/users' && method === 'GET') {
      const emailPart = requestUrl.searchParams.get('email')?.toLowerCase() ?? '';
      const offset = Number(requestUrl.searchParams.get('offset') ?? 0);
      const limit = Number(requestUrl.searchParams.get('limit') ?? 100);
      const matches = state.users.filter((user) =>
        (user.email ?? '').toLowerCase().includes(emailPart)
      );
      return okResponse({
        items: matches.slice(offset, offset + limit),
        offset,
        limit,
        has_more: offset + limit < matches.length,
      });
    }
    const userRoute = /^\/v2\/admin\/users\/([^/]+)(\/user-type-changes)?$/.exec(path);
    if (userRoute && userRoute[2] && method === 'GET') {
      return okResponse({
        items: state.changes.filter((change) => change.user_id === userRoute[1]),
      });
    }
    if (userRoute && method === 'GET') {
      return userResponse(userRoute[1]);
    }
    if (userRoute && method === 'PATCH') {
      const body: unknown = JSON.parse(String(init.body));
      if (!isUserTypePatchBody(body)) {
        return errorResponse(422, 'The request does not match the schema.');
      }
      const user = state.users.find((candidate) => candidate.id === userRoute[1]);
      if (!user) {
        return userResponse(userRoute[1]);
      }
      const { user_type: newUserType, expected_user_type: expectedUserType } = body;
      if (newUserType === user.user_type) {
        return itemResponse(user);
      }
      if (expectedUserType !== user.user_type) {
        return errorResponse(409, typeChangedMessage(user.user_type, expectedUserType));
      }
      if (patchRefusal) {
        return errorResponse(patchRefusal.status, patchRefusal.message);
      }
      state.changes.unshift(
        userTypeChangeItem({
          id: CHANGE_IDS.SECOND,
          user_id: user.id,
          previous_user_type: user.user_type,
          new_user_type: newUserType,
        })
      );
      user.user_type = newUserType;
      return itemResponse(user);
    }
    if (userRoute && !userRoute[2] && method === 'DELETE') {
      const userIndex = state.users.findIndex((candidate) => candidate.id === userRoute[1]);
      if (userIndex === -1) {
        return userResponse(userRoute[1]);
      }
      if (deleteRefusal) {
        return errorResponse(deleteRefusal.status, deleteRefusal.message);
      }
      state.users.splice(userIndex, 1);
      state.changes = state.changes.filter((change) => change.user_id !== userRoute[1]);
      return auth0DeletionFailure ? errorResponse(502, auth0DeletionFailure) : noContentResponse();
    }
    return errorResponse(404, 'Not found');
  });

  return state;
}

/** Each request `fetchMock` received, as method and path with its query. */
export function sentRequests(fetchMock: Mock): string[] {
  return fetchMock.mock.calls.map((call) => {
    const [url, init] = call as [string, RequestInit];
    return `${init.method ?? 'GET'} ${publicApiPathOf(url)}${requestUrlOf(url).search}`;
  });
}

/**
 * Holds every later request that `shouldHold` picks (by method and path)
 * until the test calls `answerHeldRequests`, which answers them as
 * `fetchMock` did before. Other requests answer at once.
 */
export function holdRequests(
  fetchMock: Mock,
  shouldHold: (method: string, path: string) => boolean
) {
  const answerAsBefore = fetchMock.getMockImplementation()!;
  const heldRequests: Array<() => void> = [];
  fetchMock.mockImplementation((url: string, init: RequestInit) => {
    if (!shouldHold(init.method ?? 'GET', publicApiPathOf(url))) {
      return answerAsBefore(url, init);
    }
    return new Promise<Response>((resolve) => {
      heldRequests.push(() => resolve(answerAsBefore(url, init)));
    });
  });
  return {
    answerHeldRequests: () => heldRequests.splice(0).forEach((answerRequest) => answerRequest()),
    heldRequestCount: () => heldRequests.length,
  };
}

/** Holds every later `GET /v2/admin/users/{user_id}` until `answerHeldUserReads`. */
export function holdUserReads(fetchMock: Mock) {
  const { answerHeldRequests } = holdRequests(
    fetchMock,
    (method, path) => method === 'GET' && /^\/v2\/admin\/users\/[^/]+$/.test(path)
  );
  return { answerHeldUserReads: answerHeldRequests };
}

/** Makes every admin route answer 403 and `/v2/me` return a standard user, as after a demotion. */
export function answerAsDemotedAdmin(fetchMock: Mock) {
  fetchMock.mockImplementation(async (url: string) =>
    publicApiPathOf(url) === '/v2/me'
      ? itemResponse(meItemOfType('standard'))
      : errorResponse(403, ADMIN_API_MESSAGES.ADMINS_ONLY)
  );
}

/**
 * Lets every later `GET /v2/admin/users/{userId}` be answered at once, as
 * the API answers it then, but holds the answer back until the test calls
 * `deliverHeldAnswers`: a read answered before a change and delivered
 * after it.
 */
export function holdAnswersOfUserReads(fetchMock: Mock, userId: string) {
  const answerAsBefore = fetchMock.getMockImplementation()!;
  const heldDeliveries: Array<() => void> = [];
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const isReadOfTheUser =
      (init.method ?? 'GET') === 'GET' && publicApiPathOf(url) === `/v2/admin/users/${userId}`;
    if (!isReadOfTheUser) {
      return answerAsBefore(url, init);
    }
    const answer = await answerAsBefore(url, init);
    return new Promise<Response>((resolve) => {
      heldDeliveries.push(() => resolve(answer));
    });
  });
  return { deliverHeldAnswers: () => heldDeliveries.splice(0).forEach((deliver) => deliver()) };
}
