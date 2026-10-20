import { renderWithCountry, screen, userEvent } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import StandardLayout from '@/components/StandardLayout';
import { setFlagshipShellEnabled } from '@/libs/featureFlags';

vi.mock('@/components/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

function renderFlagshipShell() {
  setFlagshipShellEnabled(true);
  return renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us', '/us/build');
}

describe('StandardLayout', () => {
  afterEach(() => {
    setFlagshipShellEnabled(false);
    vi.unstubAllEnvs();
  });

  test('given component renders then main content can use the full mobile width', () => {
    // Given the v2 app (a build with the flag set to false)
    vi.stubEnv('VITE_FLAGSHIP_SHELL', 'false');

    // When
    const { container } = renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByText('Page content')).toBeInTheDocument();
    const main = container.querySelector('main');
    expect(main).toHaveClass('tw:w-full');
    expect(main?.className).not.toContain('tw:max-w-[calc(100vw-300px)]');
  });

  test('given the flagship flag is off then the legacy sidebar renders and the flagship nav does not', () => {
    // Given
    vi.stubEnv('VITE_FLAGSHIP_SHELL', 'false');

    // When
    renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Build' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Open navigation' })).not.toBeInTheDocument();
  });

  test('given a UK page with the UK switched back to v2 then the v2 chrome renders', () => {
    // Given
    vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL_UK', 'false');

    // When
    renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'uk');

    // Then
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Build' })).not.toBeInTheDocument();
  });

  test('given the flagship flag is on then the flagship top bar replaces the legacy chrome', () => {
    // Given
    setFlagshipShellEnabled(true);

    // When
    renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByRole('button', { name: 'Build' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reforms' })).toBeInTheDocument();
    expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
  });

  test('given the flagship shell then navigation sits in a top bar with no drawer to open', () => {
    // When
    renderFlagshipShell();

    // Then
    expect(screen.getByRole('banner')).toContainElement(
      screen.getByRole('button', { name: 'Build' })
    );
    expect(screen.queryByRole('button', { name: /navigation/i })).not.toBeInTheDocument();
    expect(screen.getByRole('main')).toHaveTextContent('Page content');
  });

  test('given a section in the top bar is clicked then it is marked current', async () => {
    // Given
    const user = userEvent.setup();
    renderFlagshipShell();

    // When
    await user.click(screen.getByRole('button', { name: 'Reforms' }));

    // Then
    expect(screen.getByRole('button', { name: 'Reforms' })).toHaveAttribute('aria-current', 'page');
  });
});
