import type { QueryClient } from '@tanstack/react-query';
import { cleanup, render, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import type { UserSavedItems } from '@/api/v2AdminUserSavedItems';
import { formatAdminDate } from '@/components/admin/adminUserFormat';
import AdminUsersPage from '@/pages/flagship/AdminUsers.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  ALAN,
  answerAdminApi,
  answerAsDemotedAdmin,
  GRACE,
  holdRequests,
  sentRequests,
} from '@/tests/fixtures/api/v2AdminUserMocks';
import {
  answerPolicyReads,
  answerSavedItems,
  GRACE_SAVED_ITEMS,
  GRACE_V2_POLICY,
  REPORT_LAST_RUN_AT,
  SAVED_ITEM_IDS,
  SAVED_ITEM_NAMES,
  SAVED_POLICY_PARAMETER,
  SAVED_TARGET_IDS,
  savedPolicy,
  savedReport,
} from '@/tests/fixtures/api/v2AdminUserSavedItemsMocks';
import { errorResponse, TIMESTAMPS } from '@/tests/fixtures/api/v2UserMocks';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import { seedMetadataError } from '@/tests/fixtures/hooks/useFlagshipMetadataStatusMocks';
import {
  createProductionLikeQueryClient,
  createTestQueryClient,
  forgetWindowFocus,
  letPendingWorkRun,
  reconnect,
  returnToWindow,
  UserSessionProviders,
} from '@/tests/fixtures/hooks/useMeMocks';
import { signedInAuthValue } from '@/tests/fixtures/libs/auth/authMocks';

const fetchMock = vi.fn();

const SHOW_SAVED_ITEMS = 'Show saved items';
const SERVER_ERROR_MESSAGE = 'Saved work is temporarily unavailable.';

/** The saved-items route's path for `userId`. */
function savedItemsPath(userId: string): string {
  return `/v2/admin/users/${userId}/saved-items`;
}

function savedItemsReads(userId: string): string[] {
  return sentRequests(fetchMock).filter((request) => request === `GET ${savedItemsPath(userId)}`);
}

/**
 * Renders the admin page over the fake Public API, Grace's saved items
 * included, and opens `email`'s details from the list of users.
 */
async function openUserDetails(
  email: string,
  queryClient: QueryClient = createTestQueryClient(),
  savedItemsByUserId?: Readonly<Record<string, UserSavedItems>>
) {
  const user = userEvent.setup();
  const apiState = answerAdminApi(fetchMock);
  answerSavedItems(fetchMock, apiState, savedItemsByUserId);
  render(
    <UserSessionProviders
      queryClient={queryClient}
      session={{ auth: signedInAuthValue(), countryId: 'us' }}
    >
      <AdminUsersPage />
    </UserSessionProviders>
  );
  await user.click(await screen.findByRole('button', { name: email }));
  await screen.findByRole('radiogroup', { name: 'User type' });
  return { user, apiState };
}

function savedItemsSection(): HTMLElement {
  return screen.getByRole('region', { name: 'Saved items' });
}

/** Each body row of the table named `tableName`, as the text of its cells. */
function rowsOf(tableName: string): string[][] {
  const table = screen.getByRole('table', { name: tableName });
  return within(table)
    .getAllByRole('row')
    .slice(1)
    .map((row) =>
      within(row)
        .getAllByRole('cell')
        .map((cell) => cell.textContent ?? '')
    );
}

/** Answers every later read of `userId`'s saved items with `status`, until the test answers otherwise. */
function failSavedItemsReads(userId: string, status: number, message: string) {
  const answerAsTheApi = fetchMock.getMockImplementation()!;
  fetchMock.mockImplementation(async (url: string, init: RequestInit) =>
    publicApiPathOf(url) === savedItemsPath(userId)
      ? errorResponse(status, message)
      : answerAsTheApi(url, init)
  );
  return { answerAsTheApi };
}

