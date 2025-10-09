import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { LinkColumn } from '@/components/columns/LinkColumn';
import { LinkColumnConfig, LinkValue } from '@/components/columns/types';

describe('LinkColumn', () => {
  const mockConfig: LinkColumnConfig = {
    key: 'testLink',
    header: 'Test Link',
    type: 'link',
  };

  test('given link value when rendering then displays link with text and href', () => {
    // Given
    const value: LinkValue = {
      text: 'Click me',
      url: '/test-path',
    };

    // When
    render(<LinkColumn config={mockConfig} value={value} />);

    // Then
    const link = screen.getByRole('link', { name: 'Click me' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test-path');
  });

  test('given link with urlPrefix when no url provided then uses prefix', () => {
    // Given
    const configWithPrefix: LinkColumnConfig = {
      ...mockConfig,
      urlPrefix: '/prefix/',
    };
    const value: LinkValue = {
      text: 'Test Item',
    };

    // When
    render(<LinkColumn config={configWithPrefix} value={value} />);

    // Then
    const link = screen.getByRole('link', { name: 'Test Item' });
    expect(link).toHaveAttribute('href', '/prefix/Test Item');
  });

  test('given link with custom size when rendering then applies size', () => {
    // Given
    const configWithSize: LinkColumnConfig = {
      ...mockConfig,
      size: 'lg',
    };
    const value: LinkValue = {
      text: 'Large Link',
      url: '/path',
    };

    // When
    render(<LinkColumn config={configWithSize} value={value} />);

    // Then
    const link = screen.getByRole('link', { name: 'Large Link' });
    expect(link).toBeInTheDocument();
  });

  test('given link click when clicked then stops propagation to parent', async () => {
    // Given
    const user = userEvent.setup();
    const value: LinkValue = {
      text: 'Click me',
      url: '/test-path',
    };
    const parentClickHandler = vi.fn();

    // When
    const { container } = render(
      <div onClick={parentClickHandler}>
        <LinkColumn config={mockConfig} value={value} />
      </div>
    );

    const link = screen.getByRole('link', { name: 'Click me' });
    await user.click(link);

    // Then
    // Parent click handler should NOT be called due to stopPropagation
    expect(parentClickHandler).not.toHaveBeenCalled();
  });

  test('given no url provided and no urlPrefix then uses hash fallback', () => {
    // Given
    const value: LinkValue = {
      text: 'No URL',
    };

    // When
    render(<LinkColumn config={mockConfig} value={value} />);

    // Then
    const link = screen.getByRole('link', { name: 'No URL' });
    expect(link).toHaveAttribute('href', '#No URL');
  });
});
