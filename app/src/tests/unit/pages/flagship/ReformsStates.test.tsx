import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDraftReform } from '@/libs/draftReform';
import ReformsPage from '@/pages/flagship/Reforms.page';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';
import type { Reform } from '@/types/ingredients/Reform';

const mockFindMine = vi.fn();

vi.mock('@/api/reformStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/reformStore')>()),
  getReformStore: () => ({
    findMine: mockFindMine,
    delete: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  }),
}));

vi.mock('@/api/flagshipReportStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/flagshipReportStore')>()),
  getFlagshipReportStore: () => ({ findMine: async () => [] }),
}));

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: vi.fn(), isRunning: false, error: null }),
}));

const mockFetchTrackerBills = vi.fn();

vi.mock('@/api/billFeed', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/billFeed')>()),
  fetchTrackerBills: () => mockFetchTrackerBills(),
}));

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useNavigate: () => mockNavigate,
  useParams: () => ({ countryId: 'us' }),
}));

const SAVED_REFORM: Reform = {
  id: 'rf-1',
  countryId: 'us',
  label: 'CTC to $3,600 for children under 6',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1' },
  updatedAt: '2026-08-01T00:00:00Z',
};

/** A search that matches no bill and no reform. */
const NO_MATCH_QUERY = 'zzzz quantum flux';

function renderReforms() {
  // No retry delay, so the feed's own retry settles at once.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, retryDelay: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReformsPage />
    </QueryClientProvider>
  );
}

async function openYours(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Yours' }));
}

describe('ReformsPage states', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
    mockFindMine.mockResolvedValue([]);
    mockFetchTrackerBills.mockResolvedValue([TRACKED_BILL]);
  });

  test('given the bill feed is loading then card placeholders hold the grid', () => {
    mockFetchTrackerBills.mockReturnValue(new Promise(() => {}));

    renderReforms();

    expect(screen.getByRole('status', { name: 'Loading bills' })).toBeInTheDocument();
  });

  test('given saved reforms are loading then card placeholders hold the grid', async () => {
    const user = userEvent.setup();
    mockFindMine.mockReturnValue(new Promise(() => {}));
    renderReforms();

    await openYours(user);

    expect(screen.getByRole('status', { name: 'Loading your reforms' })).toBeInTheDocument();
    expect(screen.queryByText('No saved reforms yet.')).not.toBeInTheDocument();
  });

  test('given the bill feed failed then try again brings the bills', async () => {
    // Given
    const user = userEvent.setup();
    mockFetchTrackerBills.mockRejectedValue(new Error('tracker down'));
    renderReforms();
    await screen.findByRole('alert');
    mockFetchTrackerBills.mockResolvedValue([TRACKED_BILL]);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText(TRACKED_BILL.title)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given saved reforms failed to load then it says so instead of an empty list', async () => {
    const user = userEvent.setup();
    mockFindMine.mockRejectedValue(new Error('store down'));
    renderReforms();

    await openYours(user);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load your reforms');
    expect(screen.queryByText('No saved reforms yet.')).not.toBeInTheDocument();
  });

  test('given saved reforms failed then try again lists them', async () => {
    // Given
    const user = userEvent.setup();
    mockFindMine.mockRejectedValue(new Error('store down'));
    renderReforms();
    await openYours(user);
    await screen.findByRole('alert');
    mockFindMine.mockResolvedValue([SAVED_REFORM]);

    // When
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText(SAVED_REFORM.label!)).toBeInTheDocument();
  });

  test('given no saved reforms then build a reform opens Build', async () => {
    const user = userEvent.setup();
    renderReforms();
    await openYours(user);

    await user.click(await screen.findByRole('button', { name: 'Build a reform' }));

    expect(screen.getByText('No saved reforms yet.')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });

  test('given a search that hides every saved reform then clear search brings them back', async () => {
    // Given
    const user = userEvent.setup();
    mockFindMine.mockResolvedValue([SAVED_REFORM]);
    renderReforms();
    await openYours(user);
    await screen.findByText(SAVED_REFORM.label!);
    await user.type(screen.getByRole('textbox', { name: 'Search reforms' }), NO_MATCH_QUERY);
    expect(screen.getByText('No reforms match.')).toBeInTheDocument();
    expect(screen.queryByText('No saved reforms yet.')).not.toBeInTheDocument();

    // When
    await user.click(screen.getByRole('button', { name: 'Clear search' }));

    // Then
    expect(screen.getByText(SAVED_REFORM.label!)).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Search reforms' })).toHaveValue('');
  });

  test('given a search that hides every bill then clear filters brings them back', async () => {
    // Given
    const user = userEvent.setup();
    renderReforms();
    await screen.findByText(TRACKED_BILL.title);
    await user.type(screen.getByRole('textbox', { name: 'Search reforms' }), NO_MATCH_QUERY);
    expect(screen.getByText('No bills match.')).toBeInTheDocument();

    // When
    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    // Then
    expect(screen.getByText(TRACKED_BILL.title)).toBeInTheDocument();
    expect(screen.queryByText('No bills match.')).not.toBeInTheDocument();
  });
});
