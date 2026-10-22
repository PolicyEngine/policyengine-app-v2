import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SavedHouseholdsPage from '@/pages/flagship/SavedHouseholds.page';
import {
  FAMILY_HOUSEHOLD,
  FAMILY_LABEL,
  RETIRED_LABEL,
  routeRequests,
  SAVED_HOUSEHOLD_IDS,
  userHouseholdItem,
  V1_ONLY_LABEL,
  V2_HOUSEHOLD_IDS,
  v2HouseholdItem,
} from '@/tests/fixtures/api/savedHouseholdMocks';
import {
  createTestApiContext,
  errorResponse,
  itemResponse,
  noContentResponse,
  pageResponse,
} from '@/tests/fixtures/api/v2UserMocks';

const mockSavedWork = vi.fn();
vi.mock('@/hooks/useFlagshipStores', () => ({
  useV3SavedWork: () => mockSavedWork(),
}));

const SAVED_WORK_UNAVAILABLE = 'Saved work is temporarily unavailable.';

const v1OnlyRow = userHouseholdItem({
  id: SAVED_HOUSEHOLD_IDS.V1_ONLY,
  household_id: null,
  legacy_household_id: 123,
  name: V1_ONLY_LABEL,
});

/**
 * The account holds these saved rows and the family's household; a rename
 * or delete changes what the list reads next, unless `failing` says that
 * request fails.
 */
function signedInWith(
  initialRows: ReturnType<typeof userHouseholdItem>[],
  failing: { rename?: boolean; remove?: boolean } = {}
) {
  const { fetchMock, context } = createTestApiContext('us');
  mockSavedWork.mockReturnValue({ account: context, scope: 'account:test' });
  let rows = initialRows;
  const rowRoutes = Object.fromEntries(
    initialRows.flatMap((row) => [
      [
        `PATCH /v2/user-households/${row.id}`,
        (request: { body: { name: string } }) => {
          if (failing.rename) {
            return errorResponse(503, SAVED_WORK_UNAVAILABLE);
          }
          rows = rows.map((other) =>
            other.id === row.id ? { ...other, name: request.body.name } : other
          );
          return itemResponse(rows.find((other) => other.id === row.id));
        },
      ],
      [
        `DELETE /v2/user-households/${row.id}`,
        () => {
          if (failing.remove) {
            return errorResponse(503, SAVED_WORK_UNAVAILABLE);
          }
          rows = rows.filter((other) => other.id !== row.id);
          return noContentResponse();
        },
      ],
    ])
  );
  return routeRequests(fetchMock, {
    'GET /v2/user-households': () => pageResponse(rows),
    [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () =>
      itemResponse(v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY)),
    ...rowRoutes,
  });
}

function renderPage() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <SavedHouseholdsPage />
    </QueryClientProvider>
  );
}

async function renameTo(row: HTMLElement, label: string) {
  const user = userEvent.setup();
  await user.click(within(row).getByRole('button', { name: 'Rename' }));
  const nameField = await screen.findByRole('textbox');
  await user.clear(nameField);
  await user.type(nameField, label);
  await user.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Rename' }));
}

describe('SavedHouseholdsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given saved households then each is listed with who it describes', async () => {
    signedInWith([userHouseholdItem()]);
    renderPage();

    expect(screen.getByRole('heading', { name: 'Your households' })).toBeInTheDocument();
    const row = await screen.findByRole('listitem', { name: FAMILY_LABEL });
    expect(row).toHaveTextContent('Married · 2 children');
  });

  test('given Rename then the saved household takes the new label', async () => {
    const requests = signedInWith([userHouseholdItem()]);
    renderPage();

    await renameTo(await screen.findByRole('listitem', { name: FAMILY_LABEL }), RETIRED_LABEL);

    expect(await screen.findByRole('listitem', { name: RETIRED_LABEL })).toBeInTheDocument();
    expect(requests.find((request) => request.method === 'PATCH')?.body).toEqual({
      name: RETIRED_LABEL,
    });
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  test('given a rename that fails then the dialog stays open and says why', async () => {
    signedInWith([userHouseholdItem()], { rename: true });
    renderPage();

    await renameTo(await screen.findByRole('listitem', { name: FAMILY_LABEL }), RETIRED_LABEL);

    expect(
      await within(screen.getByRole('dialog')).findByText(SAVED_WORK_UNAVAILABLE)
    ).toBeInTheDocument();
    // The open dialog hides the page behind it from assistive technology.
    expect(screen.getByRole('listitem', { name: FAMILY_LABEL, hidden: true })).toBeInTheDocument();
  });

  test('given Delete, once confirmed, then the saved household leaves the list', async () => {
    const user = userEvent.setup();
    const requests = signedInWith([userHouseholdItem()]);
    renderPage();
    const row = await screen.findByRole('listitem', { name: FAMILY_LABEL });

    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    expect(requests.some((request) => request.method === 'DELETE')).toBe(false);
    await user.click(await screen.findByRole('button', { name: 'Delete household' }));

    await waitFor(() =>
      expect(screen.queryByRole('listitem', { name: FAMILY_LABEL })).not.toBeInTheDocument()
    );
    expect(screen.getByText('No saved households yet.')).toBeInTheDocument();
  });

  test('given Delete, then Cancel, then nothing is deleted', async () => {
    const user = userEvent.setup();
    const requests = signedInWith([userHouseholdItem()]);
    renderPage();
    const row = await screen.findByRole('listitem', { name: FAMILY_LABEL });

    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Cancel' }));

    expect(requests.some((request) => request.method === 'DELETE')).toBe(false);
    expect(screen.getByRole('listitem', { name: FAMILY_LABEL })).toBeInTheDocument();
  });

  test('given a delete that fails then it says which household and why, and keeps it', async () => {
    const user = userEvent.setup();
    signedInWith([userHouseholdItem()], { remove: true });
    renderPage();
    const row = await screen.findByRole('listitem', { name: FAMILY_LABEL });

    await user.click(within(row).getByRole('button', { name: 'Delete' }));
    await user.click(await screen.findByRole('button', { name: 'Delete household' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      `“${FAMILY_LABEL}” could not be deleted. ${SAVED_WORK_UNAVAILABLE}`
    );
    expect(screen.getByRole('listitem', { name: FAMILY_LABEL })).toBeInTheDocument();
  });

  test('given a saved household that cannot open then it is listed, and can be renamed or deleted', async () => {
    signedInWith([userHouseholdItem(), v1OnlyRow]);
    renderPage();

    const row = await screen.findByRole('listitem', { name: V1_ONLY_LABEL });
    expect(row).toHaveTextContent('Cannot be opened here');
    expect(within(row).getByRole('button', { name: 'Rename' })).toBeEnabled();
    expect(within(row).getByRole('button', { name: 'Delete' })).toBeEnabled();
  });

  test('given no accounts then it says saved households are not available', () => {
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });
    renderPage();

    expect(screen.getByText('Saved households are not available here.')).toBeInTheDocument();
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});
