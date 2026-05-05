import { render } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import BudgetaryImpactByProgramSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactByProgramSubPage';
import BudgetaryImpactSubPage from '@/pages/report-output/budgetary-impact/BudgetaryImpactSubPage';
import DistributionalImpactIncomeAverageSubPage from '@/pages/report-output/distributional-impact/DistributionalImpactIncomeAverageSubPage';
import DistributionalImpactIncomeRelativeSubPage from '@/pages/report-output/distributional-impact/DistributionalImpactIncomeRelativeSubPage';
import DistributionalImpactWealthAverageSubPage from '@/pages/report-output/distributional-impact/DistributionalImpactWealthAverageSubPage';
import DistributionalImpactWealthRelativeSubPage from '@/pages/report-output/distributional-impact/DistributionalImpactWealthRelativeSubPage';
import WinnersLosersIncomeDecileSubPage from '@/pages/report-output/distributional-impact/WinnersLosersIncomeDecileSubPage';
import WinnersLosersWealthDecileSubPage from '@/pages/report-output/distributional-impact/WinnersLosersWealthDecileSubPage';
import InequalityImpactSubPage from '@/pages/report-output/inequality-impact/InequalityImpactSubPage';
import DeepPovertyImpactByAgeSubPage from '@/pages/report-output/poverty-impact/DeepPovertyImpactByAgeSubPage';
import DeepPovertyImpactByGenderSubPage from '@/pages/report-output/poverty-impact/DeepPovertyImpactByGenderSubPage';
import PovertyImpactByAgeSubPage from '@/pages/report-output/poverty-impact/PovertyImpactByAgeSubPage';
import PovertyImpactByGenderSubPage from '@/pages/report-output/poverty-impact/PovertyImpactByGenderSubPage';
import PovertyImpactByRaceSubPage from '@/pages/report-output/poverty-impact/PovertyImpactByRaceSubPage';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

const { chartContainerProps, mockMetadata } = vi.hoisted(() => ({
  chartContainerProps: [] as Record<string, any>[],
  mockMetadata: {
    variables: {
      child_benefit: { label: 'Child benefit' },
    },
    economyOptions: { region: [{ name: 'us', label: 'the US' }] },
  },
}));

vi.mock('@/components/ChartContainer', () => ({
  ChartContainer: vi.fn((props: Record<string, any>) => {
    chartContainerProps.push(props);
    return <section>{props.children}</section>;
  }),
}));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: vi.fn((selector: any) => selector({ metadata: mockMetadata })),
  };
});

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(() => 'us'),
}));

vi.mock('@/hooks/useMediaQuery', () => ({
  useMediaQuery: vi.fn(() => false),
}));

vi.mock('@/hooks/useViewportSize', () => ({
  useViewportSize: vi.fn(() => ({ width: 1200, height: 900 })),
}));

vi.mock('recharts', () => ({
  Bar: vi.fn(() => null),
  BarChart: vi.fn(({ children }) => children),
  CartesianGrid: vi.fn(() => null),
  Cell: vi.fn(() => null),
  Label: vi.fn(() => null),
  Legend: vi.fn(() => null),
  ReferenceLine: vi.fn(() => null),
  ResponsiveContainer: vi.fn(({ children }) => children),
  Tooltip: vi.fn(() => null),
  XAxis: vi.fn(() => null),
  YAxis: vi.fn(() => null),
}));

const winnersLosers = {
  deciles: {
    'Gain more than 5%': Array(10).fill(0.1),
    'Gain less than 5%': Array(10).fill(0.2),
    'No change': Array(10).fill(0.3),
    'Lose less than 5%': Array(10).fill(0.2),
    'Lose more than 5%': Array(10).fill(0.2),
  },
  all: {
    'Gain more than 5%': 0.1,
    'Gain less than 5%': 0.2,
    'No change': 0.3,
    'Lose less than 5%': 0.2,
    'Lose more than 5%': 0.2,
  },
};

