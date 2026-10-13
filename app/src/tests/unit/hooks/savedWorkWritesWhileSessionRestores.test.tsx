import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageHouseholdStore } from '@/api/householdAssociation';
import { LocalStoragePolicyStore } from '@/api/policyAssociation';
import { LocalStorageReformStore } from '@/api/reformStore';
import { LocalStorageReportStore } from '@/api/reportAssociation';
import { LocalStorageSimulationStore } from '@/api/simulationAssociation';
import { MOCK_USER_ID } from '@/constants';
import { CountryProvider } from '@/contexts/CountryContext';
import { useReformStore } from '@/hooks/useFlagshipStores';
import { useCreateHouseholdAssociation } from '@/hooks/useUserHousehold';
import { useCreatePolicyAssociation, useUpdatePolicyAssociation } from '@/hooks/useUserPolicy';
import { useCreateReportAssociation, useUserReportStore } from '@/hooks/useUserReportAssociations';
import {
  useCreateSimulationAssociation,
  useUserSimulationStore,
} from '@/hooks/useUserSimulationAssociations';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { store } from '@/store';
import {
  ASSOCIATION_IDS,
  householdItem,
  itemResponse,
  LEGACY_IDS,
  policyItem,
  reportItem,
  simulationItem,
  TEST_ACCESS_TOKEN,
} from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';
import type { UserPolicy } from '@/types/ingredients/UserPolicy';

/**
 * Saved-work writes issued while the sign-in session is still being
 * restored wait for it, then go where it settles: the account for a
 * signed-in user, this browser for a signed-out visitor.
 */

const fetchMock = vi.fn();

function renderWithSession<Result>(useHook: () => Result) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  let auth: AuthContextValue = makeAuthValue({ status: 'loading' });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ReduxProvider store={store}>
      <QueryClientProvider client={queryClient}>
        <CountryProvider value="us">
          <AuthTestProvider value={auth}>{children}</AuthTestProvider>
        </CountryProvider>
      </QueryClientProvider>
    </ReduxProvider>
  );
  const rendered = renderHook(useHook, { wrapper });
  return {
    result: rendered.result,
    settle: (next: AuthContextValue) =>
      act(() => {
        auth = next;
        rendered.rerender();
      }),
  };
}

/** Lets pending promise callbacks run without settling the session. */
const flush = () => act(() => new Promise((resolve) => setTimeout(resolve, 0)));

function lastRequest() {
  const [url, init] = fetchMock.mock.calls.at(-1) as [string, RequestInit];
  return {
    method: init.method,
    path: new URL(url).pathname,
    authorization: (init.headers as Record<string, string>).Authorization,
    body: init.body ? JSON.parse(String(init.body)) : undefined,
  };
}

