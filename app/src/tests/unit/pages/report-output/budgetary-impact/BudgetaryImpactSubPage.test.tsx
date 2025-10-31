import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import BudgetaryImpactSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage';
import {
  MOCK_LARGE_IMPACT,
  MOCK_NEGATIVE_IMPACT,
  MOCK_POSITIVE_IMPACT,
  MOCK_SMALL_IMPACT,
  MOCK_TRILLION_IMPACT,
  MOCK_ZERO_IMPACT,
} from '@/tests/fixtures/pages/report-output/budgetary-impact/BudgetaryImpactSubPageMocks';

// Mock Plotly
vi.mock('react-plotly.js', () => ({ default: vi.fn(() => null) }));

// Mock hooks
vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

// Mock chart utils
vi.mock('@/utils/chartUtils', () => ({
  DEFAULT_CHART_CONFIG: { displayModeBar: false },
  downloadCsv: vi.fn(),
}));

describe('BudgetaryImpactSubPage', () => {
  test('given positive budgetary impact then displays raise message', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // Then
    expect(screen.getByText(/This reform would raise \$5\.0bn/i)).toBeInTheDocument();
  });

  test('given negative budgetary impact then displays cost message', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_NEGATIVE_IMPACT} />);

    // Then
    expect(screen.getByText(/This reform would cost \$5\.0bn/i)).toBeInTheDocument();
  });

  test('given zero budgetary impact then displays no effect message', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_ZERO_IMPACT} />);

    // Then
    expect(screen.getByText(/This reform would have no effect on the budget/i)).toBeInTheDocument();
  });

  test('given output then renders download CSV button', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // Then
    expect(screen.getByRole('button', { name: /download csv/i })).toBeInTheDocument();
  });

  test('given user clicks download CSV then calls downloadCsv', async () => {
    // Given
    const user = userEvent.setup();
    const { downloadCsv } = await import('@/utils/chartUtils');
    render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // When
    await user.click(screen.getByRole('button', { name: /download csv/i }));

    // Then
    expect(downloadCsv).toHaveBeenCalledWith(
      expect.arrayContaining([expect.arrayContaining([expect.any(String), expect.any(String)])]),
      'budgetary-impact.csv'
    );
  });

  test('given large positive impact then formats with bn suffix', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_LARGE_IMPACT} />);

    // Then
    expect(screen.getByText(/\$12\.3bn/i)).toBeInTheDocument();
  });

  test('given small impact then formats with appropriate suffix', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_SMALL_IMPACT} />);

    // Then
    expect(screen.getByText(/\$500\.0m/i)).toBeInTheDocument();
  });

  test('given trillion impact then formats with tn suffix', () => {
    // When
    render(<BudgetaryImpactSubPage output={MOCK_TRILLION_IMPACT} />);

    // Then
    expect(screen.getByText(/\$2\.5tn/i)).toBeInTheDocument();
  });

  test('given component renders then displays chart container', () => {
    // When
    const { container } = render(<BudgetaryImpactSubPage output={MOCK_POSITIVE_IMPACT} />);

    // Then
    // Verify the component renders without crashing
    expect(container.firstChild).toBeInTheDocument();
  });
});