/** Lets queued work run several times over, long enough for immediate retries to finish. */
async function letRetriesRun() {
  for (let round = 0; round < 10; round += 1) {
    await letPendingWorkRun();
  }
}

const SAVED_DATE = formatAdminDate(TIMESTAMPS.CREATED, 'us');

/** What a link that opens a new tab adds to its text, for screen readers. */
const NEW_TAB_NOTE = ' (opens in a new tab)';

/** A v1 policy ID no policy has. */
const UNKNOWN_V1_POLICY_ID = 404404;

/** A parameter path the model no longer has. */
const REMOVED_PARAMETER = 'gov.irs.credits.ctc.removed';

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  cleanup();
  forgetWindowFocus();
  vi.unstubAllGlobals();
});

describe('AdminUserSavedItems', () => {
  test('given an admin opens a user then their saved items are not read until the admin asks', async () => {
    // When
    await openUserDetails(GRACE.email!);

    // Then
    expect(
      within(savedItemsSection()).getByRole('button', { name: SHOW_SAVED_ITEMS })
    ).toBeInTheDocument();
    expect(savedItemsReads(GRACE.id)).toEqual([]);
  });

  test("given the admin asks then the user's saved items are read once", async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    expect(savedItemsReads(GRACE.id)).toHaveLength(1);
  });

  test('given the admin asks then focus moves to the saved items heading, since the button is gone', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));

    // Then
    expect(screen.getByRole('heading', { name: 'Saved items' })).toHaveFocus();
  });

  test('given saved policies then each shows its name, country and date saved, without the policy ID', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    expect(rowsOf('Saved policies')).toEqual([
      [SAVED_ITEM_NAMES.US_POLICY, 'United States', SAVED_DATE],
      ['No name', 'United Kingdom', SAVED_DATE],
    ]);
  });

  test('given saved households, simulations and reports then each kind lists its own', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    expect({
      households: rowsOf('Saved households'),
      simulations: rowsOf('Saved simulations'),
      reports: rowsOf('Saved reports'),
    }).toEqual({
      households: [
        [
          SAVED_ITEM_NAMES.HOUSEHOLD,
          'United States',
          `${SAVED_TARGET_IDS.V1_HOUSEHOLD} (v1)`,
          SAVED_DATE,
        ],
      ],
      simulations: [
        [SAVED_ITEM_NAMES.SIMULATION, 'United States', SAVED_TARGET_IDS.V2_SIMULATION, SAVED_DATE],
      ],
      reports: [
        [
          `${SAVED_ITEM_NAMES.REPORT}${NEW_TAB_NOTE}`,
          'United States',
          SAVED_DATE,
          formatAdminDate(REPORT_LAST_RUN_AT, 'us'),
        ],
      ],
    });
  });

  test('given saved items then each kind is headed with how many there are', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    const headings = within(savedItemsSection())
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(['Policies (2)', 'Households (1)', 'Simulations (1)', 'Reports (1)']);
  });

  test('given a user who saved nothing then each kind says none are saved', async () => {
    // Given
    const { user } = await openUserDetails(ALAN.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));

    // Then
    await screen.findByText('No saved policies.');
    expect(
      within(savedItemsSection())
        .getAllByText(/^No saved /)
        .map((message) => message.textContent)
    ).toEqual([
      'No saved policies.',
      'No saved households.',
      'No saved simulations.',
      'No saved reports.',
    ]);
  });

  test('given the saved items are shown then its only controls open the policies and the report, and none changes them', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    const section = savedItemsSection();
    const controls = ['button', 'link', 'textbox', 'checkbox', 'combobox', 'menuitem'].flatMap(
      (role) =>
        within(section)
          .queryAllByRole(role)
          .map((control) => `${role}: ${control.textContent}`)
    );
    expect(controls).toEqual([
      `button: ${SAVED_ITEM_NAMES.US_POLICY}`,
      'button: No name',
      `link: ${SAVED_ITEM_NAMES.REPORT}${NEW_TAB_NOTE}`,
    ]);
  });

  test('given the saved items are shown then only reads were sent', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    const methods = new Set(sentRequests(fetchMock).map((request) => request.split(' ')[0]));
    expect([...methods]).toEqual(['GET']);
  });

  test('given the saved items have not answered then the section says they are loading', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const { answerHeldRequests } = holdRequests(
      fetchMock,
      (method, path) => method === 'GET' && path === savedItemsPath(GRACE.id)
    );

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));

    // Then
    expect(
      await within(savedItemsSection()).findByText('Loading the saved items…')
    ).toBeInTheDocument();
    answerHeldRequests();
  });

  test('given the saved items cannot be read then trying again shows them', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const { answerAsTheApi } = failSavedItemsReads(GRACE.id, 503, SERVER_ERROR_MESSAGE);
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    expect(
      await screen.findByText(`We could not load the saved items: ${SERVER_ERROR_MESSAGE}`)
    ).toHaveAttribute('role', 'alert');
    fetchMock.mockImplementation(answerAsTheApi);

    // When
    await user.click(within(savedItemsSection()).getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByRole('table', { name: 'Saved policies' })).toBeInTheDocument();
  });

  test('given trying again shows the saved items then focus moves to the saved items heading, since the button is gone', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    const { answerAsTheApi } = failSavedItemsReads(GRACE.id, 503, SERVER_ERROR_MESSAGE);
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByText(`We could not load the saved items: ${SERVER_ERROR_MESSAGE}`);
    fetchMock.mockImplementation(answerAsTheApi);

    // When
    await user.click(within(savedItemsSection()).getByRole('button', { name: 'Try again' }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    expect(screen.getByRole('heading', { name: 'Saved items' })).toHaveFocus();
  });

  test('given the saved items fail once with a server error then they are read again and show', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    const answerAsTheApi = fetchMock.getMockImplementation()!;
    let failuresLeft = 1;
    fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
      if (publicApiPathOf(url) === savedItemsPath(GRACE.id) && failuresLeft > 0) {
        failuresLeft -= 1;
        return errorResponse(503, SERVER_ERROR_MESSAGE);
      }
      return answerAsTheApi(url, init);
    });

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));

    // Then
    expect(await screen.findByRole('table', { name: 'Saved policies' })).toBeInTheDocument();
  });

  test('given the signed-in admin was demoted then the read is not retried and the page becomes not found', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    answerAsDemotedAdmin(fetchMock);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await letRetriesRun();

    // Then
    expect(await screen.findByRole('heading', { name: 'Page not found' })).toBeInTheDocument();
    expect(savedItemsReads(GRACE.id)).toHaveLength(1);
  });

  test('given the user was deleted then the saved items are not retried and the details say the user no longer exists', async () => {
    // Given
    const { user, apiState } = await openUserDetails(
      GRACE.email!,
      createProductionLikeQueryClient()
    );
    apiState.users.splice(
      apiState.users.findIndex((candidate) => candidate.id === GRACE.id),
      1
    );

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await letRetriesRun();

    // Then
    expect(await screen.findByText('This user no longer exists.')).toBeInTheDocument();
    expect(savedItemsReads(GRACE.id)).toHaveLength(1);
  });

  test('given the production cache defaults then returning to the window does not read the saved items again', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // When
    await returnToWindow();
    await letPendingWorkRun();

    // Then
    expect(savedItemsReads(GRACE.id)).toHaveLength(1);
  });

  test('given the production cache defaults then reconnecting does not read the saved items again', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // When
    await reconnect();
    await letPendingWorkRun();

    // Then
    expect(savedItemsReads(GRACE.id)).toHaveLength(1);
  });

  test("given the admin opens another user then that user's saved items wait to be asked for", async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // When
    await user.click(screen.getByRole('button', { name: ALAN.email! }));
    await screen.findByText(ALAN.id);

    // Then
    expect(screen.queryByRole('table', { name: 'Saved policies' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: SHOW_SAVED_ITEMS })).toBeInTheDocument();
    expect(savedItemsReads(ALAN.id)).toEqual([]);
  });

  test('given the admin opens the same user again and asks then the saved items are read again', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });
    await user.click(screen.getByRole('button', { name: ALAN.email! }));
    await screen.findByText(ALAN.id);
    await user.click(screen.getByRole('button', { name: GRACE.email! }));
    await screen.findByText(GRACE.id);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));

    // Then
    await waitFor(() => expect(savedItemsReads(GRACE.id)).toHaveLength(2));
  });

  test('given the saved items were shown before then showing them again waits for the new read', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });
    await user.click(screen.getByRole('button', { name: ALAN.email! }));
    await screen.findByText(ALAN.id);
    await user.click(screen.getByRole('button', { name: GRACE.email! }));
    await screen.findByText(GRACE.id);
    const { answerHeldRequests } = holdRequests(
      fetchMock,
      (method, path) => method === 'GET' && path === savedItemsPath(GRACE.id)
    );

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await letPendingWorkRun();

    // Then
    expect(screen.queryByRole('table', { name: 'Saved policies' })).not.toBeInTheDocument();
    expect(screen.getByText('Loading the saved items…')).toBeInTheDocument();
    answerHeldRequests();
  });

  test('given the saved items were shown before then the earlier items stay hidden while a new read fails, and its error shows', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });
    await user.click(screen.getByRole('button', { name: ALAN.email! }));
    await screen.findByText(ALAN.id);
    await user.click(screen.getByRole('button', { name: GRACE.email! }));
    await screen.findByText(GRACE.id);
    failSavedItemsReads(GRACE.id, 503, SERVER_ERROR_MESSAGE);
    const { answerHeldRequests } = holdRequests(
      fetchMock,
      (method, path) => method === 'GET' && path === savedItemsPath(GRACE.id)
    );

    let earlierItemsShown = false;

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await letPendingWorkRun();
    // Answers the held read and each retry until the error shows, noting
    // whether the earlier items ever showed in between.
    await waitFor(() => {
      earlierItemsShown ||= screen.queryByRole('table', { name: 'Saved policies' }) !== null;
      answerHeldRequests();
      expect(
        screen.getByText(`We could not load the saved items: ${SERVER_ERROR_MESSAGE}`)
      ).toBeInTheDocument();
    });

    // Then
    expect(earlierItemsShown).toBe(false);
  });

  test('given the admin leaves a user while its saved items are read then showing them again joins that read', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!, createProductionLikeQueryClient());
    const { answerHeldRequests } = holdRequests(
      fetchMock,
      (method, path) => method === 'GET' && path === savedItemsPath(GRACE.id)
    );
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await user.click(screen.getByRole('button', { name: ALAN.email! }));
    await screen.findByText(ALAN.id);
    await user.click(screen.getByRole('button', { name: GRACE.email! }));
    await screen.findByText(GRACE.id);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    answerHeldRequests();
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    expect(savedItemsReads(GRACE.id)).toHaveLength(1);
  });
});

