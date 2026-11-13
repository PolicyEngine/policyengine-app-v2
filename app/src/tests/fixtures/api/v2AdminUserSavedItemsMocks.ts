import type { Mock } from 'vitest';
import type { components } from '@/api/publicApi/schema';
import type { AdminUserItem } from '@/api/v2AdminUsers';
import type { UserSavedItems } from '@/api/v2AdminUserSavedItems';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  ADMIN_API_MESSAGES,
  ADMIN_USER_IDS,
  GRACE,
  requestMethodOf,
  type answerAdminApi,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  errorResponse,
  itemResponse,
  okResponse,
  TIMESTAMPS,
} from '@/tests/fixtures/api/v2UserMocks';
import { isAssociationCountry } from '@/types/v2User';

type V2Policy = components['schemas']['PolicyItem'];
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
export function exportedUser(user: AdminUserItem): UserSavedItems['user'] {
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
export function nothingSaved(user: AdminUserItem): UserSavedItems {
  return { user: exportedUser(user), policies: [], households: [], simulations: [], reports: [] };
}

/**
 * Grace's saved items: a v2 policy in the US and an unnamed v1 policy in
 * the UK, a v1 household, a v2 simulation and a v1 report that has run.
 */
export const GRACE_SAVED_ITEMS: UserSavedItems = {
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
 * The parameter the saved policies below change. With `seedDeductionMetadata`
 * its current law is $2,000 in 2025 and $2,200 from 2026.
 */
export const SAVED_POLICY_PARAMETER = {
  NAME: 'gov.irs.credits.ctc.amount.base',
  LABEL: 'Child tax credit base amount',
  CURRENT_LAW_2026: '$2,200',
} as const;

/** The v2 policy Grace's US policy points to: the base amount at $3,600 from 2026 on. */
export const GRACE_V2_POLICY: V2Policy = {
  id: SAVED_TARGET_IDS.V2_POLICY,
  country_id: 'us',
  tax_benefit_model_id: 'c1000000-0000-4000-8000-000000000001',
  created_at: TIMESTAMPS.CREATED,
  updated_at: TIMESTAMPS.CREATED,
  parameter_values: [
    {
      id: 'c2000000-0000-4000-8000-000000000001',
      parameter_id: 'c3000000-0000-4000-8000-000000000001',
      parameter_name: SAVED_POLICY_PARAMETER.NAME,
      value: 3600,
      start_date: '2026-01-01T00:00:00Z',
      end_date: null,
    },
  ],
  missing_parameters: [],
};

/** A v1 policy's `policy_json`: the base amount at $3,000 in 2026 only. */
export const V1_POLICY_JSON = {
  [SAVED_POLICY_PARAMETER.NAME]: { '2026-01-01.2026-12-31': 3000 },
} as const;

/** The policies `answerPolicyReads` knows, by country and ID. */
interface KnownPolicies {
  /** v2 policies, by ID. */
  v2: Readonly<Record<string, V2Policy>>;
  /** v1 policies' `policy_json`, by `{country}/{id}`. */
  v1: Readonly<Record<string, Record<string, unknown>>>;
}

/**
 * Makes `fetchMock` also answer the policy reads a saved policy's panel
 * sends: `GET /v2/policies/{policy_id}` and `GET /{country}/policy/{id}`.
 * An unknown policy is a 404. Returns the paths read, in order.
 */
export function answerPolicyReads(
  fetchMock: Mock,
  policies: KnownPolicies = {
    v2: { [GRACE_V2_POLICY.id]: GRACE_V2_POLICY },
    v1: { [`us/${SAVED_TARGET_IDS.V1_POLICY}`]: V1_POLICY_JSON },
  }
) {
  const policyReads: string[] = [];
  const answerAsBefore = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = publicApiPathOf(input);
    const v2PolicyRoute = /^\/v2\/policies\/([^/]+)$/.exec(path);
    const v1PolicyRoute = /^\/(\w+)\/policy\/(\d+)$/.exec(path);
    if (requestMethodOf(input, init) !== 'GET' || (!v2PolicyRoute && !v1PolicyRoute)) {
      return answerAsBefore(input, init);
    }
    policyReads.push(path);
    if (v2PolicyRoute) {
      const policy = policies.v2[v2PolicyRoute[1]];
      return policy ? itemResponse(policy) : errorResponse(404, 'Policy not found.');
    }
    const policyJson = policies.v1[`${v1PolicyRoute![1]}/${v1PolicyRoute![2]}`];
    return policyJson
      ? okResponse({ id: Number(v1PolicyRoute![2]), policy_json: policyJson })
      : errorResponse(404, 'Policy not found.');
  });
  return policyReads;
}

/**
 * The model variables Grace's household sets, as v1 metadata lists them, so
 * the household's panel names them, formats their values and names the
 * state.
 */
