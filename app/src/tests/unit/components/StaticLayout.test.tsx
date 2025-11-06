import { renderWithCountry, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import StaticLayout from '@/components/StaticLayout';
import {
  EXPECTED_LAYOUT_TEXT,
  MOCK_PAGE_CONTENT,
} from '@/tests/fixtures/components/StaticLayoutMocks';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Outlet: () => <div>{MOCK_PAGE_CONTENT}</div>,
  };
});

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

describe('StaticLayout', () => {
  test('given component renders then displays header navigation', () => {
    // When
    renderWithCountry(<StaticLayout />, 'us');

    // Then
    expect(screen.getByText(EXPECTED_LAYOUT_TEXT.ABOUT)).toBeInTheDocument();
    expect(screen.getAllByText(EXPECTED_LAYOUT_TEXT.DONATE).length).toBeGreaterThan(0);
  });

  test('given component renders then displays outlet content', () => {
    // When
    renderWithCountry(<StaticLayout />, 'us');

    // Then
    expect(screen.getByText(EXPECTED_LAYOUT_TEXT.PAGE_CONTENT)).toBeInTheDocument();
  });

  test('given component renders then displays footer', () => {
    // When
    renderWithCountry(<StaticLayout />, 'us');

    // Then
    expect(screen.getByText('Subscribe to PolicyEngine')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
  });

  test('given component renders then footer appears after content', () => {
    // When
    const { container } = renderWithCountry(<StaticLayout />, 'us');

    // Then
    const elements = Array.from(container.querySelectorAll('*'));
    const contentIndex = elements.findIndex(
      (el) => el.textContent === EXPECTED_LAYOUT_TEXT.PAGE_CONTENT
    );
    const footerIndex = elements.findIndex((el) =>
      el.textContent?.includes('Subscribe to PolicyEngine')
    );

    expect(contentIndex).toBeGreaterThan(-1);
    expect(footerIndex).toBeGreaterThan(-1);
    expect(footerIndex).toBeGreaterThan(contentIndex);
  });
});
