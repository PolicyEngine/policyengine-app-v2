import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import SecondaryCard from '@/components/home/SecondaryCard';
import {
  MOCK_POST_NO_IMAGE,
  MOCK_US_POST_SECOND,
} from '@/tests/fixtures/components/home/blogPreviewMocks';
import { TEST_COUNTRY_IDS } from '@/tests/fixtures/components/homeHeader/CountrySelectorMocks';

describe('SecondaryCard', () => {
  test('given a post then renders the title', () => {
    // When
    render(<SecondaryCard post={MOCK_US_POST_SECOND} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText(MOCK_US_POST_SECOND.title)).toBeInTheDocument();
  });

  test('given a post then renders the description', () => {
    // When
    render(<SecondaryCard post={MOCK_US_POST_SECOND} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText(MOCK_US_POST_SECOND.description)).toBeInTheDocument();
  });

  test('given a post then renders a formatted date', () => {
    // When
    render(<SecondaryCard post={MOCK_US_POST_SECOND} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText('Jan 12, 2026')).toBeInTheDocument();
  });

  test('given a post with image then renders the image with alt text', () => {
    // When
    render(<SecondaryCard post={MOCK_US_POST_SECOND} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    const img = screen.getByAltText(MOCK_US_POST_SECOND.title);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', `/assets/posts/${MOCK_US_POST_SECOND.image}`);
  });

  test('given a post without image then does not render an img element', () => {
    // When
    render(<SecondaryCard post={MOCK_POST_NO_IMAGE} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.queryByRole('img')).not.toBeInTheDocument();
  });

  test('given a post then links to the research page', () => {
    // When
    render(<SecondaryCard post={MOCK_US_POST_SECOND} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute(
      'href',
      `/${TEST_COUNTRY_IDS.US}/research/${MOCK_US_POST_SECOND.slug}`
    );
  });

  test('given a post then renders read link text', () => {
    // When
    render(<SecondaryCard post={MOCK_US_POST_SECOND} countryId={TEST_COUNTRY_IDS.US} />);

    // Then
    expect(screen.getByText(/read/i)).toBeInTheDocument();
  });
});
