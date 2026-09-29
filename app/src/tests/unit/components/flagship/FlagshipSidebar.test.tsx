import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithCountry, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import FlagshipSidebar from '@/components/flagship/FlagshipSidebar';

const mockNavigate = vi.fn();
const mockFindByUser = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ pathname: '/us/build', search: '' }),
    useParams: () => ({ countryId: 'us' }),
  };
});

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ findByUser: mockFindByUser }),
  };
});

function renderSidebar() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithCountry(
    <QueryClientProvider client={queryClient}>
      <FlagshipSidebar />
    </QueryClientProvider>,
    'us',
    '/us/build'
  );
}

describe('FlagshipSidebar', () => {
  test('given the sidebar renders then all entry points are present', () => {
    mockFindByUser.mockResolvedValue([]);
    renderSidebar();

    expect(screen.getByRole('button', { name: 'Build' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reforms' })).toBeInTheDocument();
  });

  test('given the Ask page is paused then it has no nav item', () => {
    mockFindByUser.mockResolvedValue([]);
    renderSidebar();

    expect(screen.queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument();
  });

  test('given the current route then its nav item is marked current', () => {
    mockFindByUser.mockResolvedValue([]);
    renderSidebar();

    expect(screen.getByRole('button', { name: 'Build' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Reforms' })).not.toHaveAttribute('aria-current');
  });

  test('given a nav item is clicked then it navigates to that section', async () => {
    mockFindByUser.mockResolvedValue([]);
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('button', { name: 'Reforms' }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/reforms');
  });

  test('given saved reforms then recent entries list in the sidebar', async () => {
    mockFindByUser.mockResolvedValue([
      { id: 'rf-1', label: 'CTC expansion 2026' },
      { id: 'rf-2', label: null },
    ]);
    renderSidebar();

    expect(await screen.findByText('CTC expansion 2026')).toBeInTheDocument();
    expect(screen.getByText('Untitled reform')).toBeInTheDocument();
  });

  test('given the brand is clicked then it navigates to the Build landing', async () => {
    mockFindByUser.mockResolvedValue([]);
    const user = userEvent.setup();
    renderSidebar();

    await user.click(screen.getByRole('button', { name: 'PolicyEngine' }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/build');
  });
});
