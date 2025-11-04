import { render, screen, userEvent } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import LegacyBanner from '@/components/shared/LegacyBanner';

// Mock the useCurrentCountry hook
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

describe('LegacyBanner', () => {
  const originalDate = Date;

  beforeEach(() => {
    // Clear session storage before each test
    sessionStorage.clear();
  });

  afterEach(() => {
    global.Date = originalDate;
    sessionStorage.clear();
  });

  test('given date before November 10 2025 then displays preview message', () => {
    // Mock date to be before cutoff
    const mockDate = new Date('2025-11-09');
    vi.setSystemTime(mockDate);

    render(<LegacyBanner />);

    expect(
      screen.getByText(/You're viewing a preview of our redesigned website/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/To visit our legacy website, click/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /here/i })).toHaveAttribute(
      'href',
      'https://legacy.policyengine.org/us'
    );
  });

  test('given date on November 10 2025 then displays welcome message', () => {
    // Mock date to be on cutoff
    const mockDate = new Date('2025-11-10');
    vi.setSystemTime(mockDate);

    render(<LegacyBanner />);

    expect(screen.getByText(/Welcome to our redesigned website/i)).toBeInTheDocument();
    expect(screen.getByText(/To visit our legacy website, click/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /here/i })).toHaveAttribute(
      'href',
      'https://legacy.policyengine.org/us'
    );
  });

  test('given date after November 10 2025 then displays welcome message', () => {
    // Mock date to be after cutoff
    const mockDate = new Date('2025-11-11');
    vi.setSystemTime(mockDate);

    render(<LegacyBanner />);

    expect(screen.getByText(/Welcome to our redesigned website/i)).toBeInTheDocument();
    expect(screen.getByText(/To visit our legacy website, click/i)).toBeInTheDocument();
  });

  test('given UK country then link points to UK legacy site', async () => {
    const { useCurrentCountry } = await import('@/hooks/useCurrentCountry');
    vi.mocked(useCurrentCountry).mockReturnValue('uk');

    render(<LegacyBanner />);

    expect(screen.getByRole('link', { name: /here/i })).toHaveAttribute(
      'href',
      'https://legacy.policyengine.org/uk'
    );
  });

  test('given banner renders then link opens in new tab', () => {
    render(<LegacyBanner />);

    const link = screen.getByRole('link', { name: /here/i });
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  test('given close button clicked then banner is hidden', async () => {
    const user = userEvent.setup();
    render(<LegacyBanner />);

    // Banner should be visible initially
    expect(screen.getByText(/redesigned website/i)).toBeInTheDocument();

    // Click the close button
    const closeButton = screen.getByRole('button', { name: /dismiss banner/i });
    await user.click(closeButton);

    // Banner should be hidden
    expect(screen.queryByText(/redesigned website/i)).not.toBeInTheDocument();

    // Session storage should be set
    expect(sessionStorage.getItem('legacy-banner-dismissed')).toBe('true');
  });

  test('given banner was previously dismissed then does not render', () => {
    // Set session storage to indicate banner was dismissed
    sessionStorage.setItem('legacy-banner-dismissed', 'true');

    render(<LegacyBanner />);

    // Banner should not be visible
    expect(screen.queryByText(/redesigned website/i)).not.toBeInTheDocument();
  });

  test('given banner renders then close button is accessible', () => {
    render(<LegacyBanner />);

    const closeButton = screen.getByRole('button', { name: /dismiss banner/i });
    expect(closeButton).toBeInTheDocument();
    expect(closeButton).toHaveAccessibleName('Dismiss banner');
  });
});
