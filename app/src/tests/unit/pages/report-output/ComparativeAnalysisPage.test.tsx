import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { useRegions } from '@/hooks/useRegions';
import { ComparativeAnalysisPage } from '@/pages/report-output/ComparativeAnalysisPage';
import { COMPUTE_DISTRICTS_LABEL } from '@/tests/fixtures/components/flagship/report/stateDistrictComputePanelMocks';
import {
  economyWhere,
  fakeStateDistrictApi,
  NATIONWIDE_OUTPUT_WITH_DISTRICTS,
  STATE_COMPUTING,
  STATE_COUNT,
  STATE_RUNS_BASELINE_POLICY_ID,
  STATE_RUNS_REFORM_POLICY_ID,
  STATE_RUNS_YEAR,
  stateOk,
  US_STATE_REGIONS,
  UTAH,
} from '@/tests/fixtures/hooks/useStateDistrictRunsMocks';

vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(() => ({ data: [] })),
}));

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

describe('ComparativeAnalysisPage congressional district views', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('given Compute on one district view then the other view follows the same run', async () => {
    // Given
    const user = userEvent.setup();
    vi.mocked(useRegions).mockReturnValue({
      data: US_STATE_REGIONS,
      isLoading: false,
      isError: false,
      error: null,
    } as unknown as ReturnType<typeof useRegions>);
    const api = fakeStateDistrictApi({
      economy: economyWhere({ [UTAH]: () => stateOk(UTAH) }, () => STATE_COMPUTING),
    });
    vi.stubGlobal('fetch', api.fetch);
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const pageFor = (view: string) => (
      <QueryClientProvider client={queryClient}>
        <ComparativeAnalysisPage
          output={NATIONWIDE_OUTPUT_WITH_DISTRICTS}
          view={view}
          reformPolicyId={STATE_RUNS_REFORM_POLICY_ID}
          baselinePolicyId={STATE_RUNS_BASELINE_POLICY_ID}
          year={STATE_RUNS_YEAR}
          region="us"
        />
      </QueryClientProvider>
    );
    const { rerender } = render(pageFor('congressional-district-absolute'));
    await user.click(await screen.findByRole('button', { name: COMPUTE_DISTRICTS_LABEL }));
    await waitFor(() => expect(api.economyRequests()).toHaveLength(STATE_COUNT));

    // When
    rerender(pageFor('congressional-district-relative'));

    // Then
    expect(
      await screen.findByText('Relative household income change by congressional district')
    ).toBeInTheDocument();
    expect(screen.getByText('1 of 51 states')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_DISTRICTS_LABEL })).not.toBeInTheDocument();
    expect(api.economyRequests()).toHaveLength(STATE_COUNT);
    expect(api.reportRequests()).toHaveLength(STATE_COUNT);
  });
});
