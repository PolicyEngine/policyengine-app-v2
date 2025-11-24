import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import AutumnBudgetBanner from '@/components/shared/AutumnBudgetBanner';
import {
  BANNER_CARD_TITLES,
  BANNER_DISMISSED_KEY,
  BANNER_LINKS,
  CONTACT_EMAIL,
  MOCK_DATE_AFTER_BUDGET,
  MOCK_DATE_AFTER_END,
  MOCK_DATE_BEFORE_BUDGET,
} from '@/tests/fixtures/components/shared/AutumnBudgetBannerMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'uk'),
}));

describe('AutumnBudgetBanner', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given UK country and before end date then banner displays', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.getByText(/The Autumn Budget 2025 is coming soon/i)).toBeInTheDocument();
  });

  test('given after end date then banner does not display', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_END);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.queryByText(/The Autumn Budget 2025/i)).not.toBeInTheDocument();
  });

  test('given before budget date then countdown timer displays', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

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
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.queryByText('Days')).not.toBeInTheDocument();
    expect(screen.queryByText('Hours')).not.toBeInTheDocument();
  });

  test('given all analysis cards then display with correct titles', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.getByText(BANNER_CARD_TITLES.TWO_CHILD_LIMIT)).toBeInTheDocument();
    expect(screen.getByText(BANNER_CARD_TITLES.VAT_THRESHOLDS)).toBeInTheDocument();
    expect(screen.getByText(BANNER_CARD_TITLES.INCOME_TAX_NI)).toBeInTheDocument();
  });

  test('given analysis cards then link to correct URLs', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    const twoChildLink = screen.getByText(BANNER_CARD_TITLES.TWO_CHILD_LIMIT).closest('a');
    const vatLink = screen.getByText(BANNER_CARD_TITLES.VAT_THRESHOLDS).closest('a');
    const incomeTaxLink = screen.getByText(BANNER_CARD_TITLES.INCOME_TAX_NI).closest('a');

    expect(twoChildLink).toHaveAttribute('href', BANNER_LINKS.TWO_CHILD_LIMIT);
    expect(vatLink).toHaveAttribute('href', BANNER_LINKS.VAT_THRESHOLDS);
    expect(incomeTaxLink).toHaveAttribute('href', BANNER_LINKS.INCOME_TAX_NI);
  });

  test('given analysis card links then open in new tab', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    const twoChildLink = screen.getByText(BANNER_CARD_TITLES.TWO_CHILD_LIMIT).closest('a');
    expect(twoChildLink).toHaveAttribute('target', '_blank');
    expect(twoChildLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('given contact CTA then displays with correct email link', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.getByText(/Want custom analysis\?/i)).toBeInTheDocument();
    const contactLink = screen.getByText('Contact us');
    expect(contactLink).toHaveAttribute('href', CONTACT_EMAIL);
  });

  test('given close button present then banner can be dismissed', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);
    render(<AutumnBudgetBanner />);

    // Then
    const closeButton = screen.getByRole('button');
    expect(closeButton).toBeInTheDocument();
  });

  test('given previously dismissed banner then does not display', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);
    sessionStorage.setItem(BANNER_DISMISSED_KEY, 'true');

    // When
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.queryByText(/The Autumn Budget 2025/i)).not.toBeInTheDocument();
  });

  test('given before budget date then title shows coming soon', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_BEFORE_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.getByText('The Autumn Budget 2025 is coming soon')).toBeInTheDocument();
  });

  test('given after budget date then title shows without coming soon', () => {
    // Given
    vi.setSystemTime(MOCK_DATE_AFTER_BUDGET);

    // When
    render(<AutumnBudgetBanner />);

    // Then
    expect(screen.getByText('The Autumn Budget 2025')).toBeInTheDocument();
    expect(screen.queryByText('The Autumn Budget 2025 is coming soon')).not.toBeInTheDocument();
  });
});