const newPolicy: Omit<UserPolicy, 'id' | 'createdAt'> = {
  userId: MOCK_USER_ID,
  policyId: String(LEGACY_IDS.POLICY),
  countryId: 'us',
  label: 'CTC expansion',
};

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('saved-work writes while the sign-in session is being restored', () => {
  test('given a policy saved while signing in then it waits and lands in the account', async () => {
    // Given
    fetchMock.mockResolvedValue(itemResponse(policyItem({ name: 'CTC expansion' }), 201));
    const { result, settle } = renderWithSession(() => useCreatePolicyAssociation());

    // When
    let saving: Promise<UserPolicy> | undefined;
    act(() => {
      saving = result.current.mutateAsync(newPolicy);
    });
    await flush();

    // Then: nothing is written until the session settles
    expect(fetchMock).not.toHaveBeenCalled();
    expect(await new LocalStoragePolicyStore().findByUser(MOCK_USER_ID)).toEqual([]);

    // When
    await settle(signedInAuthValue());
    const saved = await act(() => saving!);

    // Then
    expect(lastRequest()).toMatchObject({
      method: 'POST',
      path: '/v2/user-policies',
      authorization: `Bearer ${TEST_ACCESS_TOKEN}`,
      body: { legacy_policy_id: LEGACY_IDS.POLICY, name: 'CTC expansion' },
    });
    expect(saved.id).toBe(ASSOCIATION_IDS.POLICY);
    expect(await new LocalStoragePolicyStore().findByUser(MOCK_USER_ID)).toEqual([]);
  });

  test('given a policy saved while the session restores then a signed-out visitor saves locally', async () => {
    // Given
    const { result, settle } = renderWithSession(() => useCreatePolicyAssociation());
    let saving: Promise<UserPolicy> | undefined;
    act(() => {
      saving = result.current.mutateAsync(newPolicy);
    });

    // When
    await settle(makeAuthValue({ status: 'anonymous' }));
    const saved = await act(() => saving!);

    // Then
    expect(fetchMock).not.toHaveBeenCalled();
    expect(saved.id).toMatch(/^sup-/);
    expect(await new LocalStoragePolicyStore().findByUserPolicyId(saved.id!)).toMatchObject({
      label: 'CTC expansion',
    });
  });

  test('given a rename issued while signing in then it patches the account row', async () => {
    // Given
    fetchMock.mockResolvedValue(itemResponse(policyItem({ name: 'Renamed' })));
    const { result, settle } = renderWithSession(() => useUpdatePolicyAssociation());
    let renaming: Promise<UserPolicy> | undefined;
    act(() => {
      renaming = result.current.mutateAsync({
        userPolicyId: ASSOCIATION_IDS.POLICY,
        updates: { label: 'Renamed' },
      });
    });

    // When
    await settle(signedInAuthValue());
    await act(() => renaming!);

    // Then
    expect(lastRequest()).toMatchObject({
      method: 'PATCH',
      path: `/v2/user-policies/${ASSOCIATION_IDS.POLICY}`,
      body: { name: 'Renamed' },
    });
  });

  /** What to save, the account row it returns, its route, and this browser's copies. */
  type SaveCase = [string, () => () => Promise<unknown>, object, string, () => Promise<unknown[]>];
  const saveCases: SaveCase[] = [
    [
      'report (direct store write, as the report builder does)',
      () => {
        const reportStore = useUserReportStore();
        return () =>
          reportStore.create({
            userId: MOCK_USER_ID,
            reportId: String(LEGACY_IDS.REPORT),
            countryId: 'us',
          });
      },
      reportItem(),
      '/v2/user-reports',
      () => new LocalStorageReportStore().findByUser(MOCK_USER_ID),
    ],
    [
      'simulation (direct store write, as the report builder does)',
      () => {
        const simulationStore = useUserSimulationStore();
        return () =>
          simulationStore.create({
            userId: MOCK_USER_ID,
            simulationId: String(LEGACY_IDS.SIMULATION),
            countryId: 'us',
          });
      },
      simulationItem(),
      '/v2/user-simulations',
      () => new LocalStorageSimulationStore().findByUser(MOCK_USER_ID),
    ],
    [
      'household',
      () => {
        const create = useCreateHouseholdAssociation();
        return () =>
          create.mutateAsync({
            userId: MOCK_USER_ID,
            householdId: String(LEGACY_IDS.HOUSEHOLD),
            countryId: 'us',
            label: 'Family',
          });
      },
      householdItem(),
      '/v2/user-households',
      () => new LocalStorageHouseholdStore().findByUser(MOCK_USER_ID),
    ],
    [
      'simulation',
      () => {
        const create = useCreateSimulationAssociation();
        return () =>
          create.mutateAsync({
            userId: MOCK_USER_ID,
            simulationId: String(LEGACY_IDS.SIMULATION),
            countryId: 'us',
            label: 'Baseline',
          });
      },
      simulationItem(),
      '/v2/user-simulations',
      () => new LocalStorageSimulationStore().findByUser(MOCK_USER_ID),
    ],
    [
      'report',
      () => {
        const create = useCreateReportAssociation();
        return () =>
          create.mutateAsync({
            userId: MOCK_USER_ID,
            reportId: String(LEGACY_IDS.REPORT),
            countryId: 'us',
            label: 'My report',
          });
      },
      reportItem(),
      '/v2/user-reports',
      () => new LocalStorageReportStore().findByUser(MOCK_USER_ID),
    ],
  ];

  test.each(saveCases)(
    'given a %s saved while signing in then it lands in the account, not this browser',
    async (_, useSave, accountItem, path, readLocal) => {
      // Given
      fetchMock.mockResolvedValue(itemResponse(accountItem, 201));
      const { result, settle } = renderWithSession(useSave);
      let saving: Promise<unknown> | undefined;
      act(() => {
        saving = result.current();
      });
      await flush();
      expect(fetchMock).not.toHaveBeenCalled();

      // When
      await settle(signedInAuthValue());
      await act(() => saving!);

      // Then
      expect(lastRequest()).toMatchObject({ method: 'POST', path });
      expect(await readLocal()).toEqual([]);
    }
  );

  test('given a reform saved from a direct store write while signing in then it lands in the account', async () => {
    // Given
    fetchMock.mockResolvedValue(
      itemResponse(
        policyItem({
          id: ASSOCIATION_IDS.REFORM,
          provenance: { source: 'manual', ref: null, confidence: null },
          baseline: 'current-law',
        }),
        201
      )
    );
    const { result, settle } = renderWithSession(() => useReformStore());
    let saving: Promise<unknown> | undefined;
    act(() => {
      saving = result.current.create({
        userId: MOCK_USER_ID,
        countryId: 'us',
        label: 'Adjusted',
        policyId: String(LEGACY_IDS.POLICY),
        parameters: [],
        baseline: 'current-law',
        provenance: { source: 'manual' },
      });
    });
    await flush();
    expect(fetchMock).not.toHaveBeenCalled();

    // When
    await settle(signedInAuthValue());
    await act(() => saving!);

    // Then
    expect(lastRequest()).toMatchObject({ method: 'POST', path: '/v2/user-policies' });
    expect(await new LocalStorageReformStore().findByUser(MOCK_USER_ID)).toEqual([]);
  });
});
