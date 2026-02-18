import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FeaturedResearchBanner from '@/components/shared/FeaturedResearchBanner';
import {
  BANNER_CARD_LINKS,
  BANNER_CARD_TITLES,
  BANNER_DISMISSED_KEY,
  CONTACT_EMAIL,
  MOCK_DATE_AFTER_BUDGET,
  MOCK_DATE_BEFORE_BUDGET,
} from '@/tests/fixtures/components/shared/FeaturedResearchBannerMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'uk'),
}));

describe('FeaturedResearchBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given UK country then banner displays', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);

    // When
    render(<FeaturedResearchBanner />);

    // Then
    expect(screen.getByText('Explore our latest research and tools')).toBeInTheDocument();
  });

  test('given before budget date then countdown timer displays', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<FeaturedResearchBanner />);

    // Then
    expect(screen.getByText('Days')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();
    expect(screen.getByText('Minutes')).toBeInTheDocument();
    expect(screen.getByText('Seconds')).toBeInTheDocument();
  });

  test('given after budget date then countdown timer does not display', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);

    // When
    render(<FeaturedResearchBanner />);

    // Then
    expect(screen.queryByText('Days')).not.toBeInTheDocument();
    expect(screen.queryByText('Hours')).not.toBeInTheDocument();
  });

  test('given all analysis cards then display with correct titles', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);

    // When
    render(<FeaturedResearchBanner />);

    // Then
    expect(screen.getByText(BANNER_CARD_TITLES.SALARY_SACRIFICE)).toBeInTheDocument();
    expect(screen.getByText(BANNER_CARD_TITLES.STUDENT_LOAN)).toBeInTheDocument();
    expect(screen.getByText(BANNER_CARD_TITLES.SCOTTISH_BUDGET)).toBeInTheDocument();
  });

  test('given analysis cards then link to correct URLs', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);

    // When
    render(<FeaturedResearchBanner />);

    // Then
    const salaryLink = screen.getByText(BANNER_CARD_TITLES.SALARY_SACRIFICE).closest('a');
    const studentLink = screen.getByText(BANNER_CARD_TITLES.STUDENT_LOAN).closest('a');
    const scottishLink = screen.getByText(BANNER_CARD_TITLES.SCOTTISH_BUDGET).closest('a');

    expect(salaryLink).toHaveAttribute('href', BANNER_CARD_LINKS.SALARY_SACRIFICE);
    expect(studentLink).toHaveAttribute('href', BANNER_CARD_LINKS.STUDENT_LOAN);
    expect(scottishLink).toHaveAttribute('href', BANNER_CARD_LINKS.SCOTTISH_BUDGET);
  });

  test('given analysis card links then open in same tab', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);

    // When
    render(<FeaturedResearchBanner />);

    // Then
    const salaryLink = screen.getByText(BANNER_CARD_TITLES.SALARY_SACRIFICE).closest('a');
    expect(salaryLink).not.toHaveAttribute('target', '_blank');
  });

  test('given contact CTA then displays with correct email link', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);

    // When
    render(<FeaturedResearchBanner />);

    // Then
    expect(screen.getByText(/Want custom analysis\?/i)).toBeInTheDocument();
    const contactLink = screen.getByText('Contact us');
    expect(contactLink).toHaveAttribute('href', CONTACT_EMAIL);
  });

  test('given close button present then banner can be dismissed', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);
    render(<FeaturedResearchBanner />);

    // Then
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  test('given previously dismissed banner then does not display', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');

    // When
    render(<FeaturedResearchBanner />);

    // Then
    expect(screen.queryByText('Explore our latest research and tools')).not.toBeInTheDocument();
  });
});
