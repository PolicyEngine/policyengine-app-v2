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

/** The account holds the family; rename and delete change what the list reads next. */
function signedInWithFamily() {
  const { fetchMock, context } = createTestApiContext('us');
  mockSavedWork.mockReturnValue({ account: context, scope: 'account:test' });
  let rows: unknown[] = [userHouseholdItem()];
  return routeRequests(fetchMock, {
    'GET /v2/user-households': () => pageResponse(rows),
    [`GET /v2/households/${V2_HOUSEHOLD_IDS.FAMILY}`]: () =>
      itemResponse(v2HouseholdItem(FAMILY_HOUSEHOLD, V2_HOUSEHOLD_IDS.FAMILY)),
    [`PATCH /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: (request) => {
      rows = [userHouseholdItem({ name: request.body.name })];
      return itemResponse(rows[0]);
    },
    [`DELETE /v2/user-households/${SAVED_HOUSEHOLD_IDS.FAMILY}`]: () => {
      rows = [];
      return noContentResponse();
    },
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

describe('SavedHouseholdsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given saved households then each is listed with who it describes', async () => {
    signedInWithFamily();
    renderPage();

    expect(screen.getByRole('heading', { name: 'Your households' })).toBeInTheDocument();
    const row = await screen.findByRole('listitem', { name: FAMILY_LABEL });
    expect(row).toHaveTextContent('Married · 2 children');
  });

  test('given Rename then the saved household takes the new label', async () => {
    const user = userEvent.setup();
    const requests = signedInWithFamily();
    renderPage();
    const row = await screen.findByRole('listitem', { name: FAMILY_LABEL });

    await user.click(within(row).getByRole('button', { name: 'Rename' }));
    const nameField = await screen.findByRole('textbox');
    await user.clear(nameField);
    await user.type(nameField, RETIRED_LABEL);
    await user.click(screen.getByRole('button', { name: /^Rename$/ }));

    expect(await screen.findByRole('listitem', { name: RETIRED_LABEL })).toBeInTheDocument();
    expect(requests.find((request) => request.method === 'PATCH')?.body).toEqual({
      name: RETIRED_LABEL,
    });
  });

  test('given Delete, once confirmed, then the saved household leaves the list', async () => {
    const user = userEvent.setup();
    const requests = signedInWithFamily();
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

  test('given no accounts then it says saved households are not available', () => {
    mockSavedWork.mockReturnValue({ account: null, scope: 'browser' });
    renderPage();

    expect(screen.getByText('Saved households are not available here.')).toBeInTheDocument();
  });
});
