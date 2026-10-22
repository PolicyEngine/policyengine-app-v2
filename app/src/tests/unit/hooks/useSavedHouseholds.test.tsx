import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  useDeleteSavedHousehold,
  useRenameSavedHousehold,
  useSavedHousehold,
  useSavedHouseholds,
  useSaveHousehold,
  useSaveHouseholdChanges,
} from '@/hooks/useSavedHouseholds';
import {
  EDITED_FAMILY_HOUSEHOLD,
  FAMILY_HOUSEHOLD,
  FAMILY_LABEL,
  RETIRED_LABEL,
  routeRequests,
  SAVED_HOUSEHOLD_IDS,
  UK_HOME_HOUSEHOLD,
  UK_HOME_LABEL,
  UK_HOME_ROW,
  userHouseholdItem,
  V2_HOUSEHOLD_IDS,
  v2HouseholdItem,
} from '@/tests/fixtures/api/savedHouseholdMocks';
import {
  createTestApiContext,
  itemResponse,
  noContentResponse,
  pageResponse,
} from '@/tests/fixtures/api/v2UserMocks';

const mockSavedWork = vi.fn();
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => mockSavedWork(),
}));

const SESSION_SCOPE = 'account:auth0|test-user';

function renderWithQueries<Result>(hook: () => Result) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(hook, { wrapper });
}

/** A session with an account, whose requests the fetch mock answers. */
function signedInSession() {
  const { fetchMock, context } = createTestApiContext('us');
  mockSavedWork.mockReturnValue({ account: context, scope: SESSION_SCOPE });
  return fetchMock;
}

const familyRow = userHouseholdItem();
const familyHousehold = v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY);

