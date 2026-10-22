import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { fetchLocalAreaBreakdown } from '@/api/societyWideCalculation';
import { ConstituencySubPage } from '@/pages/report-output/ConstituencySubPage';
import { LocalAuthoritySubPage } from '@/pages/report-output/LocalAuthoritySubPage';
import MigrationSubPage, {
  canShowCongressionalDistrictImpactCard,
} from '@/pages/report-output/MigrationSubPage';
import {
  COMPUTE_BUTTON_LABEL,
  COMPUTING_MESSAGE,
} from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import {
  COMPLETE_RESPONSE,
  QUEUED_RESPONSE,
} from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import { MOCK_UK_REPORT_OUTPUT_WITH_LA } from '@/tests/fixtures/pages/local-authority/localAuthorityComponentMocks';
import {
  BREAKDOWN_CONSTITUENCY_IMPACT,
  BREAKDOWN_LOCAL_AUTHORITY_IMPACT,
  V2_UK_BASELINE_POLICY_ID,
  V2_UK_REFORM_POLICY_ID,
  V2_UK_REGION,
  V2_UK_REPORT,
  V2_UK_REPORT_YEAR,
  v2UKSimulations,
} from '@/tests/fixtures/pages/report-output/ukLocalAreaBreakdownPageMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

const { mockUseCurrentCountry } = vi.hoisted(() => ({
  mockUseCurrentCountry: vi.fn(),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: mockUseCurrentCountry,
}));

vi.mock('@/hooks/useRegions', async () => {
  const { UK_METADATA_REGIONS } =
    await import('@/tests/fixtures/adapters/ukLocalAreaBreakdownAdapterMocks');
  return { useRegions: () => ({ data: UK_METADATA_REGIONS }) };
});

vi.mock('@/api/societyWideCalculation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/societyWideCalculation')>()),
  fetchLocalAreaBreakdown: vi.fn(),
}));

vi.mock('@/contexts/CongressionalDistrictDataContext', () => ({
  CongressionalDistrictDataProvider: vi.fn(({ children }) => (
    <div data-testid="congressional-provider">{children}</div>
  )),
}));

vi.mock('@/pages/report-output/SocietyWideOverview', () => ({
  default: vi.fn(({ showCongressionalCard }: { showCongressionalCard?: boolean }) => (
    <div
      data-testid="society-wide-overview"
      data-show-congressional={String(!!showCongressionalCard)}
    />
  )),
}));

vi.mock('@/pages/report-output/budgetary-impact/BudgetaryImpactByProgramSubPage', () => ({
  default: vi.fn(() => <div data-testid="budgetary-impact-by-program" />),
}));

vi.mock('@/pages/report-output/ConstituencySubPage', () => ({
  ConstituencySubPage: vi.fn(() => <div data-testid="constituency-impact" />),
}));

vi.mock('@/pages/report-output/LocalAuthoritySubPage', () => ({
  LocalAuthoritySubPage: vi.fn(() => <div data-testid="local-authority-impact" />),
}));

vi.mock(
  '@/pages/report-output/distributional-impact/DistributionalImpactWealthAverageSubPage',
  () => ({
    default: vi.fn(() => <div data-testid="wealth-average" />),
  })
);

vi.mock(
  '@/pages/report-output/distributional-impact/DistributionalImpactWealthRelativeSubPage',
  () => ({
    default: vi.fn(() => <div data-testid="wealth-relative" />),
  })
);

vi.mock('@/pages/report-output/distributional-impact/WinnersLosersWealthDecileSubPage', () => ({
  default: vi.fn(() => <div data-testid="wealth-winners-losers" />),
}));

const report: Report = {
  id: 'report-1',
  countryId: 'us',
  year: '2026',
  apiVersion: '1.0.0',
  simulationIds: ['baseline', 'reform'],
  status: 'complete',
  outputType: 'economy',
  output: null,
};

function simulationsForRegion(region: string): Simulation[] {
  return [
    {
      id: 'baseline',
      countryId: 'us',
      label: 'Baseline',
      policyId: 'baseline-policy',
      populationId: region,
      populationType: 'geography',
      isCreated: true,
      status: 'complete',
    },
    {
      id: 'reform',
      countryId: 'us',
      label: 'Reform',
      policyId: 'reform-policy',
      populationId: region,
      populationType: 'geography',
      isCreated: true,
      status: 'complete',
    },
  ];
}

function renderMigrationSubPage(region: string) {
  mockUseCurrentCountry.mockReturnValue('us');
  render(
    <MigrationSubPage
      output={createMockSocietyWideOutput() as any}
      report={report}
      simulations={simulationsForRegion(region)}
    />
  );
}

describe('canShowCongressionalDistrictImpactCard', () => {
  test.each([
    ['us', true],
    ['state/ca', true],
    ['STATE/UT', true],
    ['place/CA-44000', false],
    ['congressional_district/CA-12', false],
  ])('given US region %s then returns %s', (region, expected) => {
    expect(
      canShowCongressionalDistrictImpactCard({
        countryId: 'us',
        reformPolicyId: 'reform-policy',
        baselinePolicyId: 'baseline-policy',
        year: '2026',
        region,
      })
    ).toBe(expected);
  });

  test('given non-US country then returns false', () => {
    expect(
      canShowCongressionalDistrictImpactCard({
        countryId: 'uk',
        reformPolicyId: 'reform-policy',
        baselinePolicyId: 'baseline-policy',
        year: '2026',
        region: 'uk',
      })
    ).toBe(false);
  });
});

