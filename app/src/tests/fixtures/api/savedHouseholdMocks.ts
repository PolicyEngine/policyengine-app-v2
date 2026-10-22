import type { vi } from 'vitest';
import { Household } from '@/models/Household';
import { householdFromV2Item, householdToV2CreateBody } from '@/models/household/v2DocumentCodec';
import { PE_USER_ID, TIMESTAMPS } from '@/tests/fixtures/api/v2UserMocks';
import type {
  UserHouseholdItem,
  V2HouseholdCreateBody,
  V2HouseholdItem,
} from '@/types/v2Households';

export const SAVED_HOUSEHOLD_YEAR = '2026';

/** The user's saved-household rows. */
export const SAVED_HOUSEHOLD_IDS = {
  FAMILY: '22222222-2222-4222-8222-222222222222',
  RETIRED: '66666666-6666-4666-8666-666666666666',
  V1_ONLY: '77777777-7777-4777-8777-777777777777',
  UK_HOME: '88888888-8888-4888-8888-888888888888',
} as const;

/** Stored v2 households. */
export const V2_HOUSEHOLD_IDS = {
  FAMILY: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
  EDITED_FAMILY: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
  RETIRED: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
  TWO_YEAR_FAMILY: 'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
  UK_HOME: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee',
} as const;

export const FAMILY_LABEL = 'Our family';
export const RETIRED_LABEL = 'Retired couple';
/** A row saved before households moved to v2: it names only a v1 household. */
export const V1_ONLY_LABEL = 'Saved long ago';

/** A couple with two children, as the household builder makes it. */
export const FAMILY_HOUSEHOLD = Household.starter('us', SAVED_HOUSEHOLD_YEAR)
  .withBuilderMaritalStatus(SAVED_HOUSEHOLD_YEAR, 'married')
  .withBuilderChildCount(SAVED_HOUSEHOLD_YEAR, 2)
  .withSPM({ geography_kind: 'national' });

/** The same family, after the reader raises "you"'s earnings. */
export const EDITED_FAMILY_HOUSEHOLD = FAMILY_HOUSEHOLD.setPersonVariableAtYear(
  'you',
  'employment_income',
  SAVED_HOUSEHOLD_YEAR,
  65000
);

/** The family with next year's earnings also set: its inputs are in two years. */
export const TWO_YEAR_FAMILY_HOUSEHOLD = FAMILY_HOUSEHOLD.setPersonVariableAtYear(
  'you',
  'employment_income',
  String(Number(SAVED_HOUSEHOLD_YEAR) + 1),
  50000
);

export const RETIRED_HOUSEHOLD = Household.starter('us', SAVED_HOUSEHOLD_YEAR)
  .withBuilderMaritalStatus(SAVED_HOUSEHOLD_YEAR, 'married')
  .setPersonVariableAtYear('you', 'age', SAVED_HOUSEHOLD_YEAR, 70)
  .withSPM({ geography_kind: 'national' });

/** A household as `/v2/households` returns it. */
export function v2HouseholdItem(household: Household, id: string): V2HouseholdItem {
  return storedV2HouseholdItem(householdToV2CreateBody(household), id);
}

/** The household `POST /v2/households` was sent, as it returns it stored under `id`. */
export function storedV2HouseholdItem(body: V2HouseholdCreateBody, id: string): V2HouseholdItem {
  return {
    id,
    country_id: body.country_id,
    default_year: body.default_year,
    household_data: body.household_data,
    created_at: TIMESTAMPS.CREATED,
    updated_at: TIMESTAMPS.CREATED,
  };
}

/** A saved household as `/v2/user-households` returns it. */
export function userHouseholdItem(overrides: Partial<UserHouseholdItem> = {}): UserHouseholdItem {
  return {
    id: SAVED_HOUSEHOLD_IDS.FAMILY,
    country_id: 'us',
    user_id: PE_USER_ID,
    household_id: V2_HOUSEHOLD_IDS.FAMILY,
    legacy_household_id: null,
    name: FAMILY_LABEL,
    description: null,
    created_at: TIMESTAMPS.CREATED,
    updated_at: TIMESTAMPS.UPDATED,
    ...overrides,
  };
}

/** One request the store sent, as a handler sees it. */
export interface RoutedRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body: any;
}

type RouteHandler = (request: RoutedRequest) => Response | Promise<Response>;

/**
 * Answers the store's requests by method and path, as the Public API
 * would, and keeps each request in order. A request no route expects
 * fails the test.
 */
export function routeRequests(
  fetchMock: ReturnType<typeof vi.fn>,
  routes: Record<string, RouteHandler>
): RoutedRequest[] {
  const requests: RoutedRequest[] = [];
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const parsed = new URL(url);
    const request: RoutedRequest = {
      method: init.method ?? 'GET',
      path: parsed.pathname,
      query: Object.fromEntries(parsed.searchParams.entries()),
      body: init.body ? JSON.parse(String(init.body)) : undefined,
    };
    requests.push(request);
    const handler = routes[`${request.method} ${request.path}`];
    if (!handler) {
      throw new Error(`Unexpected request ${request.method} ${request.path}`);
    }
    return handler(request);
  });
  return requests;
}

/**
 * The family as `/v2/households` returns it and the store reads it back:
 * the same content, with its groups in the document's name order ("your
 * first dependent's marital unit" before "your marital unit").
 */
export const FAMILY_HOUSEHOLD_AS_STORED = householdFromV2Item(
  v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY)
);

/** The saved family as the store opens it. */
export const SAVED_FAMILY = {
  id: SAVED_HOUSEHOLD_IDS.FAMILY,
  countryId: 'us' as const,
  label: FAMILY_LABEL,
  householdId: V2_HOUSEHOLD_IDS.FAMILY,
  household: FAMILY_HOUSEHOLD.withId(V2_HOUSEHOLD_IDS.FAMILY),
  createdAt: TIMESTAMPS.CREATED,
  updatedAt: TIMESTAMPS.UPDATED,
};

export const UK_HOME_LABEL = 'Our flat in Leeds';

/** A UK household saved by the same user. */
export const UK_HOME_HOUSEHOLD = Household.starter('uk', SAVED_HOUSEHOLD_YEAR);

/** The UK household's saved row, as `/v2/user-households?country_id=uk` returns it. */
export const UK_HOME_ROW = userHouseholdItem({
  id: SAVED_HOUSEHOLD_IDS.UK_HOME,
  country_id: 'uk',
  household_id: V2_HOUSEHOLD_IDS.UK_HOME,
  name: UK_HOME_LABEL,
});
