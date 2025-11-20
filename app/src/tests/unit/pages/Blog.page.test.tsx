/**
 * Tests for Blog.page component - TOC functionality
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import BlogPage from '@/pages/Blog.page';
import {
  EXPECTED_TOC_SLUGS,
  TEST_SCROLL_OFFSET_PX,
  createMockElementWithPosition,
  mockScrollTo,
  mockPageYOffset,
  setupPostTransformersMocks,
  setupMarkdownMocks,
} from '@/tests/fixtures/pages/blogPageHelpers';

// Setup mocks
setupPostTransformersMocks();
setupMarkdownMocks();

describe('BlogPage - Table of Contents', () => {
  beforeEach(() => {
    // Reset window properties
    delete (window as any).scrollTo;
    delete (window as any).pageYOffset;
  });

  test('given article with headers then TOC is rendered', async () => {
    // Given: Article with multiple headers
    const { container } = render(
      <MemoryRouter initialEntries={['/us/research/test-blog-post']}>
        <Routes>
          <Route path="/:countryId/research/:slug" element={<BlogPage />} />
        </Routes>
      </MemoryRouter>
    );

    // When: Page loads
    await waitFor(() => {
      expect(screen.getByText('First Section')).toBeInTheDocument();
    });

    // Then: TOC headers are visible
    expect(screen.getByText('Second Section')).toBeInTheDocument();
    expect(screen.getByText('Third Section with Special/Characters')).toBeInTheDocument();
  });

  test('given user clicks TOC item then scrolls to correct position', async () => {
    // Given: Setup mocks
    const user = userEvent.setup();
    const scrollToMock = mockScrollTo();
    mockPageYOffset(100);

    // Create mock element at position 500px from viewport top
    const mockElement = createMockElementWithPosition(500);
    document.getElementById = vi.fn().mockReturnValue(mockElement);

    render(
      <MemoryRouter initialEntries={['/us/research/test-blog-post']}>
        <Routes>
          <Route path="/:countryId/research/:slug" element={<BlogPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('First Section')).toBeInTheDocument();
    });

    // When: User clicks TOC item
    await user.click(screen.getByText('First Section'));

    // Then: Scrolls to correct position with offset
    // elementPosition = getBoundingClientRect().top (500) + pageYOffset (100) = 600
    // scroll target = 600 - SCROLL_OFFSET_PX (72) = 528
    expect(scrollToMock).toHaveBeenCalledWith({
      top: 528,
      behavior: 'smooth',
    });
  });

  test('given TOC item clicked then finds element by correct slug', async () => {
    // Given: Setup mocks
    const user = userEvent.setup();
    mockScrollTo();
    mockPageYOffset(0);

    const getElementByIdMock = vi.fn().mockReturnValue(createMockElementWithPosition(200));
    document.getElementById = getElementByIdMock;

    render(
      <MemoryRouter initialEntries={['/us/research/test-blog-post']}>
        <Routes>
          <Route path="/:countryId/research/:slug" element={<BlogPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Second Section')).toBeInTheDocument();
    });

    // When: User clicks TOC item
    await user.click(screen.getByText('Second Section'));

    // Then: getElementById called with correct slug
    expect(getElementByIdMock).toHaveBeenCalledWith(EXPECTED_TOC_SLUGS.SECOND_SECTION);
  });

  test('given special characters in header then generates correct slug', async () => {
    // Given: Setup mocks
    const user = userEvent.setup();
    mockScrollTo();
    mockPageYOffset(0);

    const getElementByIdMock = vi.fn().mockReturnValue(createMockElementWithPosition(300));
    document.getElementById = getElementByIdMock;

    render(
      <MemoryRouter initialEntries={['/us/research/test-blog-post']}>
        <Routes>
          <Route path="/:countryId/research/:slug" element={<BlogPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Third Section with Special/Characters')).toBeInTheDocument();
    });

    // When: User clicks TOC item with special characters
    await user.click(screen.getByText('Third Section with Special/Characters'));

    // Then: Slug properly handles special characters (removes /)
    expect(getElementByIdMock).toHaveBeenCalledWith(EXPECTED_TOC_SLUGS.THIRD_SECTION);
  });

  test('given element not found then scroll is not called', async () => {
    // Given: Setup mocks where element doesn't exist
    const user = userEvent.setup();
    const scrollToMock = mockScrollTo();
    mockPageYOffset(0);

    document.getElementById = vi.fn().mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/us/research/test-blog-post']}>
        <Routes>
          <Route path="/:countryId/research/:slug" element={<BlogPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('First Section')).toBeInTheDocument();
    });

    // When: User clicks TOC item (but element doesn't exist in DOM)
    await user.click(screen.getByText('First Section'));

    // Then: scrollTo is not called
    expect(scrollToMock).not.toHaveBeenCalled();
  });

});
