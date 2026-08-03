import { renderWithCountry, screen } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import StandardLayout from '@/components/StandardLayout';
import { setFlagshipShellEnabled } from '@/libs/featureFlags';

vi.mock('@/components/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

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

  test('given the flagship flag is off then the sidebar renders and the top nav does not', () => {
    // When
    renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByText('Sidebar')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^ask$/i })).not.toBeInTheDocument();
  });

  test('given the flagship flag is on then the top nav replaces the sidebar', () => {
    // Given
    setFlagshipShellEnabled(true);

    // When
    renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByRole('button', { name: /^ask$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new reform/i })).toBeInTheDocument();
    expect(screen.queryByText('Sidebar')).not.toBeInTheDocument();
  });
});
