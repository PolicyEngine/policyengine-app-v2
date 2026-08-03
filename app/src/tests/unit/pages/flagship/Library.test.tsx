import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { clearDraftReform, getDraftReform } from '@/libs/draftReform';
import LibraryPage from '@/pages/flagship/Library.page';
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

const BILL_REFORM: Reform = {
  id: 'rf-2',
  userId: 'anonymous',
  countryId: 'us',
  label: null,
  parameters: [],
  baseline: 'current-law',
  provenance: { source: 'bill', ref: 'ut-hb-106' },
};

function renderLibrary() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <LibraryPage />
    </QueryClientProvider>
  );
}

describe('LibraryPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
  });

  test('given saved reforms then they render as compact rows with provenance chips', async () => {
    // Given
    mockFindByUser.mockResolvedValue([CHAT_REFORM, BILL_REFORM]);

    // When
    renderLibrary();

    // Then
    expect(await screen.findByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
    expect(screen.getByText('From a question')).toBeInTheDocument();
    expect(screen.getByText('From a bill')).toBeInTheDocument();
    expect(screen.getByText('Untitled reform')).toBeInTheDocument();
    // Details stay collapsed until a row is opened
    expect(screen.queryByRole('button', { name: /save changes/i })).not.toBeInTheDocument();
  });

  test('given no saved reforms then the empty state shows', async () => {
    // Given
    mockFindByUser.mockResolvedValue([]);

    // When
    renderLibrary();

    // Then
    expect(await screen.findByText(/no saved reforms yet/i)).toBeInTheDocument();
  });

  test('given the store fails then an error message shows', async () => {
    // Given
    mockFindByUser.mockRejectedValue(new Error('boom'));

    // When
    renderLibrary();

    // Then
    expect(await screen.findByText(/could not load your reforms/i)).toBeInTheDocument();
  });

  test('given a row is expanded then its provisions become editable in place', async () => {
    // Given
    const user = userEvent.setup();
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    renderLibrary();

    // When
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // Then
    expect(screen.getByLabelText(/new value for gov\.irs/i)).toHaveValue(3600);
    expect(screen.getByLabelText(/reform name/i)).toHaveValue('CTC to $3,600 for children under 6');
    // Save stays disabled until something changes
    expect(screen.getByRole('button', { name: /save changes/i })).toBeDisabled();
  });

  test('given an amended value then save updates the reform with the new value', async () => {
    // Given
    const user = userEvent.setup();
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockUpdate.mockResolvedValue({ ...CHAT_REFORM });
    renderLibrary();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // When
    const input = screen.getByLabelText(/new value for gov\.irs/i);
    await user.clear(input);
    await user.type(input, '4000');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Then
    await waitFor(() => expect(mockUpdate).toHaveBeenCalledTimes(1));
    const [id, updates] = mockUpdate.mock.calls[0];
    expect(id).toBe('rf-1');
    expect(updates.parameters[0].values[0].value).toBe(4000);
  });

  test('given a rename then save updates the label', async () => {
    // Given
    const user = userEvent.setup();
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockUpdate.mockResolvedValue({ ...CHAT_REFORM });
    renderLibrary();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // When
    const nameInput = screen.getByLabelText(/reform name/i);
    await user.clear(nameInput);
    await user.type(nameInput, 'Renamed reform');
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    // Then
    await waitFor(() => expect(mockUpdate).toHaveBeenCalled());
    expect(mockUpdate.mock.calls[0][1].label).toBe('Renamed reform');
  });

  test('given delete on an expanded row then the store delete is called', async () => {
    // Given
    const user = userEvent.setup();
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockDelete.mockResolvedValue(undefined);
    renderLibrary();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // When
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Then
    expect(mockDelete).toHaveBeenCalledWith('rf-1');
  });

  test('given duplicate on an expanded row then a copy is created', async () => {
    // Given
    const user = userEvent.setup();
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    mockCreate.mockResolvedValue({ id: 'rf-copy' });
    renderLibrary();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // When
    await user.click(screen.getByRole('button', { name: /duplicate/i }));

    // Then
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'CTC to $3,600 for children under 6 (copy)' })
    );
  });

  test('given add parameters in build then the reform loads into the draft composer', async () => {
    // Given
    const user = userEvent.setup();
    mockFindByUser.mockResolvedValue([CHAT_REFORM]);
    renderLibrary();
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // When
    await user.click(screen.getByRole('button', { name: /add parameters in build/i }));

    // Then
    expect(getDraftReform()?.editingReformId).toBe('rf-1');
    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });
});
