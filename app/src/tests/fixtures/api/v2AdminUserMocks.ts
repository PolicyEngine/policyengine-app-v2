import type { Mock } from 'vitest';
import type { AdminUserItem, UserTypeChangeItem } from '@/api/v2AdminUsers';
import {
  errorResponse,
  itemResponse,
  meItemOfType,
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

/** The Public API's messages for the admin routes' refusals. */
export const ADMIN_API_MESSAGES = {
  LAST_ADMIN_DEMOTION: "The last admin can't be demoted; make another user an admin first",
  NO_SIGNED_IN_USER: 'No signed-in user has this ID.',
} as const;

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
  /** When set, `PATCH /v2/admin/users/{id}` answers with this error and changes nothing. */
  patchRefusal?: { status: number; message: string };
}

/**
 * Makes `fetchMock` behave like the Public API's `/v2/me` and admin routes
 * over `users` and `changes`. A PATCH changes the user's type and records
 * the change, newest first, as the signed-in admin's; another type than
 * the user's own is needed for a change to be recorded. It returns the
 * fake's state, so a test can read what the PATCH stored.
 */
export function answerAdminApi(
  fetchMock: Mock,
  {
    signedInUser = SIGNED_IN_ADMIN,
    users = [GRACE, ALAN],
    changes = [],
    patchRefusal,
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
    const requestUrl = new URL(url);
    const path = requestUrl.pathname;
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
      if (patchRefusal) {
        return errorResponse(patchRefusal.status, patchRefusal.message);
      }
      const user = state.users.find((candidate) => candidate.id === userRoute[1]);
      if (!user) {
        return userResponse(userRoute[1]);
      }
      const { user_type: newUserType } = JSON.parse(String(init.body));
      if (newUserType !== user.user_type) {
        state.changes.unshift(
          userTypeChangeItem({
            id: CHANGE_IDS.SECOND,
            user_id: user.id,
            previous_user_type: user.user_type,
            new_user_type: newUserType,
          })
        );
        user.user_type = newUserType;
      }
      return itemResponse(user);
    }
    return errorResponse(404, 'Not found');
  });

  return state;
}

/** Each request `fetchMock` received, as method and path with its query. */
export function sentRequests(fetchMock: Mock): string[] {
  return fetchMock.mock.calls.map((call) => {
    const [url, init] = call as [string, RequestInit];
    const requestUrl = new URL(url);
    return `${init.method ?? 'GET'} ${requestUrl.pathname}${requestUrl.search}`;
  });
}

/**
 * Holds every later `GET /v2/admin/users/{user_id}` until the test calls
 * `answerHeldUserReads`, which answers them as `fetchMock` did before.
 * Other requests answer at once.
 */
export function holdUserReads(fetchMock: Mock) {
  const answerAsBefore = fetchMock.getMockImplementation()!;
  const heldReads: Array<() => void> = [];
  fetchMock.mockImplementation((url: string, init: RequestInit) => {
    const isUserRead =
      /^\/v2\/admin\/users\/[^/]+$/.test(new URL(url).pathname) && (init.method ?? 'GET') === 'GET';
    if (!isUserRead) {
      return answerAsBefore(url, init);
    }
    return new Promise<Response>((resolve) => {
      heldReads.push(() => resolve(answerAsBefore(url, init)));
    });
  });
  return {
    answerHeldUserReads: () => heldReads.splice(0).forEach((answerRead) => answerRead()),
  };
}
