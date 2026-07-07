import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import MigrationSubPage, {
  canShowCongressionalDistrictImpactCard,
} from '@/pages/report-output/MigrationSubPage';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';
import type { Report } from '@/types/ingredients/Report';
import type { Simulation } from '@/types/ingredients/Simulation';

const { mockUseCurrentCountry } = vi.hoisted(() => ({
  mockUseCurrentCountry: vi.fn(),
}));

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: mockUseCurrentCountry,
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
