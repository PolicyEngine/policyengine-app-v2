import { renderWithCountry, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HomeBlogPreview from '@/components/home/HomeBlogPreview';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';
import type { BlogPost } from '@/types/blog';

// Define mock posts inline so vi.mock factory can reference them via vi.hoisted
const mockPosts = vi.hoisted(() => {
  const base = {
    authors: ['test-author'],
    filename: 'test.md',
    image: 'test.jpg',
  };

  return [
    {
      ...base,
      title: 'Global post newest',
      description: 'Global desc',
      date: '2026-01-20 12:00:00',
      tags: ['global', 'org'],
      slug: 'global-post-newest',
    },
    {
      ...base,
      title: 'US post second',
      description: 'US second desc',
      date: '2026-01-13 12:00:00',
      tags: ['us', 'policy'],
      slug: 'us-post-second',
    },
    {
      ...base,
      title: 'US post third',
      description: 'US third desc',
      date: '2026-01-12 12:00:00',
      tags: ['us', 'policy'],
      slug: 'us-post-third',
    },
    {
      ...base,
      title: 'US post fourth',
      description: 'US fourth desc',
      date: '2026-01-05 12:00:00',
      tags: ['us', 'technical'],
      slug: 'us-post-fourth',
    },
    {
      ...base,
      title: 'US post fifth',
      description: 'US fifth desc',
      date: '2026-01-04 12:00:00',
      tags: ['us', 'policy'],
      slug: 'us-post-fifth',
    },
    {
      ...base,
      title: 'US post sixth should not appear',
      description: 'Sixth desc',
      date: '2026-01-03 12:00:00',
      tags: ['us', 'policy'],
      slug: 'us-post-sixth',
    },
  ] as BlogPost[];
});

// Mock the postTransformers module to control which posts are returned
vi.mock('@/data/posts/postTransformers', () => ({
  posts: mockPosts,
}));

describe('HomeBlogPreview', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given US country then renders section heading', () => {
    // When
    renderWithCountry(<HomeBlogPreview />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.getByText('Expert policy analysis')).toBeInTheDocument();
  });

  test('given US country then renders view all research link', () => {
    // When
    renderWithCountry(<HomeBlogPreview />, TEST_COUNTRY_IDS.US);

    // Then
    const link = screen.getByText(/view all research/i);
    expect(link).toBeInTheDocument();
    expect(link.closest('a')).toHaveAttribute('href', `/${TEST_COUNTRY_IDS.US}/research`);
  });

  test('given US country then renders exactly 5 post titles', () => {
    // When
    renderWithCountry(<HomeBlogPreview />, TEST_COUNTRY_IDS.US);

    // Then - the 5 newest US/global posts should render
    expect(screen.getByText(mockPosts[0].title)).toBeInTheDocument();
    expect(screen.getByText(mockPosts[1].title)).toBeInTheDocument();
    expect(screen.getByText(mockPosts[2].title)).toBeInTheDocument();
    expect(screen.getByText(mockPosts[3].title)).toBeInTheDocument();
    expect(screen.getByText(mockPosts[4].title)).toBeInTheDocument();
  });

  test('given US country then does not render the 6th post', () => {
    // When
    renderWithCountry(<HomeBlogPreview />, TEST_COUNTRY_IDS.US);

    // Then
    expect(screen.queryByText(mockPosts[5].title)).not.toBeInTheDocument();
  });

  test('given posts are available then renders them newest first', () => {
    // When
    renderWithCountry(<HomeBlogPreview />, TEST_COUNTRY_IDS.US);

    // Then - the global post (Jan 20) should appear before the US post (Jan 13)
    const allLinks = screen.getAllByRole('link');
    const researchLinks = allLinks.filter((link) =>
      link.getAttribute('href')?.includes('/research/')
    );
    expect(researchLinks[0]).toHaveAttribute(
      'href',
      `/${TEST_COUNTRY_IDS.US}/research/${mockPosts[0].slug}`
    );
  });
});