describe('useSavedHouseholds', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given no accounts then saved households are unavailable and nothing is asked for', () => {
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });

    const { result } = renderWithQueries(() => useSavedHouseholds());

    expect(result.current.available).toBe(false);
    expect(result.current.savedHouseholds).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  test("given an account then the session's saved households are listed", async () => {
    const fetchMock = signedInSession();
    routeRequests(fetchMock, {
      'GET /v2/user-households': () => pageResponse([familyRow]),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHousehold),
    });

    const { result } = renderWithQueries(() => useSavedHouseholds());

    await waitFor(() => expect(result.current.savedHouseholds).toHaveLength(1));
    expect(result.current.available).toBe(true);
    expect(result.current.savedHouseholds[0].label).toBe(FAMILY_LABEL);
  });

  test("given the country changes for the same user then that country's saved households are listed", async () => {
    const { fetchMock: usFetch, context: usContext } = createTestApiContext('us');
    const { fetchMock: ukFetch, context: ukContext } = createTestApiContext('uk');
    routeRequests(usFetch, {
      'GET /v2/user-households': () => pageResponse([familyRow]),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHousehold),
    });
    const ukRequests = routeRequests(ukFetch, {
      'GET /v2/user-households': () => pageResponse([UK_HOME_ROW]),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.UK_HOME}`]: () =>
        itemResponse(v2HouseholdItem(UK_HOME_HOUSEHOLD, V2_HOUSEHOLD_IDS.UK_HOME)),
    });
    mockSavedWork.mockReturnValue({ account: usContext, scope: SESSION_SCOPE });
    const { result, rerender } = renderWithQueries(() => useSavedHouseholds());
    await waitFor(() => expect(result.current.savedHouseholds).toHaveLength(1));

    mockSavedWork.mockReturnValue({ account: ukContext, scope: SESSION_SCOPE });
    rerender();

    await waitFor(() =>
      expect(result.current.savedHouseholds.map((saved) => saved.label)).toEqual([UK_HOME_LABEL])
    );
    expect(ukRequests[0].query.country_id).toBe('uk');
  });

  test('given a household saved then the list shows it', async () => {
    const fetchMock = signedInSession();
    let rows: unknown[] = [];
    routeRequests(fetchMock, {
      'GET /v2/user-households': () => pageResponse(rows),
      'POST /v2/households': () => itemResponse(familyHousehold, 201),
      'POST /v2/user-households': () => {
        rows = [familyRow];
        return itemResponse(familyRow, 201);
      },
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHousehold),
    });
    const { result } = renderWithQueries(() => ({
      list: useSavedHouseholds(),
      save: useSaveHousehold(),
    }));
    await waitFor(() => expect(result.current.list.isLoading).toBe(false));

    await act(() =>
      result.current.save.mutateAsync({ household: FAMILY_HOUSEHOLD, label: FAMILY_LABEL })
    );

    await waitFor(() => expect(result.current.list.savedHouseholds).toHaveLength(1));
  });

  test('given a rename or a delete then the list is read again', async () => {
    const fetchMock = signedInSession();
    let rows: unknown[] = [familyRow];
    const requests = routeRequests(fetchMock, {
      'GET /v2/user-households': () => pageResponse(rows),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHousehold),
      [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => {
        rows = [{ ...familyRow, name: RETIRED_LABEL }];
        return itemResponse(rows[0]);
      },
      [`DELETE /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => {
        rows = [];
        return noContentResponse();
      },
    });
    const { result } = renderWithQueries(() => ({
      list: useSavedHouseholds(),
      rename: useRenameSavedHousehold(),
      remove: useDeleteSavedHousehold(),
    }));
    await waitFor(() => expect(result.current.list.savedHouseholds).toHaveLength(1));

    await act(() =>
      result.current.rename.mutateAsync({
        savedHouseholdId: SAVED_HOUSEHOLD_IDS.FAMILY,
        label: RETIRED_LABEL,
      })
    );
    await waitFor(() => expect(result.current.list.savedHouseholds[0]?.label).toBe(RETIRED_LABEL));

    await act(() => result.current.remove.mutateAsync(SAVED_HOUSEHOLD_IDS.FAMILY));
    await waitFor(() => expect(result.current.list.savedHouseholds).toEqual([]));
    expect(requests.filter((request) => request.path === '/v2/user-households')).toHaveLength(3);
  });

  test('given changes to a saved household then the list and the opened household are read again', async () => {
    const fetchMock = signedInSession();
    const editedHousehold = v2HouseholdItem(
      EDITED_FAMILY_HOUSEHOLD,
      V2_HOUSEHOLD_IDS.EDITED_FAMILY
    );
    let row = familyRow;
    const requests = routeRequests(fetchMock, {
      'GET /v2/user-households': () => pageResponse([row]),
      [`GET /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(row),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () => itemResponse(familyHousehold),
      [`GET /v2/households/${V2_HOUSEHOLD_IDS.EDITED_FAMILY}`]: () => itemResponse(editedHousehold),
      'POST /v2/households': () => itemResponse(editedHousehold, 201),
      [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => {
        row = { ...familyRow, household_id: V2_HOUSEHOLD_IDS.EDITED_FAMILY };
        return itemResponse(row);
      },
    });
    const { result } = renderWithQueries(() => ({
      list: useSavedHouseholds(),
      opened: useSavedHousehold(SAVED_HOUSEHOLD_IDS.FAMILY),
      saveChanges: useSaveHouseholdChanges(),
    }));
    await waitFor(() => expect(result.current.opened.data).toBeTruthy());

    await act(() =>
      result.current.saveChanges.mutateAsync({
        saved: result.current.opened.data!,
        changes: { household: EDITED_FAMILY_HOUSEHOLD },
      })
    );

    await waitFor(() =>
      expect(result.current.opened.data?.householdId).toBe(V2_HOUSEHOLD_IDS.EDITED_FAMILY)
    );
    await waitFor(() =>
      expect(result.current.list.savedHouseholds[0]).toMatchObject({
        householdId: V2_HOUSEHOLD_IDS.EDITED_FAMILY,
      })
    );
    expect(
      requests.filter(
        (request) => request.method === 'GET' && request.path === '/v2/user-households'
      )
    ).toHaveLength(2);
  });

  test('given no accounts then saving fails plainly rather than saving anywhere else', async () => {
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });
    const { result } = renderWithQueries(() => useSaveHousehold());

    await expect(
      result.current.mutateAsync({ household: FAMILY_HOUSEHOLD, label: FAMILY_LABEL })
    ).rejects.toThrow('Saved households need an account.');
  });
});
