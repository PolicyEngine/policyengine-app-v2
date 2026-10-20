import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiV2ReformStore, LocalStorageReformStore } from '@/api/reformStore';
import { CountryProvider } from '@/contexts/CountryContext';
import { useReformStore } from '@/hooks/useFlagshipStores';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { fetchMetadataThunk } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  V2_MODEL_ID,
  V2_PARAMETER_IDS,
  V2_POLICYENGINE_VERSION,
} from '@/tests/fixtures/api/publicApi/metadataV2Mocks';
import {
  ASSOCIATION_IDS,
  itemResponse,
  okResponse,
  pageResponse,
  policyItem,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

/** v3 after the switch: V3_API_ROUTES is 'v2'. */
vi.mock('@/libs/flagship/v3ApiRoutes', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/v3ApiRoutes')>()),
  V3_API_ROUTES: 'v2',
}));

const CTC_AMOUNT = 'gov.irs.credits.ctc.amount.base[0].amount';
const V2_POLICY_ID = 'a1b2c3d4-0000-4000-8000-000000000001';

const V2_REFORM_ROW = policyItem({
  id: ASSOCIATION_IDS.REFORM,
  policy_id: V2_POLICY_ID,
  legacy_policy_id: null,
  name: 'CTC to $3,600',
  baseline: 'current-law',
  provenance: { source: 'manual', ref: null, confidence: null },
});

/** The reform's v2 policy, as `/v2/policies` returns it. */
const V2_POLICY_ITEM = {
  id: V2_POLICY_ID,
  country_id: 'us',
  tax_benefit_model_id: V2_MODEL_ID,
  created_at: '2026-10-20T10:00:00Z',
  updated_at: '2026-10-20T10:00:00Z',
  parameter_values: [
    {
      id: 'b0000000-0000-4000-8000-000000000001',
      parameter_id: V2_PARAMETER_IDS.CTC_AMOUNT,
      parameter_name: CTC_AMOUNT,
      value: 3600,
      start_date: '2026-01-01T00:00:00Z',
      end_date: '2100-12-31T00:00:00Z',
    },
  ],
};

const fetchMock = vi.fn();

function requestUrl(input: unknown): URL {
  return new URL(input instanceof Request ? input.url : String(input));
}

function requestMethod(input: unknown, init?: RequestInit): string {
  return input instanceof Request ? input.method : (init?.method ?? 'GET');
}

/** Answers the account's reform list and saves, and the reform's v2 policy. */
function respond(input: unknown, init?: RequestInit): Response {
  const { pathname } = requestUrl(input);
  const method = requestMethod(input, init);
  if (method === 'POST' && pathname === '/v2/policies') {
    return okResponse({ item: V2_POLICY_ITEM }, 201);
  }
  if (method === 'POST' && pathname === '/v2/user-policies') {
    return itemResponse(V2_REFORM_ROW, 201);
  }
  if (pathname === `/v2/policies/${V2_POLICY_ID}`) {
    return okResponse({ item: V2_POLICY_ITEM });
  }
  return pageResponse([V2_REFORM_ROW]);
}

/** The `POST /v2/policies` request a save sent. */
function policyCreationRequest(): Request | undefined {
  return fetchMock.mock.calls
    .map(([input]) => input)
    .find(
      (input): input is Request =>
        input instanceof Request &&
        input.method === 'POST' &&
        requestUrl(input).pathname === '/v2/policies'
    );
}

function v2PolicyRequests(): number {
  return fetchMock.mock.calls.filter(
    ([input]) => requestUrl(input).pathname === `/v2/policies/${V2_POLICY_ID}`
  ).length;
}

