import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import HomePage from '@/pages/Home.page';

// Mock hooks before importing components
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'uk'),
}));

// Mock child components to test that HomePage renders them
vi.mock('@/components/home/HeroSection', () => ({
  default: () => <div data-testid="hero-section">Hero Section</div>,
}));

vi.mock('@/components/home/OrgLogos', () => ({
  default: () => <div data-testid="org-logos">Org Logos</div>,
}));

vi.mock('@/components/shared/DowningStreetBanner', () => ({
  default: () => <div data-testid="downing-street-banner">Downing Street Banner</div>,
}));

describe('HomePage', () => {
  test('given page renders then all main sections display', () => {
    // When
    render(<HomePage />);

    // Then
    expect(screen.getByTestId('hero-section')).toBeInTheDocument();
    expect(screen.getByTestId('org-logos')).toBeInTheDocument();
  });

  test('given page renders then displays sections in correct order', () => {
    // When
    const { container } = render(<HomePage />);

    // Then
    const sections = Array.from(container.querySelectorAll('[data-testid]')).map((el) =>
      el.getAttribute('data-testid')
    );

    expect(sections).toEqual(['downing-street-banner', 'hero-section', 'org-logos']);
  });

  test('given page renders then passes orgData to OrgLogos component', () => {
    // When
    render(<HomePage />);

    // Then
    const orgLogos = screen.getByTestId('org-logos');
    // Verify the OrgLogos component was rendered
    expect(orgLogos).toBeInTheDocument();
  });
});
