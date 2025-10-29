import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import TeamPage from '@/pages/Team.page';

describe('TeamPage', () => {
  test('given page loads then hero section is rendered', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    expect(screen.getByRole('heading', { name: /our people/i, level: 1 })).toBeInTheDocument();
  });

  test('given page loads then hero description is visible', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    expect(
      screen.getByText(/policyengine.*team leads a global movement/i)
    ).toBeInTheDocument();
  });

  test('given page loads then founders section is rendered', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    expect(screen.getByRole('heading', { name: /founders/i, level: 2 })).toBeInTheDocument();
  });

  test('given page loads then team section is rendered', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    expect(screen.getByRole('heading', { name: /^team$/i, level: 2 })).toBeInTheDocument();
  });

  test('given page loads then founder names are displayed', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    expect(screen.getByText(/max ghenis/i)).toBeInTheDocument();
    expect(screen.getByText(/nikhil woodruff/i)).toBeInTheDocument();
  });

  test('given page loads then staff names are displayed', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    expect(screen.getByText(/pavel makarchuk/i)).toBeInTheDocument();
    expect(screen.getByText(/anthony volk/i)).toBeInTheDocument();
    expect(screen.getByText(/ziming hua/i)).toBeInTheDocument();
  });

  test('given page loads then team member images are rendered', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    const images = screen.getAllByRole('img');
    expect(images.length).toBeGreaterThan(0);
  });

  test('given page loads then founder bios contain key information', () => {
    // Given / When
    render(<TeamPage />);

    // Then
    expect(screen.getByText(/co-founder and ceo/i)).toBeInTheDocument();
    expect(screen.getByText(/co-founder and cto/i)).toBeInTheDocument();
  });

  test('given page loads then component renders without error', () => {
    // Given / When
    const { container } = render(<TeamPage />);

    // Then
    expect(container.firstChild).toBeInTheDocument();
  });
});