/** Metadata loaded from the v2 routes, with its catalog identities. */
function seedV2Metadata() {
  const meta = {
    arg: { countryId: 'us', routes: 'v2' },
    requestId: 'v2-store-test',
    requestStatus: 'pending',
  };
  store.dispatch({ type: fetchMetadataThunk.pending.type, meta });
  store.dispatch({
    type: fetchMetadataThunk.fulfilled.type,
    meta: { ...meta, requestStatus: 'fulfilled' },
    payload: {
      country: 'us',
      data: {
        status: 'ok',
        message: null,
        result: {
          parameters: {},
          variables: {},
          entities: {},
          variableModules: {},
          economy_options: { region: [], time_period: [], datasets: [] },
          current_law_id: 2,
          basicInputs: [],
          modelled_policies: { core: {}, filtered: {} },
          version: V2_POLICYENGINE_VERSION,
          v2Catalog: {
            policyengineVersion: V2_POLICYENGINE_VERSION,
            taxBenefitModelId: V2_MODEL_ID,
            parameterIds: { [CTC_AMOUNT]: V2_PARAMETER_IDS.CTC_AMOUNT },
          },
        },
      },
    },
  });
}

function wrapperFor(auth: AuthContextValue, countryId: 'us' | 'ca' = 'us') {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: React.ReactNode }) => (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <CountryProvider value={countryId}>
          <AuthTestProvider value={auth}>{children}</AuthTestProvider>
        </CountryProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
}

beforeEach(() => {
  fetchMock.mockReset();
  fetchMock.mockImplementation(async (input: unknown, init?: RequestInit) => respond(input, init));
  vi.stubGlobal('fetch', fetchMock);
  seedV2Metadata();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useReformStore with v3 on the v2 routes', () => {
  test.each([
    ['signed in', signedInAuthValue()],
    ['signed out', makeAuthValue()],
  ] as const)('given %s in the US then reforms use v2 policies', (_, auth) => {
    // When
    const reforms = renderHook(() => useReformStore(), { wrapper: wrapperFor(auth) }).result
      .current;

    // Then
    expect(reforms).toBeInstanceOf(ApiV2ReformStore);
  });

  test('given a country without accounts then reforms stay in this browser', () => {
    // When
    const reforms = renderHook(() => useReformStore(), {
      wrapper: wrapperFor(signedInAuthValue(), 'ca'),
    }).result.current;

    // Then
    expect(reforms).toBeInstanceOf(LocalStorageReformStore);
  });

  test('given v2 metadata then a saved reform makes its policy for the loaded catalog', async () => {
    // Given
    const reforms = renderHook(() => useReformStore(), {
      wrapper: wrapperFor(signedInAuthValue()),
    }).result.current;

    // When
    const saved = await reforms.create({
      countryId: 'us',
      label: 'CTC to $3,600',
      parameters: [
        {
          name: CTC_AMOUNT,
          values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
        },
      ],
      baseline: 'current-law',
      provenance: { source: 'manual' },
    });

    // Then
    const policyCreation = policyCreationRequest();
    expect(policyCreation).toBeDefined();
    expect(requestUrl(policyCreation).searchParams.get('policyengine_version')).toBe(
      V2_POLICYENGINE_VERSION
    );
    expect(await policyCreation!.json()).toMatchObject({
      tax_benefit_model_id: V2_MODEL_ID,
      parameter_values: [{ parameter_id: V2_PARAMETER_IDS.CTC_AMOUNT, value: 3600 }],
    });
    expect(saved.policyId).toBe(V2_POLICY_ID);
  });

  test('given the reform list is loaded again then each v2 policy is fetched only once', async () => {
    // Given
    const reforms = renderHook(() => useReformStore(), {
      wrapper: wrapperFor(signedInAuthValue()),
    }).result.current;

    // When
    const first = await reforms.findMine('us');
    const second = await reforms.findMine('us');

    // Then
    expect(v2PolicyRequests()).toBe(1);
    expect(first[0].parameters).toEqual([
      {
        name: CTC_AMOUNT,
        values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
      },
    ]);
    expect(second[0].parameters).toEqual(first[0].parameters);
  });
});
