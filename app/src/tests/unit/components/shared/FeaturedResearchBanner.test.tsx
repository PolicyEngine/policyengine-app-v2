import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import FeaturedResearchBanner from '@/components/shared/FeaturedResearchBanner';
import {
  BANNER_CARD_LINKS,
  BANNER_CARD_TITLES,
  BANNER_DISMISSED_KEY,
  CONTACT_EMAIL,
  MOCK_DATE,
} from '@/tests/fixtures/components/shared/FeaturedResearchBannerMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'uk'),
}));

describe('FeaturedResearchBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(MOCK_DATE);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given UK country then banner displays', () => {
    render(<FeaturedResearchBanner />);
    expect(screen.getByText('Explore our latest research and tools')).toBeInTheDocument();
  });

  test('given all analysis cards then display with correct titles', () => {
    render(<FeaturedResearchBanner />);
    expect(screen.getByText(BANNER_CARD_TITLES.SPRING_STATEMENT)).toBeInTheDocument();
    expect(screen.getByText(BANNER_CARD_TITLES.SALARY_SACRIFICE)).toBeInTheDocument();
    expect(screen.getByText(BANNER_CARD_TITLES.STUDENT_LOAN)).toBeInTheDocument();
  });

  test('given analysis cards then link to correct URLs', () => {
    render(<FeaturedResearchBanner />);
    const springLink = screen.getByText(BANNER_CARD_TITLES.SPRING_STATEMENT).closest('a');
    const salaryLink = screen.getByText(BANNER_CARD_TITLES.SALARY_SACRIFICE).closest('a');
    const studentLink = screen.getByText(BANNER_CARD_TITLES.STUDENT_LOAN).closest('a');

    expect(springLink).toHaveAttribute('href', BANNER_CARD_LINKS.SPRING_STATEMENT);
    expect(salaryLink).toHaveAttribute('href', BANNER_CARD_LINKS.SALARY_SACRIFICE);
    expect(studentLink).toHaveAttribute('href', BANNER_CARD_LINKS.STUDENT_LOAN);
  });

  test('given analysis card links then open in same tab', () => {
    render(<FeaturedResearchBanner />);
    const salaryLink = screen.getByText(BANNER_CARD_TITLES.SALARY_SACRIFICE).closest('a');
    expect(salaryLink).not.toHaveAttribute('target', '_blank');
  });

  test('given contact CTA then displays with correct email link', () => {
    render(<FeaturedResearchBanner />);
    expect(screen.getByText(/Want custom analysis\?/i)).toBeInTheDocument();
    const contactLink = screen.getByText('Contact us');
    expect(contactLink).toHaveAttribute('href', CONTACT_EMAIL);
  });

  test('given close button present then banner can be dismissed', () => {
    render(<FeaturedResearchBanner />);
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  test('given previously dismissed banner then does not display', () => {
    sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');
    render(<FeaturedResearchBanner />);
    expect(screen.queryByText('Explore our latest research and tools')).not.toBeInTheDocument();
  });
});
