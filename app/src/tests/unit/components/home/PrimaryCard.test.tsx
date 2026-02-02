import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import PrimaryCard from '@/components/home/PrimaryCard';
import {
  MOCK_POST_NO_IMAGE,
  MOCK_US_POST_NEWEST,
} from '@/tests/fixtures/components/home/blogPreviewMocks';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

describe('PrimaryCard', () => {
  test('given a post then renders the title', () => {
    // When
    render(<PrimaryCard post={MOCK_US_POST_NEWEST} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText(MOCK_US_POST_NEWEST.title)).toBeInTheDocument();
  });

  test('given a post then renders the description', () => {
    // When
    render(<PrimaryCard post={MOCK_US_POST_NEWEST} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText(MOCK_US_POST_NEWEST.description)).toBeInTheDocument();
  });

  test('given a post then renders a formatted date', () => {
    // When
    render(<PrimaryCard post={MOCK_US_POST_NEWEST} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText('Jan 13, 2026')).toBeInTheDocument();
  });

  test('given a post with image then renders the image with alt text', () => {
    // When
    render(<PrimaryCard post={MOCK_US_POST_NEWEST} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    const img = screen.getByAltText(MOCK_US_POST_NEWEST.title);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', `/assets/posts/${MOCK_US_POST_NEWEST.image}`);
  });

  test('given a post without image then does not render an img element', () => {
    // When
    render(<PrimaryCard post={MOCK_POST_NO_IMAGE} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('given a post then links to the research page', () => {
    // When
    render(<PrimaryCard post={MOCK_US_POST_NEWEST} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      `/${TEST_COUNTRY_IDS.US}/research/${MOCK_US_POST_NEWEST.slug}`
    );
  });

  test('given a post then renders read more text', () => {
    // When
    render(<PrimaryCard post={MOCK_US_POST_NEWEST} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText(/read more/i)).toBeInTheDocument();
  });
});
