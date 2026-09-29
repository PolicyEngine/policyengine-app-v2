import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderWithCountry, screen, userEvent } from '@test-utils';
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

function renderFlagshipShell() {
  setFlagshipShellEnabled(true);
  return renderWithCountry(
    withQueryClient(<StandardLayout>Page content</StandardLayout>),
    'us',
    '/us/build'
  );
}

/** The drawer the narrow-viewport toggle controls, found through aria-controls. */
function getFlagshipDrawer() {
  const toggle = screen.getByRole('button', { name: /navigation/i });
  return document.getElementById(toggle.getAttribute('aria-controls') ?? '');
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
    expect(screen.queryByRole('button', { name: 'Build' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument();
  });

  test('given the flagship flag is on then the flagship sidebar replaces the legacy chrome', () => {
    // Given
    setFlagshipShellEnabled(true);

    // When
    renderWithCountry(withQueryClient(<StandardLayout>Page content</StandardLayout>), 'us');

    // Then
    expect(screen.getByRole('button', { name: 'Build' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reforms' })).toBeInTheDocument();
    expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
  });

  test('given the flagship shell on a narrow viewport then the sidebar starts collapsed behind a toggle', () => {
    // When
    renderFlagshipShell();

    // Then
    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    const drawer = getFlagshipDrawer();
    expect(drawer).toHaveClass('tw:hidden', 'tw:sm:flex');
    expect(drawer).toContainElement(screen.getByRole('button', { name: 'Build' }));
  });

  test('given the nav toggle is clicked then the sidebar opens as a drawer over the content', async () => {
    // Given
    const user = userEvent.setup();
    renderFlagshipShell();

    // When
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    // Then
    const toggle = screen.getByRole('button', { name: 'Close navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    const drawer = getFlagshipDrawer();
    expect(drawer).toHaveClass('tw:absolute', 'tw:flex');
    expect(drawer).not.toHaveClass('tw:hidden');
  });

  test('given the drawer is open when the toggle is clicked again then the drawer closes', async () => {
    // Given
    const user = userEvent.setup();
    renderFlagshipShell();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    // When
    await user.click(screen.getByRole('button', { name: 'Close navigation' }));

    // Then
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(getFlagshipDrawer()).toHaveClass('tw:hidden');
  });

  test('given the drawer is open when Escape is pressed then it closes and focus returns to the toggle', async () => {
    // Given
    const user = userEvent.setup();
    renderFlagshipShell();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    screen.getByRole('button', { name: 'Reforms' }).focus();

    // When
    await user.keyboard('{Escape}');

    // Then
    const toggle = screen.getByRole('button', { name: 'Open navigation' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(toggle).toHaveFocus();
  });

  test('given the drawer is open when the scrim is clicked then the drawer closes', async () => {
    // Given
    const user = userEvent.setup();
    const { container } = renderFlagshipShell();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));
    const scrim = container.querySelector('[data-slot="flagship-nav-scrim"]');

    // When
    await user.click(scrim as Element);

    // Then
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
    expect(container.querySelector('[data-slot="flagship-nav-scrim"]')).not.toBeInTheDocument();
  });

  test('given the drawer is open when a nav item is clicked then it navigates and the drawer closes', async () => {
    // Given
    const user = userEvent.setup();
    renderFlagshipShell();
    await user.click(screen.getByRole('button', { name: 'Open navigation' }));

    // When
    await user.click(screen.getByRole('button', { name: 'Reforms' }));

    // Then
    expect(screen.getByRole('button', { name: 'Reforms' })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('button', { name: 'Open navigation' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );
  });
});
