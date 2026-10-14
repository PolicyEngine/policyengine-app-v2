import { vi } from 'vitest';
import type { ApiStoreContext } from '@/api/v2Associations';
import { createV2UserClient } from '@/api/v2UserClient';
import type { MeItem, UserPolicyItem, UserReportItem } from '@/types/v2User';

export const TEST_API_BASE = 'https://api.test.policyengine.org';
export const TEST_ACCESS_TOKEN = 'test-access-token';
/** This browser's unauthenticated user in tests. */
export const BROWSER_USER_ID = '6f1c2a9e-3b4d-4e5f-8a7b-9c0d1e2f3a4b';
export const PE_USER_ID = '7c1e5a8e-2b1f-4c55-9a3e-1f2d3c4b5a69';

export const ASSOCIATION_IDS = {
  POLICY: '11111111-1111-4111-8111-111111111111',
  REPORT: '44444444-4444-4444-8444-444444444444',
  REFORM: '55555555-5555-4555-8555-555555555555',
} as const;

export const LEGACY_IDS = {
  POLICY: 95762,
  REPORT: 615,
} as const;

export const TIMESTAMPS = {
  CREATED: '2026-10-12T10:00:00+00:00',
  UPDATED: '2026-10-12T11:00:00+00:00',
} as const;

export const mockMeItem: MeItem = {
  id: PE_USER_ID,
  user_type: 'standard',
  primary_country: 'us',
  first_name: 'Ada',
  last_name: 'Lovelace',
  email: 'ada@example.org',
  created_at: TIMESTAMPS.CREATED,
};

const base = {
  country_id: 'us' as const,
  user_id: PE_USER_ID,
  name: null,
  description: null,
  created_at: TIMESTAMPS.CREATED,
  updated_at: TIMESTAMPS.UPDATED,
};

export function policyItem(overrides: Partial<UserPolicyItem> = {}): UserPolicyItem {
  return {
    ...base,
    id: ASSOCIATION_IDS.POLICY,
    policy_id: null,
    legacy_policy_id: LEGACY_IDS.POLICY,
    baseline: null,
    provenance: null,
    ...overrides,
  };
}

export function reportItem(overrides: Partial<UserReportItem> = {}): UserReportItem {
  return {
    ...base,
    id: ASSOCIATION_IDS.REPORT,
    report_id: null,
    legacy_report_id: LEGACY_IDS.REPORT,
    user_policy_id: null,
    source_note: null,
    provisions: null,
    validation: null,
    budget_window_years: null,
    last_run_at: null,
    ...overrides,
  };
}

/** `{"status": "ok", "message": null, "result": …}` as a fetch Response. */
export function okResponse(result: unknown, status = 200): Response {
  return new Response(JSON.stringify({ status: 'ok', message: null, result }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function itemResponse(item: unknown, status = 200): Response {
  return okResponse({ item }, status);
}

export function pageResponse(items: unknown[], { offset = 0, hasMore = false } = {}): Response {
  return okResponse({ items, offset, limit: 500, has_more: hasMore });
}

export function errorResponse(status: number, message: string): Response {
  return new Response(JSON.stringify({ status: 'error', message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function noContentResponse(): Response {
  return new Response(null, { status: 204 });
}

/** A fetch mock plus an API store context that uses it. */
export function createTestApiContext(countryId: 'us' | 'uk' = 'us'): {
  fetchMock: ReturnType<typeof vi.fn>;
  context: ApiStoreContext;
} {
  const fetchMock = vi.fn();
  const client = createV2UserClient({
    credentials: { kind: 'session', getAccessToken: async () => TEST_ACCESS_TOKEN },
    baseUrl: TEST_API_BASE,
    fetchImpl: fetchMock as unknown as typeof fetch,
  });
  return { fetchMock, context: { client, countryId } };
}

/** The (url, init) of the nth fetch call, with the parsed URL and JSON body. */
export function fetchCall(fetchMock: ReturnType<typeof vi.fn>, index = 0) {
  const [url, init] = fetchMock.mock.calls[index] as [string, RequestInit];
  const parsed = new URL(url);
  return {
    url: parsed,
    path: parsed.pathname,
    query: Object.fromEntries(parsed.searchParams.entries()),
    method: init.method,
    headers: init.headers as Record<string, string>,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  };
}
