import { QueryNormalizerProvider } from '@normy/react-query';
import { hashKey, QueryClient, QueryClientProvider, QueryObserver } from '@tanstack/react-query';
import { act, render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { ReformNotFoundError } from '@/api/reformStore';
import { V2ApiError } from '@/api/v2UserClient';
import { DraftRunBar } from '@/components/flagship/reform/DraftHeader';
import { savedReformListKey } from '@/hooks/useSavedReformList';
import {
  addDraftProvision,
  clearDraftReform,
  getDraftReform,
  loadReformIntoDraft,
  setDraftLabel,
  startDraftReform,
  updateDraftProvisionValue,
  useDraftReform,
} from '@/libs/draftReform';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import {
  APP_QUERY_STALE_TIME,
  BROWSER_SCOPE,
  EARLIER_REFORM,
  EDITED_EARLIER_REFORM,
  EITC_MAX_PATH,
  LATER_REFORM,
  LONGER_THAN_STALE_TIME,
  NEW_REFORM,
  OTHER_ACCOUNT_SCOPE,
  SAVED_REFORMS,
  SAVED_TIMES,
  savedEitcReform,
} from '@/tests/fixtures/hooks/useSavedReformListMocks';
import { REMOVED_US_PARAMETER } from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import type { Reform } from '@/types/ingredients/Reform';

const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockFindMine = vi.fn();
const mockRun = vi.fn();
/** Whose saved work the session holds; a test can change it mid-save. */
let mockSessionScope: string = BROWSER_SCOPE;

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ create: mockCreate, update: mockUpdate, findMine: mockFindMine }),
  };
});

vi.mock('@/hooks/useFlagshipStores', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/hooks/useFlagshipStores')>();
  return { ...actual, useV3SavedWork: () => ({ account: null, scope: mockSessionScope }) };
});

const LIST_KEY = savedReformListKey(BROWSER_SCOPE, 'us');

const EITC_DETAILS = {
  breadcrumb: 'IRS → Credits → EITC → Maximum',
  unit: 'currency-USD',
  baselineValue: 600,
};

function RunBarHarness() {
  const draft = useDraftReform();
  return draft ? <DraftRunBar draft={draft} /> : null;
}

/**
 * Renders the run bar as the app provides it (its query defaults, and the
 * normalizer that rewrites cached objects a mutation answers), once its
 * list of saved reforms has loaded.
 */
async function renderWithLoadedList() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: APP_QUERY_STALE_TIME } },
  });
  const view = render(
    <QueryNormalizerProvider queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <RunBarHarness />
      </QueryClientProvider>
    </QueryNormalizerProvider>
  );
  await waitFor(() => expect(queryClient.getQueryState(LIST_KEY)?.status).toBe('success'));
  return { ...view, queryClient };
}

/** Counts the reads of the list's query that start from now on. */
function countListReads(queryClient: QueryClient): () => number {
  let reads = 0;
  queryClient.getQueryCache().subscribe((event) => {
    if (
      event.type === 'updated' &&
      event.action.type === 'fetch' &&
      event.query.queryHash === hashKey(LIST_KEY)
    ) {
      reads += 1;
    }
  });
  return () => reads;
}

/** Waits until nothing reads the list. */
const listSettled = (queryClient: QueryClient) =>
  waitFor(() => expect(queryClient.getQueryState(LIST_KEY)?.fetchStatus).toBe('idle'));

/** Shows the list as Your reforms does, reading the store when its cache asks for it. */
function showYourReforms(queryClient: QueryClient) {
  const yourReformsList = new QueryObserver(queryClient, {
    queryKey: LIST_KEY,
    queryFn: () => mockFindMine('us'),
  });
  return yourReformsList.subscribe(() => {});
}

