import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithCountry, screen } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import StandardLayout from '@/components/StandardLayout';
import { setFlagshipShellEnabled } from '@/libs/featureFlags';

vi.mock('@/components/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({ findByUser: async () => [] }),
  };
});

function withQueryClient(children: React.ReactNode) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe('StandardLayout', () => {
  afterEach(() => {
    setFlagshipShellEnabled(false);
  });

  test('given component renders then main content can use the full mobile width', () => {
    // When
    const { container } = renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByText('Page content')).toBeInTheDocument();
    const main = container.querySelector('main');
    expect(main).toHaveClass('tw:w-full');
    expect(main?.className).not.toContain('tw:max-w-[calc(100vw-300px)]');
  });

  test('given the flagship flag is off then the legacy sidebar renders and the flagship nav does not', () => {
    // When
    renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Ask' })).not.toBeInTheDocument();
  });

  test('given the flagship flag is on then the flagship sidebar replaces the legacy chrome', () => {
    // Given
    setFlagshipShellEnabled(true);

    // When
    renderWithCountry(withQueryClient(<StandardLayout>Page content</StandardLayout>), 'us');

    // Then
    expect(screen.getByRole('button', { name: 'Ask' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reforms' })).toBeInTheDocument();
    expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
  });
});
