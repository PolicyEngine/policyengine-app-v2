import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import DonatePage from '@/pages/Donate.page';

describe('DonatePage', () => {
  test('given page loads then hero section is rendered', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(screen.getByRole('heading', { name: /donate/i, level: 1 })).toBeInTheDocument();
  });

  test('given page loads then mission statement is visible', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(
      screen.getByText(/your donation to policyengine isn't just a gift/i)
    ).toBeInTheDocument();
  });

  test('given page loads then support section is rendered', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(
      screen.getByRole('heading', { name: /the difference your support makes/i, level: 2 })
    ).toBeInTheDocument();
  });

  test('given page loads then all four benefit items are displayed', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(screen.getByText(/comprehensive policy analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/streamlined benefit access/i)).toBeInTheDocument();
    expect(screen.getByText(/open-source development/i)).toBeInTheDocument();
    expect(screen.getByText(/global impact/i)).toBeInTheDocument();
  });

  test('given page loads then how to donate section is rendered', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(screen.getByRole('heading', { name: /how to donate/i, level: 2 })).toBeInTheDocument();
  });

  test('given page loads then donation button is rendered', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    const donateButton = screen.getByRole('link', { name: /support transparent/i });
    expect(donateButton).toBeInTheDocument();
    expect(donateButton).toHaveAttribute('href', 'https://opencollective.com/policyengine');
  });

  test('given page loads then contact email link is present', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    const emailLink = screen.getByRole('link', { name: /hello@policyengine.org/i });
    expect(emailLink).toBeInTheDocument();
    expect(emailLink).toHaveAttribute('href', 'mailto:hello@policyengine.org');
  });

  test('given page loads then PSL Foundation caption is displayed', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(
      screen.getByText(/donate on open collective through our fiscal sponsor/i)
    ).toBeInTheDocument();
  });

  test('given page loads then tax deductibility information is shown', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(screen.getByText(/donations are tax-deductible in the us/i)).toBeInTheDocument();
  });

  test('given page loads then check mailing address is provided', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(screen.getByText(/2108 greene st/i)).toBeInTheDocument();
    expect(screen.getByText(/columbia, sc 29250/i)).toBeInTheDocument();
  });
});
