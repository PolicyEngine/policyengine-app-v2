import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import LibraryPage from '@/pages/flagship/Library.page';
import type { Reform } from '@/types/ingredients/Reform';

const mockFindByUser = vi.fn();

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ findByUser: mockFindByUser }),
  };
});

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ countryId: 'us' }),
  };
});

const CHAT_REFORM: Reform = {
  id: 'rf-1',
  userId: 'anonymous',
  countryId: 'us',
  label: 'CTC to $3,600 for children under 6',
  parameters: [{ name: 'gov.irs.credits.ctc.amount.base[0]', values: [] }],
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
  test('given saved reforms then they are listed with provenance labels', async () => {
    // Given
    mockFindByUser.mockResolvedValue([CHAT_REFORM, BILL_REFORM]);

    // When
    renderLibrary();

    // Then
    expect(await screen.findByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
    expect(screen.getByText('From chat')).toBeInTheDocument();
    expect(screen.getByText('From a bill')).toBeInTheDocument();
    expect(screen.getByText('Untitled reform')).toBeInTheDocument();
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
});
