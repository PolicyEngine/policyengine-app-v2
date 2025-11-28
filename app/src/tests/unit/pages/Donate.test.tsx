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
      screen.getByText(/policyengine is a nonprofit building free, open-source tools/i)
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
    expect(screen.getByText(/policy analysis/i)).toBeInTheDocument();
    expect(screen.getByText(/benefit access/i)).toBeInTheDocument();
    expect(screen.getByText(/open-source development/i)).toBeInTheDocument();
    expect(screen.getByText(/global reach/i)).toBeInTheDocument();
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
    const donateButton = screen.getByRole('link', { name: /donate now/i });
    expect(donateButton).toBeInTheDocument();
    expect(donateButton).toHaveAttribute('href', 'https://opencollective.com/policyengine');
  });

  test('given page loads then PSL Foundation is mentioned', () => {
    // Given / When
    render(<DonatePage />);

    // Then
    expect(screen.getByText(/fiscal sponsor, the psl foundation/i)).toBeInTheDocument();
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
