import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { ComparativeAnalysisPage } from '@/pages/report-output/ComparativeAnalysisPage';

// Mock child components
vi.mock('@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage', () => ({
  default: () => <div data-testid="budgetary-impact-overall">Budgetary Impact Overall</div>,
}));

vi.mock('@/pages/report-output/budgetary-impact/BudgetaryImpactByProgramSubPage', () => ({
  default: () => <div data-testid="budgetary-impact-by-program">Budgetary Impact By Program</div>,
}));

vi.mock('@/pages/report-output/NotFoundSubPage', () => ({
  default: () => <div data-testid="not-found">Page Not Found</div>,
}));

const MOCK_OUTPUT = {
  budget: {
    budgetary_impact: 5e9,
    tax_revenue_impact: 3e9,
    state_tax_revenue_impact: 1e9,
    benefit_spending_impact: -1e9,
  },
} as any;

describe('ComparativeAnalysisPage', () => {
  test('given budgetary-impact-overall view then renders BudgetaryImpactSubPage', () => {
    // When
    render(<ComparativeAnalysisPage output={MOCK_OUTPUT} view="budgetary-impact-overall" />);

    // Then
    expect(screen.getByTestId('budgetary-impact-overall')).toBeInTheDocument();
  });

  test('given budgetary-impact-by-program view then renders BudgetaryImpactByProgramSubPage', () => {
    // When
    render(<ComparativeAnalysisPage output={MOCK_OUTPUT} view="budgetary-impact-by-program" />);

    // Then
    expect(screen.getByTestId('budgetary-impact-by-program')).toBeInTheDocument();
  });

  test('given unknown view then renders NotFoundSubPage', () => {
    // When
    render(<ComparativeAnalysisPage output={MOCK_OUTPUT} view="invalid-view-name" />);

    // Then
    expect(screen.getByTestId('not-found')).toBeInTheDocument();
  });

  test('given no view then defaults to budgetary-impact-overall', () => {
    // When
    render(<ComparativeAnalysisPage output={MOCK_OUTPUT} />);

    // Then
    expect(screen.getByTestId('budgetary-impact-overall')).toBeInTheDocument();
  });

  test('given undefined view then defaults to budgetary-impact-overall', () => {
    // When
    render(<ComparativeAnalysisPage output={MOCK_OUTPUT} view={undefined} />);

    // Then
    expect(screen.getByTestId('budgetary-impact-overall')).toBeInTheDocument();
  });

  test('given empty string view then defaults to budgetary-impact-overall', () => {
    // When
    render(<ComparativeAnalysisPage output={MOCK_OUTPUT} view="" />);

    // Then
    expect(screen.getByTestId('budgetary-impact-overall')).toBeInTheDocument();
  });
});
