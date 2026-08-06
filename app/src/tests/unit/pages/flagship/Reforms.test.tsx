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
    mockFindByUser.mockResolvedValue([]);
  });

  test('given the default view then bill cards render with jurisdiction eyebrows', () => {
    renderReforms();

    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    // "Utah" appears as the card eyebrow and in the place filter
    expect(screen.getAllByText('Utah').length).toBeGreaterThanOrEqual(2);
    // Cards, not accordions: no expanded actions yet
    expect(screen.queryByRole('button', { name: /open as draft reform/i })).not.toBeInTheDocument();
  });

  test('given a bill card is clicked then its detail opens with actions', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(screen.getByText('Child tax credit expansion proposal'));

    expect(screen.getByRole('button', { name: /view full impact report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open as draft reform/i })).toBeInTheDocument();
    expect(screen.getByText(/raises the base child tax credit/i)).toBeInTheDocument();
  });

  test('given a ?bill deep link then the detail opens directly', () => {
    renderReforms('/us/reforms?bill=us-ctc-expansion');

    expect(screen.getByRole('button', { name: /open as draft reform/i })).toBeInTheDocument();
  });

  test('given open as draft in the detail then the draft is populated', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(screen.getByText('Child tax credit expansion proposal'));
    await user.click(screen.getByRole('button', { name: /open as draft reform/i }));

    const draft = getDraftReform();
    expect(draft?.source).toBe('bill');
    expect(draft?.label).toBe('Child tax credit expansion proposal');
    expect(draft?.provisions.length).toBeGreaterThan(0);
  });

  test('given the place filter then only that jurisdiction remains', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.selectOptions(screen.getByLabelText(/filter by place/i), 'Utah');

    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.queryByText('Child tax credit expansion proposal')).not.toBeInTheDocument();
  });

  test('given a search then bill cards filter', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.type(screen.getByRole('textbox', { name: /search reforms/i }), 'snap');

    expect(screen.getByText(/SNAP benefit adjustment/)).toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
  });

  test('given the Yours tab with no reforms then the invitation shows', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(screen.getByRole('button', { name: 'Yours' }));

    expect(await screen.findByText(/no saved reforms yet/i)).toBeInTheDocument();
  });

  test('given a ?filter=yours deep link then the Yours tab is active', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    renderReforms('/us/reforms?filter=yours');

    expect(await screen.findByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
  });

  test('given a reform card is clicked then its provisions edit in place', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');

    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    expect(screen.getByLabelText(/new value for gov\.irs/i)).toHaveValue(3600);
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });

  test('given an amended value then save updates the reform', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockUpdate.mockResolvedValue({ ...CHAT_REFORM });
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    const input = screen.getByLabelText(/new value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '4000');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    expect(mockUpdate.mock.calls[0][1].parameters[0].values[0].value).toBe(4000);
  });

  test('given delete in the reform detail then the store delete is called', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(mockDelete).toHaveBeenCalledWith('rf-1');
  });

  test('given duplicate in the reform detail then a copy is created', async () => {
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockCreate.mockResolvedValue({ id: 'rf-copy' });
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    await user.click(screen.getByRole('button', { name: /duplicate/i }));

    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'CTC to $3,600 for children under 6 (copy)' })
    );
  });

  test('given the back link in a detail then the grid returns', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(screen.getByText('Child tax credit expansion proposal'));
    await user.click(screen.getByRole('button', { name: /all reforms/i }));

    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open as draft reform/i })).not.toBeInTheDocument();
  });
});
