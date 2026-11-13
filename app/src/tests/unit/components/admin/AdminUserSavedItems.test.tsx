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
  answerHouseholdReads,
  answerPolicyReads,
  answerReportReads,
  answerSavedItems,
  answerSimulationReads,
  GRACE_SAVED_ITEMS,
  GRACE_V2_POLICY,
  HOUSEHOLD_VARIABLES,
  REPORT_LAST_RUN_AT,
  SAVED_ITEM_IDS,
  SAVED_ITEM_NAMES,
  SAVED_POLICY_PARAMETER,
  SAVED_TARGET_IDS,
  savedHousehold,
  savedPolicy,
  savedReport,
  UK_V1_HOUSEHOLD_JSON,
  UK_V1_POLICY_JSON,
  v1Report,
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

  test('given saved households and reports then each shows its name, country and date saved, without IDs', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    expect({
      households: rowsOf('Saved households'),
      reports: rowsOf('Saved reports'),
    }).toEqual({
      households: [[SAVED_ITEM_NAMES.HOUSEHOLD, 'United States', SAVED_DATE]],
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

  test('given saved items then policies, households and reports are each headed with how many there are, and simulations are not shown', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);

    // When
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });

    // Then
    const headings = within(savedItemsSection())
      .getAllByRole('heading', { level: 4 })
      .map((heading) => heading.textContent);
    expect(headings).toEqual(['Policies (2)', 'Households (1)', 'Reports (1)']);
  });

  test('given a user who saved nothing then policies, households and reports each say none are saved', async () => {
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
    ).toEqual(['No saved policies.', 'No saved households.', 'No saved reports.']);
  });

  test('given the saved items are shown then its only controls open the policies, the household and the report, and none changes them', async () => {
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
      `button: ${SAVED_ITEM_NAMES.HOUSEHOLD}`,
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
  /**
   * A saved report Grace ran from one of her policies: by default her US
   * policy, with the default saved report's name and v1 report.
   */
  function reportFromPolicy(overrides: Parameters<typeof savedReport>[0] = {}) {
    return savedReport({
      name: SAVED_ITEM_NAMES.REPORT,
      legacy_report_id: SAVED_TARGET_IDS.V1_REPORT,
      user_policy_id: SAVED_ITEM_IDS.US_POLICY,
      last_run_at: REPORT_LAST_RUN_AT,
      ...overrides,
    });
  }

  /** The dialog's list of the reports run from the policy. */
  function reportsIn(dialog: HTMLElement): HTMLElement {
    return within(dialog).getByRole('region', { name: 'Reports' });
  }

  /** Each report row's text, in the order the list shows them. */
  function reportRowsIn(dialog: HTMLElement): string[] {
    return Array.from(reportsIn(dialog).querySelectorAll('[data-report-row]')).map(
      (row) => row.textContent ?? ''
    );
  }

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
      policies,
      households,
      reports,
      simulations,
    }: {
      savedItems?: UserSavedItems;
      queryClient?: QueryClient;
      policies?: Parameters<typeof answerPolicyReads>[1];
      households?: Parameters<typeof answerHouseholdReads>[1];
      reports?: Parameters<typeof answerReportReads>[1];
      simulations?: Parameters<typeof answerSimulationReads>[1];
    } = {}
  ) {
    const { user } = await openUserDetails(
      email,
      queryClient,
      savedItems ? { [GRACE.id]: savedItems } : undefined
    );
    const policyReads = answerPolicyReads(fetchMock, policies);
    const householdReads = answerHouseholdReads(fetchMock, households);
    const reportReads = answerReportReads(fetchMock, reports);
    const simulationReads = answerSimulationReads(fetchMock, simulations);
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved policies' });
    return { user, policyReads, householdReads, reportReads, simulationReads };
  }

  async function openHousehold(user: ReturnType<typeof userEvent.setup>, name: string) {
    const savedHouseholds = screen.getByRole('table', { name: 'Saved households' });
    await user.click(within(savedHouseholds).getByRole('button', { name }));
    return screen.findByRole('dialog', { name });
  }

  /** Each table in the household's panel, by name, as the text of its rows' cells. */
  function householdTablesIn(panel: HTMLElement): Record<string, string[][]> {
    return Object.fromEntries(
      within(panel)
        .getAllByRole('table')
        .map((table) => [
          table.getAttribute('aria-label'),
          within(table)
            .getAllByRole('row')
            .slice(1)
            .map((row) =>
              within(row)
                .getAllByRole('cell')
                .map((cell) => cell.textContent ?? '')
            ),
        ])
    );
  }

  /** Grace's saved items, with `household` as her only saved household. */
  function savedItemsWithHousehold(household: ReturnType<typeof savedHousehold>): UserSavedItems {
    return { ...GRACE_SAVED_ITEMS, households: [household] };
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
    // Unmounted first: clearing the metadata under a mounted panel would
    // render it again after the test.
    cleanup();
    store.dispatch(clearMetadata());
    vi.unstubAllEnvs();
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

  test("given a report saved in another country that has the v3 interface then its link opens it in that country's site", async () => {
    // Given
    vi.stubEnv('VITE_FLAGSHIP_SHELL_UK', 'true');
    const ukReport = savedReport({ country_id: 'uk', name: SAVED_ITEM_NAMES.REPORT });

    // When
    await showSavedItems(GRACE.email!, {
      savedItems: { ...GRACE_SAVED_ITEMS, reports: [ukReport] },
    });

    // Then
    const link = within(screen.getByRole('table', { name: 'Saved reports' })).getByRole('link');
    expect(link.getAttribute('href')).toBe(`/uk/report/${SAVED_ITEM_IDS.REPORT}`);
  });

  test('given a report saved in a country still on the older interface then its name is not a link, and the row says why', async () => {
    // Given
    const ukReport = savedReport({ country_id: 'uk', name: SAVED_ITEM_NAMES.REPORT });

    // When
    await showSavedItems(GRACE.email!, {
      savedItems: { ...GRACE_SAVED_ITEMS, reports: [ukReport] },
    });

    // Then
    const savedReports = screen.getByRole('table', { name: 'Saved reports' });
    expect({
      links: within(savedReports).queryAllByRole('link'),
      nameCell: rowsOf('Saved reports')[0][0],
    }).toEqual({
      links: [],
      nameCell: `${SAVED_ITEM_NAMES.REPORT}Can't be opened while the United Kingdom uses the older interface.`,
    });
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

  test('given a policy saved in another country then the panel shows its parameters by their paths, without current law, and says why', async () => {
    // Given
    // It also sets a parameter whose path the page's US metadata has too.
    const { user, policyReads } = await showSavedItems(GRACE.email!, {
      policies: {
        v2: {},
        v1: {
          [`uk/${SAVED_TARGET_IDS.V1_POLICY}`]: {
            ...UK_V1_POLICY_JSON,
            [SAVED_POLICY_PARAMETER.NAME]: { '2026-01-01.2100-12-31': 3000 },
          },
        },
      },
    });

    // When
    const panel = await openPolicy(user, 'No name');
    await within(panel).findByRole('table', { name: 'Parameters' });

    // Then
    expect({
      note: within(panel).getByText(/^This policy was saved in the United Kingdom\./).textContent,
      rows: parameterRowsIn(panel),
      reads: policyReads,
    }).toEqual({
      note: 'This policy was saved in the United Kingdom. This page loads the United States model only, so its parameters show by their paths, without current law or units.',
      rows: [
        ['Gov.hmrc.income_tax.allowances.personal_allowance.amount', '—', '15000', 'from 2026'],
        [
          `${SAVED_POLICY_PARAMETER.NAME[0].toUpperCase()}${SAVED_POLICY_PARAMETER.NAME.slice(1)}`,
          '—',
          '3000',
          'from 2026',
        ],
      ],
      reads: [`/uk/policy/${SAVED_TARGET_IDS.V1_POLICY}`],
    });
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
  test("given the admin opens a policy then it opens in a modal dialog, headed with the policy's name as the reforms page heads a saved reform", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    expect({
      kind: dialog.getAttribute('data-slot'),
      heading: within(dialog).getByRole('heading', { level: 1 }).textContent,
    }).toEqual({ kind: 'dialog-content', heading: SAVED_ITEM_NAMES.US_POLICY });
  });

  test('given reports run from a policy then the dialog lists them as the reforms page does, newest first, each opening its page in a new tab', async () => {
    // Given
    const OLDER_REPORT_ID = 'a4000000-0000-4000-8000-000000000002';
    const OLDER_V1_REPORT_ID = 616;
    const { user } = await showSavedItems(GRACE.email!, {
      savedItems: {
        ...GRACE_SAVED_ITEMS,
        reports: [
          reportFromPolicy({
            id: OLDER_REPORT_ID,
            legacy_report_id: OLDER_V1_REPORT_ID,
            last_run_at: null,
          }),
          reportFromPolicy(),
        ],
      },
      reports: {
        [`us/${SAVED_TARGET_IDS.V1_REPORT}`]: v1Report(),
        [`us/${OLDER_V1_REPORT_ID}`]: v1Report({
          id: OLDER_V1_REPORT_ID,
          year: '2027',
          status: 'pending',
          finished_at: null,
        }),
      },
    });

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(reportsIn(dialog)).findByText('Done');

    // Then
    expect({
      rows: reportRowsIn(dialog),
      links: within(reportsIn(dialog))
        .getAllByRole('link')
        .map((link) => [link.getAttribute('href'), link.getAttribute('target')]),
    }).toEqual({
      rows: [
        `2026 reportResults from Oct 14, 2026DoneView results${NEW_TAB_NOTE}`,
        `2027 reportRun Oct 12, 2026Open${NEW_TAB_NOTE}`,
      ],
      links: [
        [`/us/report/${SAVED_ITEM_IDS.REPORT}`, '_blank'],
        [`/us/report/${OLDER_REPORT_ID}`, '_blank'],
      ],
    });
  });

  test("given a report compared with another of the user's saved policies then its row names that policy", async () => {
    // Given
    const COMPARISON_POLICY_ID = 'a1000000-0000-4000-8000-000000000003';
    const COMPARISON_POLICY_NAME = 'Child Tax Credit at $3,000';
    const { user } = await showSavedItems(GRACE.email!, {
      savedItems: {
        ...GRACE_SAVED_ITEMS,
        policies: [
          ...GRACE_SAVED_ITEMS.policies,
          savedPolicy({ id: COMPARISON_POLICY_ID, name: COMPARISON_POLICY_NAME }),
        ],
        reports: [reportFromPolicy({ baseline_user_policy_id: COMPARISON_POLICY_ID })],
      },
    });

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(reportsIn(dialog)).findByText('Done');

    // Then
    expect(
      within(reportsIn(dialog)).getByText(`Compared with ${COMPARISON_POLICY_NAME}`)
    ).toBeInTheDocument();
  });

  test("given a report run from another of the user's policies then the policy's dialog leaves it out", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!, {
      savedItems: {
        ...GRACE_SAVED_ITEMS,
        reports: [reportFromPolicy({ user_policy_id: SAVED_ITEM_IDS.UK_POLICY })],
      },
    });

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    expect(reportsIn(dialog).textContent).toBe('ReportsNo reports yet.');
  });

  test('given a policy no report was run from then the dialog says it has no reports', async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    expect(reportsIn(dialog).textContent).toBe('ReportsNo reports yet.');
  });

  test('given a policy saved in a country still on the older interface then its reports show without links, and the dialog says why', async () => {
    // Given
    const UK_V1_REPORT_ID = 617;
    const { user } = await showSavedItems(GRACE.email!, {
      savedItems: {
        ...GRACE_SAVED_ITEMS,
        reports: [
          reportFromPolicy({
            country_id: 'uk',
            legacy_report_id: UK_V1_REPORT_ID,
            user_policy_id: SAVED_ITEM_IDS.UK_POLICY,
          }),
        ],
      },
      policies: {
        v2: {},
        v1: { [`uk/${SAVED_TARGET_IDS.V1_POLICY}`]: UK_V1_POLICY_JSON },
      },
      reports: {
        [`uk/${UK_V1_REPORT_ID}`]: v1Report({ id: UK_V1_REPORT_ID, country_id: 'uk' }),
      },
    });

    // When
    const dialog = await openPolicy(user, 'No name');
    await within(reportsIn(dialog)).findByText('Done');

    // Then
    expect({
      links: within(reportsIn(dialog)).queryAllByRole('link'),
      note: within(reportsIn(dialog)).getByText(/^These reports can't be opened/).textContent,
    }).toEqual({
      links: [],
      note: "These reports can't be opened while the United Kingdom uses the older interface.",
    });
  });

  test('given a report run against current law from a policy saved in another country then its row says nothing about what it was compared with', async () => {
    // Given
    // The UK's current law is policy 1; the page's US metadata knows only
    // the US's, policy 2.
    const UK_V1_REPORT_ID = 617;
    const UK_BASELINE_SIMULATION_ID = '7101';
    const { user } = await showSavedItems(GRACE.email!, {
      savedItems: {
        ...GRACE_SAVED_ITEMS,
        reports: [
          reportFromPolicy({
            country_id: 'uk',
            legacy_report_id: UK_V1_REPORT_ID,
            user_policy_id: SAVED_ITEM_IDS.UK_POLICY,
          }),
        ],
      },
      policies: {
        v2: {},
        v1: { [`uk/${SAVED_TARGET_IDS.V1_POLICY}`]: UK_V1_POLICY_JSON },
      },
      reports: {
        [`uk/${UK_V1_REPORT_ID}`]: v1Report({
          id: UK_V1_REPORT_ID,
          country_id: 'uk',
          simulation_1_id: UK_BASELINE_SIMULATION_ID,
        }),
      },
      simulations: { [`uk/${UK_BASELINE_SIMULATION_ID}`]: 1 },
    });

    // When
    const dialog = await openPolicy(user, 'No name');
    await within(reportsIn(dialog)).findByText('Done');
    await letRetriesRun();

    // Then
    expect(within(reportsIn(dialog)).queryByText(/^Compared with/)).toBeNull();
  });

  test("given a report compared with one of the user's unnamed saved policies then its row calls that policy No name, as the saved policies table does", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!, {
      savedItems: {
        ...GRACE_SAVED_ITEMS,
        reports: [reportFromPolicy({ baseline_user_policy_id: SAVED_ITEM_IDS.UK_POLICY })],
      },
    });

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(reportsIn(dialog)).findByText('Done');

    // Then
    expect(within(reportsIn(dialog)).getByText(/^Compared with/).textContent).toBe(
      'Compared with No name'
    );
  });

  test('given a policy with reports is open then only reads were sent', async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!, {
      savedItems: { ...GRACE_SAVED_ITEMS, reports: [reportFromPolicy()] },
    });

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);
    await within(reportsIn(dialog)).findByText('Done');
    await letRetriesRun();

    // Then
    const methods = new Set(sentRequests(fetchMock).map((request) => request.split(' ')[0]));
    expect([...methods]).toEqual(['GET']);
  });

  test("given the policy's dialog opens then its content takes keyboard focus, so it scrolls without a mouse", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const dialog = await openPolicy(user, SAVED_ITEM_NAMES.US_POLICY);

    // Then
    const content = within(dialog).getByRole('region', { name: 'Saved policy' });
    await waitFor(() => expect(content).toHaveFocus());
    expect(content.getAttribute('tabindex')).toBe('0');
  });

  test("given the household's dialog opens then its content takes keyboard focus, so it scrolls without a mouse", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const dialog = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);

    // Then
    const content = within(dialog).getByRole('region', { name: 'Saved household' });
    await waitFor(() => expect(content).toHaveFocus());
    expect(content.getAttribute('tabindex')).toBe('0');
  });

  test("given the admin opens a household then it opens in a modal dialog, headed with the household's name", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const dialog = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);

    // Then
    expect({
      kind: dialog.getAttribute('data-slot'),
      heading: within(dialog).getByRole('heading', { level: 1 }).textContent,
    }).toEqual({ kind: 'dialog-content', heading: SAVED_ITEM_NAMES.HOUSEHOLD });
  });

  test('given the admin opens a household then a panel shows the values set for each person and for the household', async () => {
    // Given
    store.dispatch(clearMetadata());
    seedDeductionMetadata({ variables: HOUSEHOLD_VARIABLES });
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);
    await within(panel).findByRole('table', { name: 'You' });

    // Then
    expect(householdTablesIn(panel)).toEqual({
      You: [
        ['Age', '40'],
        ['Employment income', '$50,000'],
      ],
      'Your partner': [
        ['Age', '38'],
        ['Employment income', '$30,000'],
      ],
      'Your first dependent': [['Age', '10']],
      'Your second dependent': [['Age', '7']],
      'Your household': [['State', 'California']],
      'Your tax unit': [['Childcare expenses', '$1,000']],
      'Your household (SPM unit)': [['Pre-subsidy childcare expenses', '$2,000']],
    });
  });

  test("given a household with values in several years then the panel shows its latest year's values", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!, {
      households: {
        [`us/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`]: {
          people: { you: { age: { 2025: 39, 2026: 40 } } },
          households: { 'your household': { members: ['you'] } },
        },
      },
    });

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);
    await within(panel).findByRole('table', { name: 'You' });

    // Then
    expect({
      description: within(panel).getByText(/^1 person/).textContent,
      tables: householdTablesIn(panel),
    }).toEqual({
      description: '1 person · 2026 · saved Oct 12, 2026',
      tables: { You: [['Age', '40']] },
    });
  });

  test("given a household whose groups have the app's generated keys then each group is named readably", async () => {
    // Given
    store.dispatch(clearMetadata());
    seedDeductionMetadata({ variables: HOUSEHOLD_VARIABLES });
    const { user } = await showSavedItems(GRACE.email!, {
      households: {
        [`us/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`]: {
          people: { you: { age: { 2026: 40 } } },
          tax_units: {
            taxUnit1: { members: ['you'], tax_unit_childcare_expenses: { 2026: 500 } },
          },
          households: { household1: { members: ['you'], state_name: { 2026: 'NY' } } },
        },
      },
    });

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);
    await within(panel).findByRole('table', { name: 'You' });

    // Then
    expect(householdTablesIn(panel)).toEqual({
      You: [['Age', '40']],
      'Household 1': [['State', 'New York']],
      'Tax unit 1': [['Childcare expenses', '$500']],
    });
  });

  test('given a household with no people then the panel says so', async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!, {
      households: { [`us/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`]: { people: {}, households: {} } },
    });

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);

    // Then
    expect(await within(panel).findByText('This household has no people.')).toBeInTheDocument();
  });

  test('given a household that cannot be read then the panel says so after one read', async () => {
    // Given
    const { user, householdReads } = await showSavedItems(GRACE.email!, {
      queryClient: createProductionLikeQueryClient(),
      households: {},
    });

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);

    // Then
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'We could not load this household'
    );
    expect(householdReads).toEqual([`/us/household/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`]);
  });

  test('given the admin opens a household then only reads were sent', async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);
    await within(panel).findByRole('table', { name: 'You' });

    // Then
    const methods = new Set(sentRequests(fetchMock).map((request) => request.split(' ')[0]));
    expect([...methods]).toEqual(['GET']);
  });

  test('given the admin opens a household then the panel says how many people it has, its year and when it was saved', async () => {
    // Given
    const { user, householdReads } = await showSavedItems(GRACE.email!);

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);

    // Then
    expect(
      await within(panel).findByText('4 people · 2026 · saved Oct 12, 2026')
    ).toBeInTheDocument();
    expect(householdReads).toEqual([`/us/household/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`]);
  });

  test("given a household saved in another country then the panel shows its inputs without this country's names and units, and says why", async () => {
    // Given
    store.dispatch(clearMetadata());
    seedDeductionMetadata({ variables: HOUSEHOLD_VARIABLES });
    const ukHousehold = savedHousehold({
      name: SAVED_ITEM_NAMES.HOUSEHOLD,
      country_id: 'uk',
      legacy_household_id: SAVED_TARGET_IDS.V1_HOUSEHOLD,
    });
    const { user, householdReads } = await showSavedItems(GRACE.email!, {
      savedItems: savedItemsWithHousehold(ukHousehold),
      households: { [`uk/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`]: UK_V1_HOUSEHOLD_JSON },
    });

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);
    await within(panel).findByRole('table', { name: 'You' });

    // Then
    expect({
      note: within(panel).getByText(/^This household was saved in the United Kingdom\./)
        .textContent,
      tables: householdTablesIn(panel),
      reads: householdReads,
    }).toEqual({
      note: 'This household was saved in the United Kingdom. This page loads the United States model only, so its inputs show without their labels, units or option names.',
      tables: {
        You: [
          ['Age', '30'],
          ['Employment income', '30000'],
        ],
        'Your household': [['Region', 'LONDON']],
      },
      reads: [`/uk/household/${SAVED_TARGET_IDS.V1_HOUSEHOLD}`],
    });
  });

  test('given the household cannot be read then the panel says so, and trying again shows it', async () => {
    // Given
    const { user } = await openUserDetails(GRACE.email!);
    answerHouseholdReads(fetchMock, {});
    await user.click(screen.getByRole('button', { name: SHOW_SAVED_ITEMS }));
    await screen.findByRole('table', { name: 'Saved households' });
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'We could not load this household'
    );
    answerHouseholdReads(fetchMock);

    // When
    await user.click(within(panel).getByRole('button', { name: 'Try again' }));

    // Then
    expect(await within(panel).findByRole('table', { name: 'You' })).toBeInTheDocument();
  });

  test('given a household saved only as a v2 household then the panel says it cannot show it and reads nothing', async () => {
    // Given
    const v2Household = savedHousehold({
      name: SAVED_ITEM_NAMES.HOUSEHOLD,
      household_id: 'b2000000-0000-4000-8000-000000000001',
    });
    const { user, householdReads } = await showSavedItems(GRACE.email!, {
      savedItems: savedItemsWithHousehold(v2Household),
    });

    // When
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);

    // Then
    expect(await within(panel).findByRole('alert')).toHaveTextContent(
      'This household is a v2 household, which this page cannot show yet.'
    );
    expect({
      v1Reads: householdReads,
      v2Reads: sentRequests(fetchMock).filter((request) => request.includes('/v2/households')),
    }).toEqual({ v1Reads: [], v2Reads: [] });
  });

  test("given the household's panel is open then closing it returns focus to the household's name", async () => {
    // Given
    const { user } = await showSavedItems(GRACE.email!);
    const panel = await openHousehold(user, SAVED_ITEM_NAMES.HOUSEHOLD);
    await within(panel).findByRole('table', { name: 'You' });

    // When
    await user.click(within(panel).getByRole('button', { name: 'Close' }));

    // Then
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(
      within(screen.getByRole('table', { name: 'Saved households' })).getByRole('button', {
        name: SAVED_ITEM_NAMES.HOUSEHOLD,
      })
    ).toHaveFocus();
  });
});