describe('MigrationSubPage congressional district card gating', () => {
  test.each(['us', 'state/ca'])(
    'given %s report then shows congressional district card',
    (region) => {
      renderMigrationSubPage(region);

      expect(screen.getByTestId('congressional-provider')).toBeInTheDocument();
      expect(screen.getByTestId('society-wide-overview')).toHaveAttribute(
        'data-show-congressional',
        'true'
      );
    }
  );

  test.each(['place/CA-44000', 'congressional_district/CA-12'])(
    'given %s report then hides congressional district card',
    (region) => {
      renderMigrationSubPage(region);

      expect(screen.queryByTestId('congressional-provider')).not.toBeInTheDocument();
      expect(screen.getByTestId('society-wide-overview')).toHaveAttribute(
        'data-show-congressional',
        'false'
      );
    }
  );
});

describe('MigrationSubPage UK local areas', () => {
  const mockFetchLocalAreaBreakdown = vi.mocked(fetchLocalAreaBreakdown);

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseCurrentCountry.mockReturnValue('uk');
  });

  function renderUKMigrationSubPage(output = createMockSocietyWideOutput() as any) {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <MigrationSubPage output={output} report={V2_UK_REPORT} simulations={v2UKSimulations()} />
      </QueryClientProvider>,
      'uk'
    );
  }

  const openSection = (user: ReturnType<typeof userEvent.setup>, label: string) =>
    user.click(screen.getByRole('button', { name: label }));

  test.each(['Constituency impact', 'Local authority impact'])(
    'given no area data then the %s header offers to compute and nothing is sent',
    async (label) => {
      const user = userEvent.setup();
      renderUKMigrationSubPage();

      await openSection(user, label);

      expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
      expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
    }
  );

  test.each(['Constituency impact', 'Local authority impact'])(
    'given compute clicked in %s then one request goes for the report policies, region and year',
    async (label) => {
      const user = userEvent.setup();
      mockFetchLocalAreaBreakdown.mockResolvedValue(QUEUED_RESPONSE);
      renderUKMigrationSubPage();
      await openSection(user, label);

      await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

      await waitFor(() => expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(1));
      expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledWith(
        'uk',
        V2_UK_REFORM_POLICY_ID,
        V2_UK_BASELINE_POLICY_ID,
        { region: V2_UK_REGION, time_period: V2_UK_REPORT_YEAR }
      );
    }
  );

  test('given the breakdown computing then both opened sections show its progress', async () => {
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(QUEUED_RESPONSE);
    renderUKMigrationSubPage();
    await openSection(user, 'Constituency impact');
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    await openSection(user, 'Local authority impact');

    expect(await screen.findAllByText(COMPUTING_MESSAGE)).toHaveLength(2);
    expect(screen.getAllByRole('progressbar')).toHaveLength(2);
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
  });

  test('given the breakdown complete then both sections show its maps with no second request', async () => {
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    renderUKMigrationSubPage();
    await openSection(user, 'Constituency impact');
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
    expect(await screen.findByTestId('constituency-impact')).toBeInTheDocument();

    await openSection(user, 'Local authority impact');

    expect(screen.getByTestId('local-authority-impact')).toBeInTheDocument();
    expect(vi.mocked(ConstituencySubPage).mock.lastCall?.[0].output).toMatchObject({
      constituency_impact: BREAKDOWN_CONSTITUENCY_IMPACT,
    });
    expect(vi.mocked(LocalAuthoritySubPage).mock.lastCall?.[0].output).toMatchObject({
      local_authority_impact: BREAKDOWN_LOCAL_AUTHORITY_IMPACT,
    });
    expect(mockFetchLocalAreaBreakdown).toHaveBeenCalledTimes(1);
  });

  test('given saved area data then the sections show maps with no compute button', async () => {
    const user = userEvent.setup();
    renderUKMigrationSubPage(MOCK_UK_REPORT_OUTPUT_WITH_LA);

    await openSection(user, 'Constituency impact');
    await openSection(user, 'Local authority impact');

    expect(screen.getByTestId('constituency-impact')).toBeInTheDocument();
    expect(screen.getByTestId('local-authority-impact')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
    expect(mockFetchLocalAreaBreakdown).not.toHaveBeenCalled();
  });

  test('given the breakdown complete then each section gets its level of withheld areas', async () => {
    const user = userEvent.setup();
    mockFetchLocalAreaBreakdown.mockResolvedValue(COMPLETE_RESPONSE);
    renderUKMigrationSubPage();
    await openSection(user, 'Constituency impact');
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
    expect(await screen.findByTestId('constituency-impact')).toBeInTheDocument();

    await openSection(user, 'Local authority impact');

    expect(vi.mocked(ConstituencySubPage).mock.lastCall?.[0]).toMatchObject({
      withheld: { withheld: 2, total: 3 },
    });
    expect(vi.mocked(LocalAuthoritySubPage).mock.lastCall?.[0]).toMatchObject({ withheld: null });
  });

  test('given saved area data then the sections get no withheld areas', async () => {
    const user = userEvent.setup();
    renderUKMigrationSubPage(MOCK_UK_REPORT_OUTPUT_WITH_LA);

    await openSection(user, 'Constituency impact');

    expect(vi.mocked(ConstituencySubPage).mock.lastCall?.[0].withheld).toBeUndefined();
  });
});
