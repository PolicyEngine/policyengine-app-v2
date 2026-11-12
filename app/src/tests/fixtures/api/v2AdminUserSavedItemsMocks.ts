import type { Mock } from 'vitest';
import type { components } from '@/api/publicApi/schema';
import type { AdminUserItem } from '@/api/v2AdminUsers';
import type { AdminUserSavedItems } from '@/api/v2AdminUserSavedItems';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  ADMIN_API_MESSAGES,
  ADMIN_USER_IDS,
  GRACE,
  type answerAdminApi,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import { errorResponse, okResponse, TIMESTAMPS } from '@/tests/fixtures/api/v2UserMocks';
import { isAssociationCountry } from '@/types/v2User';

type SavedPolicy = components['schemas']['UserPolicyItem'];
type SavedHousehold = components['schemas']['UserHouseholdItem'];
type SavedSimulation = components['schemas']['UserSimulationItem'];
type SavedReport = components['schemas']['UserReportItem'];

/** The saved records' own IDs. */
export const SAVED_ITEM_IDS = {
  US_POLICY: 'a1000000-0000-4000-8000-000000000001',
  UK_POLICY: 'a1000000-0000-4000-8000-000000000002',
  HOUSEHOLD: 'a2000000-0000-4000-8000-000000000001',
  SIMULATION: 'a3000000-0000-4000-8000-000000000001',
  REPORT: 'a4000000-0000-4000-8000-000000000001',
} as const;

/** The IDs of the policies, households, simulations and reports the records point to. */
export const SAVED_TARGET_IDS = {
  V2_POLICY: 'b1000000-0000-4000-8000-000000000001',
  V1_POLICY: 95762,
  V1_HOUSEHOLD: 54321,
  V2_SIMULATION: 'b3000000-0000-4000-8000-000000000001',
  V1_REPORT: 615,
} as const;

export const SAVED_ITEM_NAMES = {
  US_POLICY: 'Child Tax Credit to $3,600',
  HOUSEHOLD: 'Married with two children in California',
  SIMULATION: 'Child Tax Credit reform in 2026',
  REPORT: 'Child Tax Credit to $3,600 against current law',
} as const;

/** The time Grace's report last ran, a day after it was saved. */
export const REPORT_LAST_RUN_AT = '2026-10-13T09:30:00+00:00';

/** Fields every saved record has, for Grace in the US. */
const savedRecordBase = {
  country_id: 'us' as const,
  user_id: ADMIN_USER_IDS.GRACE,
  name: null,
  description: null,
  created_at: TIMESTAMPS.CREATED,
  updated_at: TIMESTAMPS.UPDATED,
};

export function savedPolicy(overrides: Partial<SavedPolicy> = {}): SavedPolicy {
  return {
    ...savedRecordBase,
    id: SAVED_ITEM_IDS.US_POLICY,
    policy_id: null,
    legacy_policy_id: null,
    baseline: null,
    provenance: null,
    ...overrides,
  };
}

export function savedHousehold(overrides: Partial<SavedHousehold> = {}): SavedHousehold {
  return {
    ...savedRecordBase,
    id: SAVED_ITEM_IDS.HOUSEHOLD,
    household_id: null,
    legacy_household_id: null,
    ...overrides,
  };
}

export function savedSimulation(overrides: Partial<SavedSimulation> = {}): SavedSimulation {
  return {
    ...savedRecordBase,
    id: SAVED_ITEM_IDS.SIMULATION,
    simulation_id: null,
    legacy_simulation_id: null,
    ...overrides,
  };
}

export function savedReport(overrides: Partial<SavedReport> = {}): SavedReport {
  return {
    ...savedRecordBase,
    id: SAVED_ITEM_IDS.REPORT,
    report_id: null,
    legacy_report_id: null,
    user_policy_id: null,
    baseline_user_policy_id: null,
    source_note: null,
    provisions: null,
    validation: null,
    budget_window_years: null,
    last_run_at: null,
    ...overrides,
  };
}

/**
 * The export's `user`: the admin user item's fields that `/v2/me` also has.
 * The admin item types its country as any string; `/v2/me` names `us` or `uk`.
 */
export function exportedUser(user: AdminUserItem): AdminUserSavedItems['user'] {
  return {
    id: user.id,
    user_type: user.user_type,
    primary_country: isAssociationCountry(user.primary_country) ? user.primary_country : null,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email,
    created_at: user.created_at,
  };
}

/** What a user who saved nothing gets back. */
export function nothingSaved(user: AdminUserItem): AdminUserSavedItems {
  return { user: exportedUser(user), policies: [], households: [], simulations: [], reports: [] };
}

/**
 * Grace's saved items: a v2 policy in the US and an unnamed v1 policy in
 * the UK, a v1 household, a v2 simulation and a v1 report that has run.
 */
export const GRACE_SAVED_ITEMS: AdminUserSavedItems = {
  user: exportedUser(GRACE),
  policies: [
    savedPolicy({ name: SAVED_ITEM_NAMES.US_POLICY, policy_id: SAVED_TARGET_IDS.V2_POLICY }),
    savedPolicy({
      id: SAVED_ITEM_IDS.UK_POLICY,
      country_id: 'uk',
      legacy_policy_id: SAVED_TARGET_IDS.V1_POLICY,
    }),
  ],
  households: [
    savedHousehold({
      name: SAVED_ITEM_NAMES.HOUSEHOLD,
      legacy_household_id: SAVED_TARGET_IDS.V1_HOUSEHOLD,
    }),
  ],
  simulations: [
    savedSimulation({
      name: SAVED_ITEM_NAMES.SIMULATION,
      simulation_id: SAVED_TARGET_IDS.V2_SIMULATION,
    }),
  ],
  reports: [
    savedReport({
      name: SAVED_ITEM_NAMES.REPORT,
      legacy_report_id: SAVED_TARGET_IDS.V1_REPORT,
      last_run_at: REPORT_LAST_RUN_AT,
    }),
  ],
};

/**
 * Makes `fetchMock`, already set up by `answerAdminApi`, also answer
 * `GET /v2/admin/users/{user_id}/saved-items` as the Public API does: a
 * user in `apiState` gets its entry of `savedItemsByUserId`, or nothing
 * saved; any other ID is a 404.
 */
export function answerSavedItems(
  fetchMock: Mock,
  apiState: ReturnType<typeof answerAdminApi>,
  savedItemsByUserId: Readonly<Record<string, AdminUserSavedItems>> = {
    [GRACE.id]: GRACE_SAVED_ITEMS,
  }
) {
  const answerAsBefore = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const savedItemsRoute = /^\/v2\/admin\/users\/([^/]+)\/saved-items$/.exec(publicApiPathOf(url));
    if (!savedItemsRoute || (init.method ?? 'GET') !== 'GET') {
      return answerAsBefore(url, init);
    }
    const user = apiState.users.find((candidate) => candidate.id === savedItemsRoute[1]);
    if (!user) {
      return errorResponse(404, ADMIN_API_MESSAGES.NO_SIGNED_IN_USER);
    }
    return okResponse(savedItemsByUserId[user.id] ?? nothingSaved(user));
  });
}