describe('AdminUserSavedItems policies and reports', () => {
  /** The panel's parameter rows, as the text of their cells. */
  function parameterRowsIn(panel: HTMLElement): string[][] {
    const table = within(panel).getByRole('table', { name: 'Parameters' });
    return within(table)
      .getAllByRole('row')
      .slice(1)
      .map((row) =>
        within(row)
          .getAllByRole('cell')
          .map((cell) => cell.textContent ?? '')
      );
  }

  /**
   * Shows `email`'s saved items (`savedItems` in place of Grace's), with
   * the policy reads answered; returns the policy paths read.
   */
  async function showSavedItems(
    email: string,
    {
      savedItems,
      queryClient = createTestQueryClient(),
    }: { savedItems?: UserSavedItems; queryClient?: QueryClient } = {}
  ) {
    const { user } = await openUserDetails(
      email,
      queryClient,
      savedItems ? { [GRACE.id]: savedItems } : undefined
    );
    const policyReads = answerPolicyReads(fetchMock);
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });
    return { user, policyReads };
  }

  async function openPolicy(user: ReturnType<typeof userEvent.setup>, name: string) {
    const savedPolicies = screen.getByRole('table', { name: 'Saved policies' });
    await user.click(within(savedPolicies).getByRole('button', { name }));
    return screen.findByRole('dialog', { name });
  }

  beforeEach(() => {
    seedDeductionMetadata();
  });

  afterEach(() => {
    store.dispatch(clearMetadata());
  });

  test("given a saved report then its name opens the report's page in a new tab", async () => {
    // When
    await showSavedItems(GRACE.email!);

    // Then
    const link = within(screen.getByRole('table', { name: 'Saved reports' })).getByRole('link', {
      name: `${SAVED_ITEM_NAMES.REPORT}${NEW_TAB_NOTE}`,
    });
    expect([
      link.getAttribute('href'),
      link.getAttribute('target'),
      link.getAttribute('rel'),
    ]).toEqual([`/us/report/${SAVED_ITEM_IDS.REPORT}`, '_blank', 'noopener noreferrer']);
  });

  test("given a report saved in another country then its link opens it in that country's site", async () => {
    // Given
    const ukReport = savedReport({ country_id: 'uk', name: SAVED_ITEM_NAMES.REPORT });

    // When
    await showSavedItems(GRACE.email!, {
      savedItems: { ...GRACE_SAVED_ITEMS, reports: [ukReport] },
    });

    // Then
    const link = within(screen.getByRole('table', { name: 'Saved reports' })).getByRole('link');
    expect(link.getAttribute('href')).toBe(`/uk/report/${SAVED_ITEM_IDS.REPORT}`);
  });

  test('given the admin opens a policy then a panel shows its parameters as the reforms page does', async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(panel).findByRole('table', { name: 'Parameters' });

    // Then
    expect({
      headings: within(panel)
        .getAllByRole('columnheader')
        .map((heading) => heading.textContent),
      rows: parameterRowsIn(panel),
    }).toEqual({
      headings: ['Parameter', 'Current law', 'Reform', 'From'],
      rows: [
        [
          SAVED_POLICY_PARAMETER.LABEL,
          SAVED_POLICY_PARAMETER.CURRENT_LAW_2026,
          '$3,600',
          'from 2026',
        ],
      ],
    });
  });

  test('given the admin opens a policy then the panel says how many provisions it has and when it was saved', async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    expect(await within(panel).findByText('1 provision · saved Oct 12, 2026')).toBeInTheDocument();
  });

  test('given a policy saved before the detailed-save API then the panel reads its v1 policy', async () => {
    // Given
    const v1Policy = savedPolicy({
      name: SAVED_ITEM_NAMES.US_POLICY,
      legacy_policy_id: SAVED_TARGET_IDS.V1_POLICY,
    });
    const { user, policyReads } = await showSavedItems(GRACE.email!, {
      savedItems: { ...GRACE_SAVED_ITEMS, policies: [v1Policy] },
    });

    // When
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(panel).findByRole('table', { name: 'Parameters' });

    // Then
    expect({ reads: policyReads, rows: parameterRowsIn(panel) }).toEqual({
      reads: [`/us/policy/${SAVED_TARGET_IDS.V1_POLICY}`],
      rows: [
        [
          SAVED_POLICY_PARAMETER.LABEL,
          SAVED_POLICY_PARAMETER.CURRENT_LAW_2026,
          '$3,000',
          '2026 only',
        ],
      ],
    });
  });

  test("given a policy saved in another country then the panel links to that country's admin page and reads no policy", async () => {
    // Given
    const { user, policyReads } = await showSavedItems(GRACE.email!);

    // When
    const panel = await openPolicy(user, 'No name');

    // Then
    const link = within(panel).getByRole('link', {
      name: `Open the United Kingdom admin page${NEW_TAB_NOTE}`,
    });
    expect({
      href: link.getAttribute('href'),
      target: link.getAttribute('target'),
      reads: policyReads,
    }).toEqual({ href: '/uk/admin/users', target: '_blank', reads: [] });
  });

  test('given the policy cannot be read then the panel says so, and trying again shows it', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    answerPolicyReads(fetchMock, { v2: {}, v1: {} });
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'We could not load this policy'
    );
    answerPolicyReads(fetchMock);

    // When
    await user.click(within(panel).getByRole('button', { name: 'Try again' }));

    // Then
    expect(await within(panel).findByRole('table', { name: 'Parameters' })).toBeInTheDocument();
  });

  test("given the panel is open then closing it returns focus to the policy's name", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // When
    await user.click(within(panel).getByRole('button', { name: 'Close' }));

    // Then
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      within(screen.getByRole('table', { name: 'Saved policies' })).getByRole('button', {
        name: SAVED_ITEM_NAMES.US_POLICY,
      })
    ).toHaveFocus();
  });

  test('given the admin opens policies then only reads were sent', async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);
    const usPanel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(usPanel).findByRole('table', { name: 'Parameters' });
    await user.click(within(usPanel).getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    // When
    await openPolicy(user, 'No name');

    // Then
    const methods = new Set(sentRequests(fetchMock).map((request) => request.split(' ')[0]));
    expect([...methods]).toEqual(['GET']);
  });
  test('given a v1 policy that cannot be read then the panel says so after one read', async () => {
    // Given
    const unreadablePolicy = savedPolicy({
      name: SAVED_ITEM_NAMES.US_POLICY,
      legacy_policy_id: UNKNOWN_V1_POLICY_ID,
    });
    const { user, policyReads } = await showSavedItems(GRACE.email!, {
      savedItems: { ...GRACE_SAVED_ITEMS, policies: [unreadablePolicy] },
      queryClient: createProductionLikeQueryClient(),
    });

    // When
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'We could not load this policy'
    );
    expect(policyReads).toEqual([`/us/policy/${UNKNOWN_V1_POLICY_ID}`]);
  });

  test('given a saved policy that points to no policy then the panel says so and reads nothing', async () => {
    // Given
    const pointsNowhere = savedPolicy({ name: SAVED_ITEM_NAMES.US_POLICY });
    const { user, policyReads } = await showSavedItems(GRACE.email!, {
      savedItems: { ...GRACE_SAVED_ITEMS, policies: [pointsNowhere] },
      queryClient: createProductionLikeQueryClient(),
    });

    // When
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'This saved policy points to no policy.'
    );
    expect(policyReads).toEqual([]);
  });

  test('given a policy that sets a parameter the model no longer has then the panel names it, as the reforms page does', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    answerPolicyReads(fetchMock, {
      v2: {
        [GRACE_V2_POLICY.id]: { ...GRACE_V2_POLICY, missing_parameters: [REMOVED_PARAMETER] },
      },
      v1: {},
    });
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // When
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(panel).findByRole('table', { name: 'Parameters' });

    // Then
    expect(within(panel).getByRole('alert')).toHaveTextContent(
      `This policy cannot be run, because it changes a parameter that PolicyEngine’s model no longer has:${REMOVED_PARAMETER}`
    );
  });

  test("given the parameters' metadata cannot load then the panel offers to load it again", async () => {
    // Given
    store.dispatch(clearMetadata());
    seedMetadataError();
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    expect(await within(panel).findByText('Could not load the parameters')).toBeInTheDocument();
    expect(within(panel).getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });

  test("given the panel is open then Escape closes it and returns focus to the policy's name", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);
    const panel = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(panel).findByRole('table', { name: 'Parameters' });

    // When
    await user.keyboard('{Escape}');

    // Then
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      within(screen.getByRole('table', { name: 'Saved policies' })).getByRole('button', {
        name: SAVED_ITEM_NAMES.US_POLICY,
      })
    ).toHaveFocus();
  });
});
