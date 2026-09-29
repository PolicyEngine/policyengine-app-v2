import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithCountry, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
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

function renderSidebar(onNavigate?: () => void) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return renderWithCountry(
    <QueryClientProvider client={queryClient}>
      <FlagshipSidebar onNavigate={onNavigate} />
    </QueryClientProvider>,
    'us',
    '/us/build'
  );
}

describe('FlagshipSidebar', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

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

  test('given a nav item is clicked then the onNavigate callback fires so the drawer can close', async () => {
    mockFindByUser.mockResolvedValue([]);
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderSidebar(onNavigate);

    await user.click(screen.getByRole('button', { name: 'Reforms' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('given a recent reform is clicked then it navigates and fires onNavigate', async () => {
    mockFindByUser.mockResolvedValue([{ id: 'rf-1', label: 'CTC expansion 2026' }]);
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderSidebar(onNavigate);

    await user.click(await screen.findByRole('button', { name: 'CTC expansion 2026' }));

    expect(mockNavigate).toHaveBeenCalledWith('/us/reforms?filter=yours');
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });

  test('given the brand is clicked then the onNavigate callback fires', async () => {
    mockFindByUser.mockResolvedValue([]);
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    renderSidebar(onNavigate);

    await user.click(screen.getByRole('button', { name: 'PolicyEngine' }));

    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