const output = createMockSocietyWideOutput({
  detailed_budget: {
    child_benefit: { baseline: 10, reform: 12, difference: 2 },
  },
  wealth_decile: {
    average: { '1': 100 },
    relative: { '1': 0.1 },
  },
  intra_decile: winnersLosers,
  intra_wealth_decile: winnersLosers,
  poverty_by_gender: {
    poverty: {
      male: { baseline: 0.1, reform: 0.09 },
      female: { baseline: 0.2, reform: 0.18 },
    },
    deep_poverty: {
      male: { baseline: 0.03, reform: 0.027 },
      female: { baseline: 0.04, reform: 0.036 },
    },
  },
  poverty_by_race: {
    poverty: {
      white: { baseline: 0.1, reform: 0.09 },
      black: { baseline: 0.2, reform: 0.18 },
      hispanic: { baseline: 0.3, reform: 0.24 },
      other: { baseline: 0.4, reform: 0.36 },
    },
  },
}) as any;

describe('full report output chart CSV wiring', () => {
  beforeEach(() => {
    chartContainerProps.length = 0;
  });

  test.each([
    {
      name: 'budgetary impact',
      Component: BudgetaryImpactSubPage,
      filename: 'budgetary-impact.csv',
      header: ['Category', 'Budgetary impact (billions)'],
    },
    {
      name: 'budgetary impact by program',
      Component: BudgetaryImpactByProgramSubPage,
      filename: 'budgetary-impact-by-program.csv',
      header: ['Program', 'Baseline', 'Reform', 'Difference'],
    },
    {
      name: 'income average distributional impact',
      Component: DistributionalImpactIncomeAverageSubPage,
      filename: 'distributional-impact-income-average.csv',
      header: ['Income decile', 'Average change'],
    },
    {
      name: 'income relative distributional impact',
      Component: DistributionalImpactIncomeRelativeSubPage,
      filename: 'distributional-impact-income-relative.csv',
      header: ['Income decile', 'Relative change'],
    },
    {
      name: 'wealth average distributional impact',
      Component: DistributionalImpactWealthAverageSubPage,
      filename: 'distributional-impact-wealth-average.csv',
      header: ['Wealth decile', 'Average change'],
    },
    {
      name: 'wealth relative distributional impact',
      Component: DistributionalImpactWealthRelativeSubPage,
      filename: 'distributional-impact-wealth-relative.csv',
      header: ['Wealth decile', 'Relative change'],
    },
    {
      name: 'income winners and losers',
      Component: WinnersLosersIncomeDecileSubPage,
      filename: 'winners-losers-income-decile.csv',
      header: [
        'Income decile',
        'Gain more than 5%',
        'Gain less than 5%',
        'No change',
        'Lose less than 5%',
        'Lose more than 5%',
      ],
    },
    {
      name: 'wealth winners and losers',
      Component: WinnersLosersWealthDecileSubPage,
      filename: 'winners-losers-wealth-decile.csv',
      header: [
        'Wealth decile',
        'Gain more than 5%',
        'Gain less than 5%',
        'No change',
        'Lose less than 5%',
        'Lose more than 5%',
      ],
    },
    {
      name: 'poverty by age',
      Component: PovertyImpactByAgeSubPage,
      filename: 'poverty-impact-by-age.csv',
      header: ['Age group', 'Baseline', 'Reform', 'Change'],
    },
    {
      name: 'poverty by gender',
      Component: PovertyImpactByGenderSubPage,
      filename: 'poverty-impact-by-gender.csv',
      header: ['Sex', 'Baseline', 'Reform', 'Change'],
    },
    {
      name: 'poverty by race',
      Component: PovertyImpactByRaceSubPage,
      filename: 'poverty-impact-by-race.csv',
      header: ['Race', 'Baseline', 'Reform', 'Change'],
    },
    {
      name: 'deep poverty by age',
      Component: DeepPovertyImpactByAgeSubPage,
      filename: 'deep-poverty-impact-by-age.csv',
      header: ['Age group', 'Baseline', 'Reform', 'Change'],
    },
    {
      name: 'deep poverty by gender',
      Component: DeepPovertyImpactByGenderSubPage,
      filename: 'deep-poverty-impact-by-gender.csv',
      header: ['Sex', 'Baseline', 'Reform', 'Change'],
    },
    {
      name: 'inequality impact',
      Component: InequalityImpactSubPage,
      filename: 'inequality-impact.csv',
      header: ['Metric', 'Baseline', 'Reform', 'Change'],
    },
  ])(
    'given $name then ChartContainer receives CSV filename and rows',
    ({ Component, filename, header }) => {
      render(<Component output={output} />);

      expect(chartContainerProps[chartContainerProps.length - 1]).toMatchObject({
        csvFilename: filename,
        csvData: expect.arrayContaining([header]),
      });
    }
  );
});
