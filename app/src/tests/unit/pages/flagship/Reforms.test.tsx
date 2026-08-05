import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderWithCountry, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import ReformsPage from '@/pages/flagship/Reforms.page';
import type { Reform } from '@/types/ingredients/Reform';

const mockFindByUser = vi.fn();
const mockDelete = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({
      findByUser: mockFindByUser,
      delete: mockDelete,
      create: mockCreate,
      update: mockUpdate,
    }),
  };
});

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ countryId: 'us' }),
  };
});

const CHAT_REFORM: Reform = {
  id: 'rf-1',
  userId: 'anonymous',
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

function renderReforms(path?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = (
    <QueryClientProvider client={queryClient}>
      <ReformsPage />
    </QueryClientProvider>
  );
  return path ? renderWithCountry(ui, 'us', path) : render(ui);
}

describe('ReformsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
  });

  test('given the combined list then bills and your reforms render with provenance badges', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    renderReforms();

    expect(await screen.findByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    // Plain muted meta text, no colored pills: jurisdiction · status for
    // bills, provision count for your reforms
    expect(screen.getByText('Utah · Enacted')).toBeInTheDocument();
    expect(screen.getByText('1 provision')).toBeInTheDocument();
  });

  test('given the In Congress filter then only bills remain', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms();
    await screen.findByText('CTC to $3,600 for children under 6');

    await user.click(screen.getByRole('button', { name: 'In Congress' }));

    expect(screen.queryByText('CTC to $3,600 for children under 6')).not.toBeInTheDocument();
    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
  });

  test('given the Yours filter then bills and the sample note disappear', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms();
    await screen.findByText('CTC to $3,600 for children under 6');

    await user.click(screen.getByRole('button', { name: 'Yours' }));

    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
    expect(screen.queryByText(/sample preview/i)).not.toBeInTheDocument();
    expect(screen.getByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
  });

  test('given a ?bill deep link then that bill opens expanded', async () => {
    mockFindByUser.mockResolvedValue([]);
    renderReforms('/us/reforms?bill=us-ctc-expansion');

    expect(
      await screen.findByRole('button', { name: /open as draft reform/i })
    ).toBeInTheDocument();
    // Summary appears in both the row preview and the expanded detail
    expect(screen.getAllByText(/raises the base child tax credit/i).length).toBeGreaterThan(1);
  });

  test('given open as draft on a bill then the draft is populated from its provisions', async () => {
    mockFindByUser.mockResolvedValue([]);
    const user = userEvent.setup();
    renderReforms();

    await user.click(await screen.findByText('Child tax credit expansion proposal'));
    await user.click(screen.getByRole('button', { name: /open as draft reform/i }));

    const draft = getDraftReform();
    expect(draft?.source).toBe('bill');
    expect(draft?.label).toBe('Child tax credit expansion proposal');
    expect(draft?.provisions.length).toBeGreaterThan(0);
  });

  test('given no saved reforms under Yours then the empty state shows', async () => {
    mockFindByUser.mockResolvedValue([]);
    const user = userEvent.setup();
    renderReforms();

    await user.click(screen.getByRole('button', { name: 'Yours' }));

    expect(await screen.findByText(/no saved reforms yet/i)).toBeInTheDocument();
  });

  test('given the store fails then an error message shows', async () => {
    mockFindByUser.mockRejectedValue(new Error('boom'));
    renderReforms();

    expect(await screen.findByText(/could not load your reforms/i)).toBeInTheDocument();
  });

  test('given an expanded reform then provisions are editable and save waits for changes', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms();

    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    expect(screen.getByLabelText(/new value for gov\.irs/i)).toHaveValue(3600);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });

  test('given an amended value then save updates the reform', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockUpdate.mockResolvedValue({ ...CHAT_REFORM });
    const user = userEvent.setup();
    renderReforms();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    const input = screen.getByLabelText(/new value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '4000');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0][1].parameters[0].values[0].value).toBe(4000);
  });

  test('given delete on an expanded reform then the store delete is called', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderReforms();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockDelete).toHaveBeenCalledWith('rf-1');
  });

  test('given duplicate on an expanded reform then a copy is created', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockCreate.mockResolvedValue({ id: 'rf-copy' });
    const user = userEvent.setup();
    renderReforms();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    await user.click(screen.getByRole('button', { name: /duplicate/i }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'CTC to $3,600 for children under 6 (copy)' })
    );
  });

  test('given a search query then both kinds filter together', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms();
    await screen.findByText('CTC to $3,600 for children under 6');

    await user.type(screen.getByRole('textbox', { name: /search reforms/i }), 'snap');

    expect(screen.getByText(/SNAP benefit adjustment/)).toBeInTheDocument();
    expect(screen.queryByText('CTC to $3,600 for children under 6')).not.toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
  });
});