describe('DraftRunBar and the cached list of saved reforms', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSessionScope = BROWSER_SCOPE;
    mockFindMine.mockResolvedValue(SAVED_REFORMS);
    clearDraftReform();
    startDraftReform('us', 'manual');
  });

  afterEach(() => {
    vi.useRealTimers();
    store.dispatch(clearMetadata());
  });

  test('given save and run of a new reform then it joins the list, which is not read again', async () => {
    // Given
    const user = userEvent.setup();
    addDraftProvision('us', { path: EITC_MAX_PATH, ...EITC_DETAILS, value: 900 });
    mockCreate.mockResolvedValue(NEW_REFORM);
    const { queryClient } = await renderWithLoadedList();
    const listReads = countListReads(queryClient);

    // When
    await user.click(screen.getByRole('button', { name: /run 2026 report/i }));
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));

    // Then
    await listSettled(queryClient);
    expect(listReads()).toBe(0);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
  });

  test('given save and run of a saved reform being edited then the edit takes its place, and the list is not read again', async () => {
    // Given
    const user = userEvent.setup();
    loadReformIntoDraft(EARLIER_REFORM, () => EITC_DETAILS);
    updateDraftProvisionValue(EITC_MAX_PATH, 950);
    mockUpdate.mockResolvedValue(EDITED_EARLIER_REFORM);
    const { queryClient } = await renderWithLoadedList();
    const listReads = countListReads(queryClient);

    // When
    await user.click(screen.getByRole('button', { name: 'Save and run 2026 report' }));
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));

    // Then
    await listSettled(queryClient);
    expect(mockUpdate).toHaveBeenCalledWith(EARLIER_REFORM.id, expect.anything());
    expect(listReads()).toBe(0);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([EDITED_EARLIER_REFORM, LATER_REFORM]);
  });

  test('given save and run reuses a saved reform the store has changed since the list was read then the list holds it as the store does, and keeps the other reforms whole', async () => {
    // Given: the list as read, then the store's copy, renamed in another tab
    const user = userEvent.setup();
    addDraftProvision('us', { path: EITC_MAX_PATH, ...EITC_DETAILS, value: 900 });
    const sameValues = savedEitcReform('rf-same', 'Same values', 900, SAVED_TIMES.LATER);
    const sameValuesRenamed = {
      ...sameValues,
      label: 'Same values, renamed',
      updatedAt: SAVED_TIMES.JUST_NOW,
    };
    const flagged = savedEitcReform('rf-flagged', 'Flagged plan', 750, SAVED_TIMES.EARLIER, {
      missingParameters: [REMOVED_US_PARAMETER],
    });
    const oldest = savedEitcReform('rf-oldest', 'Oldest plan', 650, '2026-09-01T09:00:00.000Z');
    mockFindMine
      .mockResolvedValueOnce([sameValues, flagged, oldest])
      .mockResolvedValue([sameValuesRenamed, flagged, oldest]);
    const { queryClient } = await renderWithLoadedList();
    const listReads = countListReads(queryClient);

    // When
    await user.click(screen.getByRole('button', { name: /run 2026 report/i }));
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));

    // Then
    await listSettled(queryClient);
    expect(mockCreate).not.toHaveBeenCalled();
    expect(mockRun.mock.calls[0][3]).toBe('rf-same');
    expect(listReads()).toBe(0);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([sameValuesRenamed, flagged, oldest]);
  });

  test('given save of a new reform then Your reforms opens with it in the list, without reading the list', async () => {
    // Given
    const user = userEvent.setup();
    addDraftProvision('us', { path: EITC_MAX_PATH, ...EITC_DETAILS, value: 900 });
    mockCreate.mockResolvedValue(NEW_REFORM);
    const { queryClient } = await renderWithLoadedList();
    const listReads = countListReads(queryClient);

    // When: saved, and Your reforms shows the list
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(getDraftReform()).toBeNull());
    const hideYourReforms = showYourReforms(queryClient);

    // Then
    await listSettled(queryClient);
    expect(listReads()).toBe(0);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
    hideYourReforms();
  });

  test('given save after the list is older than the app keeps data fresh then Your reforms reads it as it would without the save, so changes made elsewhere show', async () => {
    // Given: the list loaded, six minutes of editing, and a reform deleted in another tab
    vi.useFakeTimers({ toFake: ['Date'] });
    const user = userEvent.setup();
    addDraftProvision('us', { path: EITC_MAX_PATH, ...EITC_DETAILS, value: 900 });
    mockCreate.mockResolvedValue(NEW_REFORM);
    const { queryClient } = await renderWithLoadedList();
    vi.setSystemTime(Date.now() + LONGER_THAN_STALE_TIME);
    mockFindMine.mockResolvedValue([NEW_REFORM, LATER_REFORM]);
    const listReads = countListReads(queryClient);

    // When: saved, and Your reforms shows the list
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(getDraftReform()).toBeNull());
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
    const hideYourReforms = showYourReforms(queryClient);

    // Then
    await waitFor(() =>
      expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, LATER_REFORM])
    );
    expect(listReads()).toBe(1);
    hideYourReforms();
  });

  test('given save of a saved reform being edited then the edit takes its place, and the list is not read again', async () => {
    // Given
    const user = userEvent.setup();
    loadReformIntoDraft(EARLIER_REFORM, () => EITC_DETAILS);
    updateDraftProvisionValue(EITC_MAX_PATH, 950);
    mockUpdate.mockResolvedValue(EDITED_EARLIER_REFORM);
    const { queryClient } = await renderWithLoadedList();
    const listReads = countListReads(queryClient);

    // When
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(getDraftReform()).toBeNull());

    // Then
    await listSettled(queryClient);
    expect(listReads()).toBe(0);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([EDITED_EARLIER_REFORM, LATER_REFORM]);
  });

  test('given the saved reform being edited is no longer in the store then the list drops it and holds the new one', async () => {
    // Given: deleted in another tab, so the save makes a new reform
    const user = userEvent.setup();
    loadReformIntoDraft(EARLIER_REFORM, () => EITC_DETAILS);
    updateDraftProvisionValue(EITC_MAX_PATH, 950);
    mockUpdate.mockRejectedValue(new ReformNotFoundError());
    mockCreate.mockResolvedValue(NEW_REFORM);
    const { queryClient } = await renderWithLoadedList();
    const listReads = countListReads(queryClient);

    // When
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(getDraftReform()).toBeNull());

    // Then
    await listSettled(queryClient);
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(listReads()).toBe(0);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, LATER_REFORM]);
  });

  test('given making the edit policy answers 404 and the save fails then the reform, still saved, stays in the list', async () => {
    // Given: the Public API does not know the loaded catalog version, so
    // making the policy answers 404 for the update and for the new reform
    const user = userEvent.setup();
    loadReformIntoDraft(EARLIER_REFORM, () => EITC_DETAILS);
    updateDraftProvisionValue(EITC_MAX_PATH, 950);
    const catalogVersionNotFound = new V2ApiError(404, 'Metadata catalog version not found', {
      fromPublicApi: true,
    });
    mockUpdate.mockRejectedValue(catalogVersionNotFound);
    mockCreate.mockRejectedValue(catalogVersionNotFound);
    const { queryClient } = await renderWithLoadedList();

    // When
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(await screen.findByText('Could not save the reform. Try again.')).toBeInTheDocument();
    await listSettled(queryClient);

    // Then
    expect(mockCreate).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(LIST_KEY)).toEqual(SAVED_REFORMS);
  });

  test('given the session changes while a save is in flight then the reform goes into the list of the session that saved it', async () => {
    // Given: a save that waits until released
    const user = userEvent.setup();
    addDraftProvision('us', { path: EITC_MAX_PATH, ...EITC_DETAILS, value: 900 });
    let finishCreate!: (reform: Reform) => void;
    mockCreate.mockReturnValue(
      new Promise<Reform>((resolve) => {
        finishCreate = resolve;
      })
    );
    const { queryClient } = await renderWithLoadedList();
    const otherSessionKey = savedReformListKey(OTHER_ACCOUNT_SCOPE, 'us');

    // When: another session takes over (signed in elsewhere, say), then the save lands
    await user.click(screen.getByRole('button', { name: /run 2026 report/i }));
    await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
    mockSessionScope = OTHER_ACCOUNT_SCOPE;
    act(() => setDraftLabel('Renamed while saving'));
    await waitFor(() => expect(queryClient.getQueryState(otherSessionKey)?.status).toBe('success'));
    await act(async () => finishCreate(NEW_REFORM));
    await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));

    // Then
    expect(queryClient.getQueryData(LIST_KEY)).toEqual([NEW_REFORM, ...SAVED_REFORMS]);
    expect(queryClient.getQueryData(otherSessionKey)).toEqual(SAVED_REFORMS);
  });
});
