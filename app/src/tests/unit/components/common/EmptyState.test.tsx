import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import EmptyState from '@/components/common/EmptyState';
import { MOCK_INGREDIENTS } from '@/tests/fixtures/components/common/EmptyStateMocks';

describe('EmptyState', () => {
  test('given policy ingredient then displays lowercase message', () => {
    // When
    render(<EmptyState ingredient={MOCK_INGREDIENTS.POLICY} />);

    // Then
    expect(screen.getByText(/no policy found/i)).toBeInTheDocument();
  });

  test('given population ingredient then displays lowercase message', () => {
    // When
    render(<EmptyState ingredient={MOCK_INGREDIENTS.POPULATION} />);

    // Then
    expect(screen.getByText(/no population found/i)).toBeInTheDocument();
  });

  test('given report ingredient then displays lowercase message', () => {
    // When
    render(<EmptyState ingredient={MOCK_INGREDIENTS.REPORT} />);

    // Then
    expect(screen.getByText(/no report found/i)).toBeInTheDocument();
  });

  test('given simulation ingredient then displays lowercase message', () => {
    // When
    render(<EmptyState ingredient={MOCK_INGREDIENTS.SIMULATION} />);

    // Then
    expect(screen.getByText(/no simulation found/i)).toBeInTheDocument();
  });
});
