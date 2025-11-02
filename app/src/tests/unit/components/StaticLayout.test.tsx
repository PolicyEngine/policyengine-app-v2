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

describe('StaticLayout', () => {
  test('given component renders then displays header navigation', () => {
    // When
    renderWithCountry(<StaticLayout />, 'us');

    // Then
    expect(screen.getByText(EXPECTED_LAYOUT_TEXT.ABOUT)).toBeInTheDocument();
    expect(screen.getByText(EXPECTED_LAYOUT_TEXT.DONATE)).toBeInTheDocument();
  });

  test('given component renders then displays outlet content', () => {
    // When
    renderWithCountry(<StaticLayout />, 'us');

    // Then
    expect(screen.getByText(EXPECTED_LAYOUT_TEXT.PAGE_CONTENT)).toBeInTheDocument();
  });

  test('given component renders then header appears before content', () => {
    // When
    const { container } = renderWithCountry(<StaticLayout />, 'us');

    // Then
    const elements = container.querySelectorAll('*');
    let headerIndex = -1;
    let contentIndex = -1;

    elements.forEach((el, index) => {
      if (el.textContent?.includes(EXPECTED_LAYOUT_TEXT.ABOUT)) headerIndex = index;
      if (el.textContent === EXPECTED_LAYOUT_TEXT.PAGE_CONTENT) contentIndex = index;
    });

    expect(headerIndex).toBeGreaterThan(-1);
    expect(contentIndex).toBeGreaterThan(-1);
    expect(headerIndex).toBeLessThan(contentIndex);
  });
});