export const HOUSEHOLD_VARIABLES = {
  age: { name: 'age', label: 'Age', unit: 'year', entity: 'person' },
  employment_income: {
    name: 'employment_income',
    label: 'Employment income',
    unit: 'currency-USD',
    entity: 'person',
  },
  state_name: {
    name: 'state_name',
    label: 'State',
    unit: null,
    entity: 'household',
    possibleValues: [
      { value: 'CA', label: 'California' },
      { value: 'NY', label: 'New York' },
    ],
  },
  tax_unit_childcare_expenses: {
    name: 'tax_unit_childcare_expenses',
    label: 'Childcare expenses',
    unit: 'currency-USD',
    entity: 'tax_unit',
  },
  spm_unit_pre_subsidy_childcare_expenses: {
    name: 'spm_unit_pre_subsidy_childcare_expenses',
    label: 'Pre-subsidy childcare expenses',
    unit: 'currency-USD',
    entity: 'spm_unit',
  },
};

const GRACE_HOUSEHOLD_MEMBERS = [
  'you',
  'your partner',
  'your first dependent',
  'your second dependent',
];

/**
 * The v1 household Grace's saved household points to, in 2026: a married
 * couple earning $50,000 and $30,000 with children of 10 and 7, in
 * California, with $1,000 of childcare expenses in the tax unit and $2,000
 * before subsidies in the SPM unit, which v1 names "your household" too.
 */
export const V1_HOUSEHOLD_JSON = {
  people: {
    you: { age: { 2026: 40 }, employment_income: { 2026: 50000 } },
    'your partner': { age: { 2026: 38 }, employment_income: { 2026: 30000 } },
    'your first dependent': { age: { 2026: 10 } },
    'your second dependent': { age: { 2026: 7 } },
  },
  families: { 'your family': { members: GRACE_HOUSEHOLD_MEMBERS } },
  tax_units: {
    'your tax unit': {
      members: GRACE_HOUSEHOLD_MEMBERS,
      tax_unit_childcare_expenses: { 2026: 1000 },
    },
  },
  spm_units: {
    'your household': {
      members: GRACE_HOUSEHOLD_MEMBERS,
      spm_unit_pre_subsidy_childcare_expenses: { 2026: 2000 },
    },
  },
  marital_units: {
    'your marital unit': { members: ['you', 'your partner'] },
    "your first dependent's marital unit": { members: ['your first dependent'] },
    "your second dependent's marital unit": { members: ['your second dependent'] },
  },
  households: {
    'your household': { members: GRACE_HOUSEHOLD_MEMBERS, state_name: { 2026: 'CA' } },
  },
};

/** A UK v1 household: one adult of 30 earning £30,000, in London. */
export const UK_V1_HOUSEHOLD_JSON = {
  people: { you: { age: { 2026: 30 }, employment_income: { 2026: 30000 } } },
  benunits: { 'your benefit unit': { members: ['you'] } },
  households: { 'your household': { members: ['you'], region: { 2026: 'LONDON' } } },
};

/** A UK v1 policy's `policy_json`: the personal allowance at £15,000 from 2026 on. */
export const UK_V1_POLICY_JSON = {
  'gov.hmrc.income_tax.allowances.personal_allowance.amount': { '2026-01-01.2100-12-31': 15000 },
};

/**
 * Makes `fetchMock` also answer the household reads a saved household's
 * panel sends, `GET /{country}/household/{id}`, from `households`'
 * `household_json`s, by `{country}/{id}`. An unknown household is a 404.
 * Returns the paths read, in order.
 */
export function answerHouseholdReads(
  fetchMock: Mock,
  households: Readonly<Record<string, unknown>> = {
    [`us/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`]: V1_HOUSEHOLD_JSON,
  }
) {
  const householdReads: string[] = [];
  const answerAsBefore = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
    const path = publicApiPathOf(input);
    const householdRoute = /^\/(\w+)\/household\/(\d+)$/.exec(path);
    if (requestMethodOf(input, init) !== 'GET' || !householdRoute) {
      return answerAsBefore(input, init);
    }
    householdReads.push(path);
    const [, countryId, householdId] = householdRoute;
    const householdJson = households[`${countryId}/${householdId}`];
    return householdJson
      ? okResponse({
          id: Number(householdId),
          country_id: countryId,
          label: null,
          api_version: '1.0.0',
          household_json: householdJson,
          household_hash: 'hash',
        })
      : errorResponse(404, 'Household not found.');
  });
  return householdReads;
}

/**
 * Makes `fetchMock`, already set up by `answerAdminApi`, also answer
 * `GET /v2/admin/users/{user_id}/saved-items` as the Public API does: a
 * user in `apiState` gets its entry of `savedItemsByUserId`, or nothing
 * saved; any other ID is a 404.
 */
export function answerSavedItems(
  fetchMock: Mock,
  apiState: ReturnType<typeof answerAdminApi>,
  savedItemsByUserId: Readonly<Record<string, UserSavedItems>> = {
    [GRACE.id]: GRACE_SAVED_ITEMS,
  }
) {
  const answerAsBefore = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (url: string, init?: RequestInit) => {
    const savedItemsRoute = /^\/v2\/admin\/users\/([^/]+)\/saved-items$/.exec(publicApiPathOf(url));
    if (!savedItemsRoute || requestMethodOf(url, init) !== 'GET') {
      return answerAsBefore(url, init);
    }
    const user = apiState.users.find((candidate) => candidate.id === savedItemsRoute[1]);
    if (!user) {
      return errorResponse(404, ADMIN_API_MESSAGES.NO_SIGNED_IN_USER);
    }
    return okResponse(savedItemsByUserId[user.id] ?? nothingSaved(user));
  });
}
