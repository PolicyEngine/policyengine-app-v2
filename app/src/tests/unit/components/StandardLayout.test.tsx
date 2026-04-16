import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import StandardLayout from '@/components/StandardLayout';

vi.mock('@/components/Sidebar', () => ({
  default: () => <div>Sidebar</div>,
}));

describe('StandardLayout', () => {
  test('given component renders then main content can use the full mobile width', () => {
    // When
    const { container } = renderWithCountry(<StandardLayout>Page content</StandardLayout>, 'us');

    // Then
    expect(screen.getByText('Page content')).toBeInTheDocument();
    const main = container.querySelector('main');
    expect(main).toHaveClass('tw:w-full');
    expect(main?.className).not.toContain('tw:max-w-[calc(100vw-300px)]');
  });
});
