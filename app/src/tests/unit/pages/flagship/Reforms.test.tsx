import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderWithCountry, screen, userEvent, waitFor, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { clearDraftReform, draftYear, getDraftReform } from '@/libs/draftReform';
import { saveReportMeta } from '@/libs/flagship/runReport';
import ReformsPage from '@/pages/flagship/Reforms.page';
import { clearMetadata } from '@/reducers/metadataReducer';
import { store } from '@/store';
import { seedDeductionMetadata } from '@/tests/fixtures/components/flagship/draftEditorFixtures';
import {
  FEDERAL_ENACTED,
  FEDERAL_PROPOSED,
  FEDERAL_UNTRACKED,
  FILTER_BILLS,
  GEORGIA_VETOED,
  UTAH_ENACTED,
  UTAH_PROPOSED,
} from '@/tests/fixtures/libs/flagship/billFilterMocks';
import {
  REMOVED_US_PARAMETER,
  v1PolicyContent,
} from '@/tests/fixtures/libs/flagship/missingParametersMocks';
import {
  KEPT_PARAMETER_CHANGE,
  REFORM_WITH_ONLY_REMOVED_PARAMETERS,
  REFORM_WITH_REMOVED_PARAMETER,
  REMOVED_PROVISION,
} from '@/tests/fixtures/libs/flagship/missingParameterTransferMocks';
import type { Reform } from '@/types/ingredients/Reform';

const mockFindMine = vi.fn();
const mockDelete = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/api/reformStore', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/reformStore')>();
  return {
    ...actual,
    getReformStore: () => ({
      findMine: mockFindMine,
      delete: mockDelete,
      create: mockCreate,
      update: mockUpdate,
    }),
  };
});

const mockRun = vi.fn();

vi.mock('@/hooks/useRunFlagshipReport', () => ({
  useRunFlagshipReport: () => ({ run: mockRun, isRunning: false, error: null }),
}));

const mockFindReports = vi.fn();

vi.mock('@/api/flagshipReportStore', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/flagshipReportStore')>()),
  getFlagshipReportStore: () => ({ findMine: mockFindReports }),
}));

/** Replaces the report reads below for one test; cleared before each re-run test. */
const mockFetchReportByIdOverride: { current: (() => Promise<unknown>) | null } = {
  current: null,
};

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: async (_countryId: string, reportId: string) =>
    mockFetchReportByIdOverride.current?.() ?? {
      id: reportId,
      status: reportId === '901' ? 'complete' : 'pending',
      year: reportId === '904' ? '2028' : '2026',
      simulation_1_id: '9',
      simulation_2_id: '10',
    },
}));

const mockFetchPolicyById = vi.fn();

vi.mock('@/api/policy', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/policy')>()),
  fetchPolicyById: (...args: unknown[]) => mockFetchPolicyById(...args),
}));

// Every report's baseline simulation: Maryland, run against policy 88.
vi.mock('@/api/simulation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/simulation')>()),
  fetchSimulationById: async () => ({
    population_type: 'geography',
    population_id: 'state/md',
    policy_id: '88',
  }),
}));

const mockFetchTrackerBills = vi.fn();

vi.mock('@/api/billFeed', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/billFeed')>();
  return {
    ...actual,
    fetchTrackerBills: () => mockFetchTrackerBills(),
  };
});

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ countryId: 'us' }),
  };
});

const CHAT_REFORM: Reform = {
  id: 'rf-1',
  countryId: 'us',
  label: 'CTC to $3,600 for children under 6',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
    },
  ],
  baseline: 'current-law',
  provenance: { source: 'chat', ref: 'session-1' },
  updatedAt: '2026-08-01T00:00:00Z',
};

/** The transfer dialogs, by their titles. */
const REFORM_DIALOG_NAME = 'This reform uses parameters the model no longer has';
const REPORT_DIALOG_NAME = 'This report uses parameters the model no longer has';

/** A change to a parameter the model no longer has, as a saved reform keeps it. */
const REMOVED_PARAMETER_CHANGE = {
  name: REMOVED_US_PARAMETER,
  values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 0 }],
};

/** A value that starts after the report year, as Build saves "Applies from 2028". */
const LATER_REFORM: Reform = {
  ...CHAT_REFORM,
  id: 'rf-2',
  label: 'CTC to $1,000 from 2028',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [{ startDate: '2028-01-01', endDate: '2100-12-31', value: 1000 }],
    },
  ],
};

/** A schedule: a value for each year, as an indexed amount saves. */
const SCHEDULE_REFORM: Reform = {
  ...CHAT_REFORM,
  id: 'rf-3',
  label: 'CTC indexed',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [
        { startDate: '2026-01-01', endDate: '2026-12-31', value: 2500 },
        { startDate: '2027-01-01', endDate: '2027-12-31', value: 2550 },
        { startDate: '2028-01-01', endDate: '2100-12-31', value: 2600 },
      ],
    },
  ],
};

/**
 * Three bills standing in for the tracker feed. The feed is the only
 * source of bills in the app, so the fixture lives with the tests that
 * need it rather than shipping as data.
 */
const FEED_BILLS = [
  {
    id: 'ut-hb-106',
    countryId: 'us' as const,
    jurisdiction: 'Utah',
    state: 'UT',
    title: 'HB 106 — income tax rate reduction',
    status: 'Enacted',
    summary: 'Reduces the individual income tax rate from 4.55% to 4.45%.',
    provisions: [
      {
        path: 'gov.states.ut.tax.income.rate',
        value: 0.0445,
        fallbackBreadcrumb: 'Utah → Income tax → Rate',
      },
    ],
  },
  {
    id: 'us-ctc-expansion',
    countryId: 'us' as const,
    jurisdiction: 'Federal',
    title: 'Child tax credit expansion proposal',
    status: 'Introduced',
    summary: 'Raises the base child tax credit amount to $2,500 per child.',
    provisions: [
      {
        path: 'gov.irs.credits.ctc.amount.base[0].amount',
        value: 2500,
        fallbackBreadcrumb: 'IRS → Credits → Child tax credit → Base amount',
      },
    ],
  },
  {
    id: 'us-snap-allotment',
    countryId: 'us' as const,
    jurisdiction: 'Federal',
    title: 'SNAP benefit adjustment proposal',
    status: 'In committee',
    summary: 'Adjusts the SNAP maximum allotment share of the Thrifty Food Plan.',
    provisions: [
      {
        path: 'gov.usda.snap.max_allotment.main.CONTIGUOUS_US.1',
        value: 350,
        fallbackBreadcrumb: 'USDA → SNAP → Maximum allotment',
      },
    ],
  },
];

/** A state bill that first takes effect next year (live: RI S2364, from 2027). */
const LATER_STATE_BILL = {
  id: 'ri-s2364',
  countryId: 'us' as const,
  jurisdiction: 'Rhode Island',
  state: 'RI',
  title: 'Rhode Island S2364: income tax rate cut',
  status: 'In Committee',
  summary: 'Cuts the lowest income tax rate from 2027.',
  provisions: [
    {
      path: 'gov.states.ri.tax.income.rates[0].rate',
      value: 0.0375,
      intervals: [{ startDate: '2027-01-01', endDate: '2100-12-31', value: 0.0375 }],
      fallbackBreadcrumb: 'Rhode Island → Income tax → Lowest rate',
    },
  ],
};

/**
 * UT SB60 as the tracker stores it: a write-up of 4.5% → 4.45%, but
 * reform params of 0.045, the law before the bill.
 */
const SWAPPED_STATE_BILL = {
  id: 'ut-sb60-bill',
  countryId: 'us' as const,
  jurisdiction: 'Utah',
  state: 'UT',
  title: 'Utah SB60: Income tax rate reduction',
  status: 'Signed into Law',
  summary: 'Cuts the income tax rate from 4.5% to 4.45%.',
  provisions: [
    {
      path: 'gov.states.ut.tax.income.rate',
      value: 0.045,
      intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 0.045 }],
      fallbackBreadcrumb: 'Utah → Income tax → Rate',
    },
  ],
  changes: [{ label: 'Income tax rate', before: '4.5%', after: '4.45%' }],
};

function renderReforms(path?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const ui = (
    <QueryClientProvider client={queryClient}>
      <ReformsPage />
    </QueryClientProvider>
  );
  return path ? renderWithCountry(ui, 'us', path) : render(ui);
}

// Radix Select asks for pointer capture, which jsdom does not have.
Element.prototype.hasPointerCapture ??= vi.fn(() => false);
Element.prototype.releasePointerCapture ??= vi.fn();

/** Picks one option from a bill filter's dropdown. */
async function chooseFilter(
  user: ReturnType<typeof userEvent.setup>,
  filter: 'Level' | 'Stage',
  option: string
) {
  await user.click(screen.getByRole('combobox', { name: filter }));
  await user.click(await screen.findByRole('option', { name: option }));
}

describe('ReformsPage', () => {
  afterEach(() => {
    store.dispatch(clearMetadata());
  });

  beforeEach(() => {
    vi.clearAllMocks();
    clearDraftReform();
    mockFindMine.mockResolvedValue([]);
    mockFindReports.mockResolvedValue([]);
    mockFetchTrackerBills.mockResolvedValue(FEED_BILLS);
  });

  test('given the default view then bill cards render with place eyebrows', async () => {
    renderReforms();

    expect(await screen.findByText(/HB 106/)).toBeInTheDocument();
    // "Utah" is the card's eyebrow; the place picker lists it only when open.
    expect(screen.getByText('Utah')).toBeInTheDocument();
    // Cards, not accordions: no expanded actions yet
    expect(screen.queryByRole('button', { name: /open as draft reform/i })).not.toBeInTheDocument();
  });

  test('given US reforms then the header links to the bill tracker home', async () => {
    renderReforms();

    const link = await screen.findByRole('link', { name: /bill tracker/i });
    expect(link).toHaveAttribute('href', 'https://policyengine.org/us/bill-tracker');
    expect(link).toHaveAttribute('target', '_blank');
  });

  test('given UK reforms then the header has no bill tracker link', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithCountry(
      <QueryClientProvider client={queryClient}>
        <ReformsPage />
      </QueryClientProvider>,
      'uk',
      '/uk/reforms'
    );

    expect(await screen.findByRole('heading', { level: 1, name: 'Reforms' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /bill tracker/i })).not.toBeInTheDocument();
  });

  test('given UK reforms then the library opens with no tracked bills tab and no feed fetch', async () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    renderWithCountry(
      <QueryClientProvider client={queryClient}>
        <ReformsPage />
      </QueryClientProvider>,
      'uk',
      '/uk/reforms'
    );

    expect(await screen.findByText(/no saved reforms yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Your library' })).toHaveAttribute(
      'aria-pressed',
      'true'
    );
    expect(screen.queryByRole('button', { name: 'Tracked bills' })).not.toBeInTheDocument();
    expect(screen.queryByText(/analyzed/i)).not.toBeInTheDocument();
    expect(mockFetchTrackerBills).not.toHaveBeenCalled();
  });

  test('given a narrow screen then the header actions can wrap under the title', async () => {
    renderReforms();

    const title = await screen.findByRole('heading', { level: 1, name: 'Reforms' });
    expect(title.parentElement).toHaveStyle({ flexWrap: 'wrap' });
  });

  test('given a bill opens then no place-and-status line sits over its title', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(await screen.findByText('Child tax credit expansion proposal'));

    expect(
      screen.getByRole('heading', { name: 'Child tax credit expansion proposal' })
    ).toBeInTheDocument();
    expect(screen.queryByText(/Federal · Introduced/)).not.toBeInTheDocument();
  });

  test('given a bill card is clicked then its detail opens with actions', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(await screen.findByText('Child tax credit expansion proposal'));

    expect(screen.getByRole('button', { name: /run impact report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open as draft reform/i })).toBeInTheDocument();
    expect(screen.getByText(/raises the base child tax credit/i)).toBeInTheDocument();
  });

  test('given a ?bill deep link then the detail opens directly', async () => {
    renderReforms('/us/reforms?bill=us-ctc-expansion');

    expect(
      await screen.findByRole('button', { name: /open as draft reform/i })
    ).toBeInTheDocument();
  });

  test('given open as draft in the detail then the draft is populated', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(await screen.findByText('Child tax credit expansion proposal'));
    await user.click(screen.getByRole('button', { name: /open as draft reform/i }));

    const draft = getDraftReform();
    expect(draft?.source).toBe('bill');
    expect(draft?.label).toBe('Child tax credit expansion proposal');
    expect(draft?.provisions.length).toBeGreaterThan(0);
  });

  test('given a state bill from a later year opens as a draft then the draft runs as its report does', async () => {
    const user = userEvent.setup();
    mockFetchTrackerBills.mockResolvedValue([...FEED_BILLS, LATER_STATE_BILL]);
    renderReforms(`/us/reforms?bill=${LATER_STATE_BILL.id}`);

    await user.click(await screen.findByRole('button', { name: /open as draft reform/i }));

    // The bill's first year and its state, not this year and the whole country.
    expect(getDraftReform()).toMatchObject({
      label: LATER_STATE_BILL.title,
      year: 2027,
      population: { scope: 'national', region: 'state/ri' },
      source: 'bill',
      sourceRef: LATER_STATE_BILL.id,
      provisions: [{ path: 'gov.states.ri.tax.income.rates[0].rate', value: 0.0375 }],
    });
  });

  test('given a federal bill opens as a draft then the draft runs on the whole country', async () => {
    const user = userEvent.setup();
    renderReforms('/us/reforms?bill=us-ctc-expansion');

    await user.click(await screen.findByRole('button', { name: /open as draft reform/i }));

    const draft = getDraftReform();
    expect(draftYear(draft)).toBe(Number(CURRENT_YEAR));
    // No state region, and still the bill's draft.
    expect(draft?.population).toEqual({ scope: 'national' });
    expect(draft).toMatchObject({ source: 'bill', sourceRef: 'us-ctc-expansion' });
  });

  test('given stored parameters that contradict the write-up then no report or draft starts', async () => {
    const user = userEvent.setup();
    mockFetchTrackerBills.mockResolvedValue([...FEED_BILLS, SWAPPED_STATE_BILL]);
    renderReforms(`/us/reforms?bill=${SWAPPED_STATE_BILL.id}`);

    const draftButton = await screen.findByRole('button', { name: /open as draft reform/i });
    expect(draftButton).toBeDisabled();
    expect(screen.getByRole('button', { name: /run impact report/i })).toBeDisabled();
    expect(screen.getByText(/do not match its write-up of the changes/)).toBeInTheDocument();

    await user.click(draftButton);

    expect(getDraftReform()).toBeNull();
    expect(mockRun).not.toHaveBeenCalled();
  });

  test('given the federal level then state bills leave', async () => {
    const user = userEvent.setup();
    renderReforms();

    await screen.findByText(/HB 106/);
    await chooseFilter(user, 'Level', 'Federal');

    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
    expect(screen.getByText('Child tax credit expansion proposal')).toBeInTheDocument();
    expect(screen.getByText('SNAP benefit adjustment proposal')).toBeInTheDocument();
  });

  test('given the state level then one state narrows the list', async () => {
    const user = userEvent.setup();
    mockFetchTrackerBills.mockResolvedValue(FILTER_BILLS);
    renderReforms();

    await screen.findByText(UTAH_ENACTED.title);
    await chooseFilter(user, 'Level', 'State');
    expect(screen.queryByText(FEDERAL_PROPOSED.title)).not.toBeInTheDocument();
    expect(screen.getByText(GEORGIA_VETOED.title)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'State: All states' }));
    await user.click(await screen.findByRole('option', { name: /utah\s*2/i }));

    expect(screen.getByRole('button', { name: 'State: Utah' })).toBeInTheDocument();
    expect(screen.getByText(UTAH_PROPOSED.title)).toBeInTheDocument();
    expect(screen.queryByText(GEORGIA_VETOED.title)).not.toBeInTheDocument();
  });

  test('given the enacted stage then only enacted bills remain', async () => {
    const user = userEvent.setup();
    renderReforms();

    await screen.findByText(/HB 106/);
    await chooseFilter(user, 'Stage', 'Enacted');

    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.queryByText('Child tax credit expansion proposal')).not.toBeInTheDocument();
  });

  test('given each bill card then it carries its place and stage', async () => {
    mockFetchTrackerBills.mockResolvedValue(FILTER_BILLS);
    renderReforms();

    const card = (title: string) =>
      screen.getByText(title).closest('[role="button"]') as HTMLElement;
    await screen.findByText(UTAH_ENACTED.title);

    // The tracker files federal bills under "US"; the card says Federal.
    expect(within(card(FEDERAL_ENACTED.title)).getByText('Federal')).toBeInTheDocument();
    expect(within(card(FEDERAL_ENACTED.title)).getByText('Enacted')).toBeInTheDocument();
    expect(within(card(UTAH_PROPOSED.title)).getByText('Utah')).toBeInTheDocument();
    expect(within(card(UTAH_PROPOSED.title)).getByText('Proposed')).toBeInTheDocument();
    expect(within(card(GEORGIA_VETOED.title)).getByText('Failed')).toBeInTheDocument();
    // No tracked status, no stage: the card does not guess one.
    expect(
      within(card(FEDERAL_UNTRACKED.title)).queryByText(/^(Enacted|Proposed|Failed)$/)
    ).not.toBeInTheDocument();
  });

  test('given a search for federal then the bills whose cards say Federal match', async () => {
    const user = userEvent.setup();
    mockFetchTrackerBills.mockResolvedValue(FILTER_BILLS);
    renderReforms();

    await screen.findByText(UTAH_ENACTED.title);
    // The tracker files these bills under "US"; the cards say Federal.
    await user.type(screen.getByRole('textbox', { name: /search reforms/i }), 'federal');

    expect(await screen.findByText(FEDERAL_ENACTED.title)).toBeInTheDocument();
    expect(screen.getByText(FEDERAL_PROPOSED.title)).toBeInTheDocument();
    expect(screen.queryByText(UTAH_ENACTED.title)).not.toBeInTheDocument();
    expect(screen.queryByText('No bills match.')).not.toBeInTheDocument();
  });

  test('given filters that match no bill then a message offers to clear them', async () => {
    const user = userEvent.setup();
    renderReforms();

    await screen.findByText(/HB 106/);
    // Both federal bills are proposals.
    await chooseFilter(user, 'Level', 'Federal');
    await chooseFilter(user, 'Stage', 'Enacted');
    expect(screen.getByText('No bills match.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.queryByText('No bills match.')).not.toBeInTheDocument();
    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.getByText('Child tax credit expansion proposal')).toBeInTheDocument();
  });

  test('given a search that matches no bill then clear filters empties the search', async () => {
    const user = userEvent.setup();
    renderReforms();

    await screen.findByText(/HB 106/);
    await user.type(screen.getByRole('textbox', { name: /search reforms/i }), 'medicaid');
    expect(await screen.findByText('No bills match.')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(screen.getByRole('textbox', { name: /search reforms/i })).toHaveValue('');
    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
  });

  test('given a search then bill cards filter', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.type(screen.getByRole('textbox', { name: /search reforms/i }), 'snap');

    expect(await screen.findByText(/SNAP benefit adjustment/)).toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
  });

  test('given a scored bill then clicking its card opens the report directly', async () => {
    const user = userEvent.setup();
    mockFetchTrackerBills.mockResolvedValue([
      {
        id: 'us-hr1425',
        countryId: 'us',
        jurisdiction: 'US',
        title: 'HR 1425: Child Tax Credit to $5,000',
        status: 'Analyzed',
        summary: 'Raises the CTC to $5,000 per qualifying child.',
        provisions: [],
        keyFindings: ['External check (cost): within CRFB band.'],
        impacts: { revenue: -225_500_000_000, povertyPercentChange: -14.3 },
        impactData: {
          poverty: { baselineRate: 0.169, reformRate: 0.145, percentChange: -14.3 },
          winnersLosers: { gainMore5Pct: 0.236, gainLess5Pct: 0.199, noChange: 0.565 },
        },
      },
    ]);
    renderReforms();

    await user.click(await screen.findByText('HR 1425: Child Tax Credit to $5,000'));

    // No intermediate detail — the report page has everything the
    // detail showed, plus tabs, validation, and the adjust rail.
    expect(mockNavigate).toHaveBeenCalledWith('/us/report/bill/us-hr1425');
  });

  test('given more bills than one page then the grid paginates with show more', async () => {
    const user = userEvent.setup();
    mockFetchTrackerBills.mockResolvedValue(
      Array.from({ length: 30 }, (_, index) => ({
        id: `live-bill-${index}`,
        countryId: 'us',
        jurisdiction: 'Utah',
        title: `Live bill ${index}`,
        status: 'Analyzed',
        summary: '',
        provisions: [],
        date: `2026-01-${String((index % 28) + 1).padStart(2, '0')}`,
      }))
    );
    renderReforms();

    expect(await screen.findByText('Showing 12 of 30 bills')).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Show more' }));

    expect(screen.getByText('Showing 24 of 30 bills')).toBeInTheDocument();
  });

  test('given the Your library tab with no reforms then the invitation shows', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(screen.getByRole('button', { name: 'Your library' }));

    expect(await screen.findByText(/no saved reforms yet/i)).toBeInTheDocument();
  });

  test('given a ?filter=yours deep link then the Your library tab is active', async () => {
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    renderReforms('/us/reforms?filter=yours');

    expect(await screen.findByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
    // How the reform came about isn't shown on its card.
    expect(screen.queryByText('From a question')).not.toBeInTheDocument();
  });

  test('given the Your library tab then it lists this browser’s reforms for the country', async () => {
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    renderReforms('/us/reforms?filter=yours');

    await screen.findByText('CTC to $3,600 for children under 6');

    expect(mockFindMine).toHaveBeenCalledWith('us');
  });

  test('given a reform card is clicked then its detail reads it, with nothing to edit there', async () => {
    seedDeductionMetadata();
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');

    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    expect(
      screen.getByRole('heading', { name: 'CTC to $3,600 for children under 6' })
    ).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Parameters' });
    expect(table).toHaveTextContent('3600');
    expect(within(table).queryByRole('textbox')).not.toBeInTheDocument();
    expect(within(table).queryByRole('spinbutton')).not.toBeInTheDocument();
    // Changes are made in Build: no save, copy or add-parameters here.
    for (const name of [/save changes/i, /duplicate/i, /add parameters in build/i]) {
      expect(screen.queryByRole('button', { name })).not.toBeInTheDocument();
    }
    expect(screen.getByRole('button', { name: /view full impact report/i })).toBeInTheDocument();
    expect(screen.queryByText('From a question')).not.toBeInTheDocument();
  });
  test('given view full impact report in the reform detail then the run links the saved reform', async () => {
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    await user.click(screen.getByRole('button', { name: /view full impact report/i }));

    expect(mockRun).toHaveBeenCalledTimes(1);
    const [runTitle, , , reformId] = mockRun.mock.calls[0];
    expect(runTitle).toBe('CTC to $3,600 for children under 6');
    expect(reformId).toBe('rf-1');
  });

  test('given the model metadata is still loading then the rows hold their place', async () => {
    store.dispatch(clearMetadata());
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    const table = screen.getByRole('table', { name: 'Parameters' });
    expect(within(table).getByRole('status', { name: 'Loading parameters' })).toBeInTheDocument();
    expect(table).not.toHaveTextContent('3600');
  });

  test('given a value that starts later then the detail says when', async () => {
    seedDeductionMetadata();
    mockFindMine.mockResolvedValue([LATER_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $1,000 from 2028'));

    expect(screen.getByText('from 2028')).toBeInTheDocument();
  });
  test('given a value that starts later then its report runs in that year, from that date', async () => {
    mockFindMine.mockResolvedValue([LATER_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $1,000 from 2028'));

    await user.click(screen.getByRole('button', { name: /view full impact report/i }));

    expect(mockRun).toHaveBeenCalledTimes(1);
    const [, , provisions, reformId, year] = mockRun.mock.calls[0];
    expect(reformId).toBe('rf-2');
    expect(year).toBe(2028);
    expect(provisions[0]).toMatchObject({
      value: 1000,
      intervals: [{ startDate: '2028-01-01', endDate: '2100-12-31', value: 1000 }],
    });
  });

  test('given a schedule then the detail reads it', async () => {
    seedDeductionMetadata();
    mockFindMine.mockResolvedValue([SCHEDULE_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC indexed'));

    // Each period on its own line, read across: the reform's value, then its dates.
    const [row] = within(screen.getByRole('table', { name: 'Parameters' }))
      .getAllByRole('row')
      .slice(1);
    const [, , reform, when] = within(row).getAllByRole('cell');
    const lines = (cell: HTMLElement) => [...cell.children].map((line) => line.textContent);
    expect(lines(reform)).toEqual(['2500', '2550', '2600']);
    expect(lines(when)).toEqual(['2026 only', '2027 only', 'from 2028']);
  });
  test('given reports run from a reform then its card shows the last run and its status, and its detail lists them', async () => {
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    mockFindReports.mockResolvedValue([
      {
        id: 'r-a',
        countryId: 'us',
        apiReportId: '901',
        title: 'CTC',
        sourceNote: null,
        provisions: [],
        year: '2026',
        createdAt: '2026-10-13T15:00:00Z',
        reformId: 'rf-1',
      },
      {
        id: 'r-b',
        countryId: 'us',
        apiReportId: '902',
        title: 'CTC',
        sourceNote: null,
        provisions: [],
        year: '2027',
        createdAt: '2026-10-14T09:00:00Z',
        reformId: 'rf-1',
      },
      {
        id: 'r-other',
        countryId: 'us',
        apiReportId: '903',
        title: 'Other',
        sourceNote: null,
        provisions: [],
        year: '2026',
        createdAt: '2026-10-14T10:00:00Z',
        reformId: 'rf-other',
      },
    ]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');

    expect(await screen.findByText('Last run Oct 14, 2026')).toBeInTheDocument();
    // The latest report (902) is still running.
    expect(await screen.findByText('In progress')).toBeInTheDocument();
    await user.click(screen.getByText('CTC to $3,600 for children under 6'));

    const list = screen.getByRole('region', { name: 'Reports' });
    // Newest first; the finished one says so.
    const rows = within(list)
      .getAllByText(/^\d{4} report$/)
      .map((row) => row.textContent);
    expect(rows).toEqual(['2027 report', '2026 report']);
    expect(await within(list).findByText('Done')).toBeInTheDocument();
    await user.click(within(list).getAllByRole('button', { name: /open/i })[0]);
    expect(mockNavigate).toHaveBeenCalledWith('/us/report/902');
  });

  test('given a report record saved through the API then its year comes from the report', async () => {
    // Given: API records keep no year; the API report carries it
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    mockFindReports.mockResolvedValue([
      {
        id: 'r-api',
        countryId: 'us',
        apiReportId: '904',
        title: 'CTC',
        sourceNote: null,
        provisions: [],
        createdAt: '2026-10-14T09:00:00Z',
        reformId: 'rf-1',
      },
    ]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');

    // When
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // Then
    const list = screen.getByRole('region', { name: 'Reports' });
    expect(await within(list).findByText('2028 report')).toBeInTheDocument();
  });

  test('given a reform with no reports then its card and detail say so', async () => {
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');

    expect(await screen.findByText('No reports yet')).toBeInTheDocument();
    await user.click(screen.getByText('CTC to $3,600 for children under 6'));
    expect(
      within(screen.getByRole('region', { name: 'Reports' })).getByText(/No reports yet\. Run one/)
    ).toBeInTheDocument();
  });

  test('given delete in the reform detail then it asks first and deletes nothing yet', async () => {
    // Given
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

    // When
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Then
    const dialog = screen.getByRole('alertdialog', {
      name: 'Delete “CTC to $3,600 for children under 6”?',
    });
    expect(dialog).toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();
  });

  test('given the delete is confirmed then the store delete is called', async () => {
    // Given
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    mockDelete.mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // When
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete reform' })
    );

    // Then
    expect(mockDelete).toHaveBeenCalledWith('rf-1');
  });

  test('given the delete is cancelled then the reform stays', async () => {
    // Given
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // When
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Cancel' })
    );

    // Then
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument();
    expect(mockDelete).not.toHaveBeenCalled();
    expect(
      screen.getByRole('heading', { name: 'CTC to $3,600 for children under 6' })
    ).toBeInTheDocument();
  });

  test('given a reform with reports then the delete prompt says they stay reachable by link', async () => {
    // Given
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    mockFindReports.mockResolvedValue([
      {
        id: 'r-a',
        countryId: 'us',
        apiReportId: '901',
        title: 'CTC',
        sourceNote: null,
        provisions: [],
        year: '2026',
        createdAt: '2026-10-13T15:00:00Z',
        reformId: 'rf-1',
      },
    ]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
    await screen.findByText('2026 report');

    // When
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // Then
    expect(screen.getByRole('alertdialog')).toHaveTextContent(
      'Its 1 report leaves this list; it still opens from its link.'
    );
  });

  test('given the delete fails then the detail says so', async () => {
    // Given
    mockFindMine.mockResolvedValue([CHAT_REFORM]);
    mockDelete.mockRejectedValue(new Error('503'));
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
    await user.click(screen.getByRole('button', { name: /delete/i }));

    // When
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete reform' })
    );

    // Then
    expect(await screen.findByText(/could not delete/i)).toBeInTheDocument();
  });

  test('given a failed delete then another reform opens with no error', async () => {
    // Given
    mockFindMine.mockResolvedValue([CHAT_REFORM, LATER_REFORM]);
    mockDelete.mockRejectedValue(new Error('503'));
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
    await user.click(screen.getByRole('button', { name: /delete/i }));
    await user.click(
      within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Delete reform' })
    );
    await screen.findByText(/could not delete/i);

    // When
    await user.click(screen.getByRole('button', { name: /all reforms/i }));
    await user.click(await screen.findByText('CTC to $1,000 from 2028'));

    // Then
    expect(screen.getByRole('heading', { name: 'CTC to $1,000 from 2028' })).toBeInTheDocument();
    expect(screen.queryByText(/could not delete/i)).not.toBeInTheDocument();
  });

  test('given the back link in a detail then the grid returns', async () => {
    const user = userEvent.setup();
    renderReforms();

    await user.click(await screen.findByText('Child tax credit expansion proposal'));
    await user.click(screen.getByRole('button', { name: /all reforms/i }));

    expect(screen.getByText(/HB 106/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /open as draft reform/i })).not.toBeInTheDocument();
  });

  test('given no tracker credentials then the surface says the feed is unconfigured', async () => {
    mockFetchTrackerBills.mockResolvedValue(null);
    renderReforms();

    expect(await screen.findByText(/feed is not configured/i)).toBeInTheDocument();
    expect(screen.queryByText(/HB 106/)).not.toBeInTheDocument();
  });

  test('given the feed errors then the error shows instead of an empty grid', async () => {
    mockFetchTrackerBills.mockRejectedValue(new Error('tracker down'));
    renderReforms();

    // The feed retries once before failing, so give it past the retry delay.
    expect(
      await screen.findByText(/could not load the bill feed/i, {}, { timeout: 5000 })
    ).toBeInTheDocument();
  });

  test('given a country with no analyzed bills then the empty state says so', async () => {
    mockFetchTrackerBills.mockResolvedValue([]);
    renderReforms();

    expect(await screen.findByText(/no analyzed bills yet/i)).toBeInTheDocument();
  });

  test('given a reform whose changes could not load then its card and detail say so', async () => {
    mockFindMine.mockResolvedValue([
      CHAT_REFORM,
      {
        ...CHAT_REFORM,
        id: 'rf-2',
        label: 'Unloadable reform',
        parameters: [],
        parametersUnavailable: true,
      },
    ]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');

    // The other reform still lists normally
    expect(await screen.findByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
    expect(screen.getByText('Changes could not be loaded')).toBeInTheDocument();

    await user.click(screen.getByText('Unloadable reform'));

    expect(screen.getByRole('alert')).toHaveTextContent(/changes could not be loaded/i);
    expect(screen.getByRole('button', { name: /view full impact report/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

  test('given a reform whose policy sets parameters the model no longer has then its card says so, and once its dialog is put off the detail names them and it cannot run', async () => {
    mockFindMine.mockResolvedValue([
      CHAT_REFORM,
      {
        ...CHAT_REFORM,
        id: 'rf-2',
        label: 'Reform with a removed parameter',
        // As the store reads it: the removed parameter keeps its stored values.
        parameters: [...CHAT_REFORM.parameters, REMOVED_PARAMETER_CHANGE],
        missingParameters: [REMOVED_US_PARAMETER],
      },
    ]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');

    // The other reform still lists normally
    expect(await screen.findByText('CTC to $3,600 for children under 6')).toBeInTheDocument();
    expect(screen.getByText('Uses parameters the model no longer has')).toBeInTheDocument();

    await user.click(screen.getByText('Reform with a removed parameter'));
    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Not now' })
    );

    const notice = screen.getByRole('alert');
    expect(notice).toHaveTextContent(/cannot be run/i);
    expect(within(notice).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view full impact report/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

  describe('given a saved reform whose policy uses parameters the model no longer has', () => {
    /** The reform after its transfer: a new policy, with only its other change. */
    const TRANSFERRED_REFORM: Reform = {
      ...REFORM_WITH_REMOVED_PARAMETER,
      policyId: '95800',
      parameters: [KEPT_PARAMETER_CHANGE],
      missingParameters: undefined,
    };

    async function openSavedReform(reform: Reform) {
      mockFindMine.mockResolvedValue([CHAT_REFORM, reform]);
      const user = userEvent.setup();
      renderReforms('/us/reforms?filter=yours');
      await user.click(await screen.findByText(reform.label!));
      return user;
    }

    test('given its card clicked then its transfer dialog opens and names them', async () => {
      // When
      await openSavedReform(REFORM_WITH_REMOVED_PARAMETER);

      // Then
      const dialog = await screen.findByRole('dialog', { name: REFORM_DIALOG_NAME });
      expect(within(dialog).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
      expect(
        within(dialog).getByRole('button', { name: 'Transfer to a new policy' })
      ).toBeEnabled();
      expect(within(dialog).getByRole('button', { name: 'Not now' })).toBeEnabled();
      expect(within(dialog).queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });

    test('given a reform the model can run then no dialog opens', async () => {
      // Given
      mockFindMine.mockResolvedValue([CHAT_REFORM, REFORM_WITH_REMOVED_PARAMETER]);
      const user = userEvent.setup();
      renderReforms('/us/reforms?filter=yours');

      // When
      await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

      // Then
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(CHAT_REFORM.label!);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('given Transfer then the reform is saved with only its other changes, and the block lifts', async () => {
      // Given: once updated, the store lists the reform on its new policy
      let transferred = false;
      mockFindMine.mockImplementation(async () => [
        CHAT_REFORM,
        transferred ? TRANSFERRED_REFORM : REFORM_WITH_REMOVED_PARAMETER,
      ]);
      mockUpdate.mockImplementation(async () => {
        transferred = true;
        return TRANSFERRED_REFORM;
      });
      const user = userEvent.setup();
      renderReforms('/us/reforms?filter=yours');
      await user.click(await screen.findByText(REFORM_WITH_REMOVED_PARAMETER.label!));
      const dialog = await screen.findByRole('dialog', { name: REFORM_DIALOG_NAME });

      // When
      await user.click(within(dialog).getByRole('button', { name: 'Transfer to a new policy' }));

      // Then: only the parameters change, so the name, baseline and provenance stay
      expect(mockUpdate).toHaveBeenCalledWith(REFORM_WITH_REMOVED_PARAMETER.id, {
        parameters: [KEPT_PARAMETER_CHANGE],
      });
      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        REFORM_WITH_REMOVED_PARAMETER.label!
      );
    });

    test('given nothing would remain then Transfer is off and the dialog says why', async () => {
      // When
      await openSavedReform(REFORM_WITH_ONLY_REMOVED_PARAMETERS);

      // Then
      const dialog = await screen.findByRole('dialog', { name: REFORM_DIALOG_NAME });
      expect(
        within(dialog).getByRole('button', { name: 'Transfer to a new policy' })
      ).toBeDisabled();
      expect(dialog).toHaveTextContent(
        /this reform changes nothing, so there is nothing to transfer/i
      );
      expect(within(dialog).getByRole('button', { name: 'Not now' })).toBeEnabled();
    });

    test('given Not now then the dialog closes, and the notice and the block stay', async () => {
      // Given
      const user = await openSavedReform(REFORM_WITH_REMOVED_PARAMETER);
      const dialog = await screen.findByRole('dialog', { name: REFORM_DIALOG_NAME });

      // When
      await user.click(within(dialog).getByRole('button', { name: 'Not now' }));

      // Then
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(within(screen.getByRole('alert')).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /view full impact report/i })).toBeDisabled();
      expect(mockUpdate).not.toHaveBeenCalled();
    });

    test('given the transfer fails then the dialog says so, and the reform stays as it was', async () => {
      // Given
      mockUpdate.mockRejectedValue(new Error('Saved work is temporarily unavailable.'));
      const user = await openSavedReform(REFORM_WITH_REMOVED_PARAMETER);
      const dialog = await screen.findByRole('dialog', { name: REFORM_DIALOG_NAME });

      // When
      await user.click(within(dialog).getByRole('button', { name: 'Transfer to a new policy' }));

      // Then: once, with no retry of its own
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Could not transfer the reform. Try again.'
      );
      expect(mockUpdate).toHaveBeenCalledTimes(1);
      expect(
        within(dialog).getByRole('button', { name: 'Transfer to a new policy' })
      ).toBeEnabled();
    });
  });

  test('given a reform whose changes could not load then "Try again" reloads the list', async () => {
    seedDeductionMetadata();
    mockFindMine.mockResolvedValue([
      { ...CHAT_REFORM, parameters: [], parametersUnavailable: true },
    ]);
    const user = userEvent.setup();
    renderReforms('/us/reforms?filter=yours');
    await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
    mockFindMine.mockResolvedValue([CHAT_REFORM]);

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(screen.getByRole('table', { name: 'Parameters' })).toHaveTextContent('3600')
    );
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /view full impact report/i })).toBeEnabled();
  });

  test('given a saved reform that changes nothing then its report cannot run, and it says why', async () => {
    // Given: current law already sets the base amount to $2,200 from 2026
    seedDeductionMetadata();
    try {
      mockFindMine.mockResolvedValue([
        {
          ...CHAT_REFORM,
          parameters: [
            {
              name: 'gov.irs.credits.ctc.amount.base',
              values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2200 }],
            },
          ],
        },
      ]);
      const user = userEvent.setup();
      renderReforms('/us/reforms?filter=yours');

      // When
      await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

      // Then
      expect(screen.getByRole('button', { name: /view full impact report/i })).toBeDisabled();
      expect(
        screen.getByText(/nothing in this reform differs from current law/i)
      ).toBeInTheDocument();
      expect(mockRun).not.toHaveBeenCalled();
    } finally {
      store.dispatch(clearMetadata());
    }
  });

  describe('given a report to open again or re-run', () => {
    beforeEach(() => localStorage.clear());

    /** A `/v2/user-reports` row's ID: an account report's link. */
    const ACCOUNT_REPORT_ROW_ID = '44444444-4444-4444-8444-444444444444';

    /** The saved reform the reports were compared with. */
    const PLAN_B_REFORM: Reform = {
      ...CHAT_REFORM,
      id: 'rf-plan-b',
      label: 'Plan B',
      policyId: '87',
    };

    /** CHAT_REFORM's provision, as its report ran it. */
    const RUN_PROVISION = {
      path: 'gov.irs.credits.ctc.amount.base[0].amount',
      breadcrumb: 'IRS → Credits → CTC → Base amount',
      unit: 'currency-USD',
      baselineValue: 2000,
      value: 3600,
      intervals: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
    };

    /**
     * An account report: the row keeps no year (its v1 report, 904, ran
     * 2028), a ten-year window, and the saved reform it was compared with.
     */
    const ACCOUNT_REPORT = {
      id: ACCOUNT_REPORT_ROW_ID,
      countryId: 'us',
      apiReportId: '904',
      title: 'CTC',
      sourceNote: 'Hand-built',
      provisions: [RUN_PROVISION],
      createdAt: '2026-10-14T09:00:00Z',
      reformId: 'rf-1',
      budgetWindowYears: 10,
      baselineReformId: 'rf-plan-b',
    };

    /** A report kept in this browser: its link is the v1 report's number. */
    const BROWSER_REPORT = {
      id: 'lfr-local1',
      countryId: 'us',
      apiReportId: '902',
      title: 'CTC',
      sourceNote: 'Hand-built',
      provisions: [RUN_PROVISION],
      year: '2026',
      createdAt: '2026-10-14T09:00:00Z',
      reformId: 'rf-1',
    };

    beforeEach(() => {
      mockFetchPolicyById.mockResolvedValue(v1PolicyContent({}, []));
      mockFetchReportByIdOverride.current = null;
    });

    async function openReform(reports: object[]) {
      mockFindMine.mockResolvedValue([CHAT_REFORM, PLAN_B_REFORM]);
      mockFindReports.mockResolvedValue(reports);
      const user = userEvent.setup();
      renderReforms('/us/reforms?filter=yours');
      await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
      return user;
    }

    test('given a report compared with a reform that sets parameters the model no longer has then Re-run opens its transfer dialog and runs nothing', async () => {
      // Given: the comparison policy the report ran (88) is the affected one
      mockFindMine.mockResolvedValue([
        CHAT_REFORM,
        {
          ...PLAN_B_REFORM,
          parameters: [...CHAT_REFORM.parameters, REMOVED_PARAMETER_CHANGE],
          missingParameters: [REMOVED_US_PARAMETER],
        },
      ]);
      mockFindReports.mockResolvedValue([ACCOUNT_REPORT]);
      mockFetchPolicyById.mockResolvedValue(
        v1PolicyContent({ [REMOVED_US_PARAMETER]: { '2026-01-01.2100-12-31': 0 } }, [
          REMOVED_US_PARAMETER,
        ])
      );
      const user = userEvent.setup();
      renderReforms('/us/reforms?filter=yours');
      await user.click(await screen.findByText('CTC to $3,600 for children under 6'));
      const list = screen.getByRole('region', { name: 'Reports' });
      expect(within(list).getByText('Compared with Plan B')).toBeInTheDocument();

      // When
      await user.click(within(list).getByRole('button', { name: /re-run/i }));

      // Then
      const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
      expect(within(dialog).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
      expect(mockRun).not.toHaveBeenCalled();
    });

    test('given the report cannot be read and its saved comparison sets removed parameters then Re-run opens its transfer dialog and runs nothing', async () => {
      // Given: the report is unreadable, so a re-run would compare with Plan B's policy
      mockFindMine.mockResolvedValue([
        CHAT_REFORM,
        {
          ...PLAN_B_REFORM,
          parameters: [...CHAT_REFORM.parameters, REMOVED_PARAMETER_CHANGE],
          missingParameters: [REMOVED_US_PARAMETER],
        },
      ]);
      mockFindReports.mockResolvedValue([ACCOUNT_REPORT]);
      mockFetchReportByIdOverride.current = () => Promise.reject(new Error('Not found'));
      const user = userEvent.setup();
      renderReforms('/us/reforms?filter=yours');
      await user.click(await screen.findByText('CTC to $3,600 for children under 6'));

      // When
      await user.click(screen.getByRole('button', { name: /re-run/i }));

      // Then
      const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
      expect(within(dialog).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
      expect(mockRun).not.toHaveBeenCalled();
    });

    test("given the report's policies cannot be checked then Re-run runs as before", async () => {
      // Given
      mockFetchPolicyById.mockRejectedValue(new Error('Failed to fetch policy 88'));
      const user = await openReform([BROWSER_REPORT]);

      // When
      await user.click(screen.getByRole('button', { name: /re-run/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
    });

    test("given Re-run is checking the report's policies then it cannot be clicked again", async () => {
      // Given: the check never answers
      mockFetchPolicyById.mockReturnValue(new Promise(() => {}));
      const user = await openReform([BROWSER_REPORT]);

      // When
      await user.click(screen.getByRole('button', { name: /re-run/i }));

      // Then
      await waitFor(() => expect(screen.getByRole('button', { name: /re-run/i })).toBeDisabled());
      expect(mockRun).not.toHaveBeenCalled();
    });

    test('given a report whose own policies set parameters the model no longer has then Re-run opens its transfer dialog and runs nothing', async () => {
      // Given: the saved reforms are fine, but the report ran a policy (88) with a removed parameter
      mockFetchPolicyById.mockResolvedValue(
        v1PolicyContent({ [REMOVED_US_PARAMETER]: { '2026-01-01.2100-12-31': 0 } }, [
          REMOVED_US_PARAMETER,
        ])
      );
      const user = await openReform([BROWSER_REPORT]);

      // When
      await user.click(screen.getByRole('button', { name: /re-run/i }));

      // Then
      const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
      expect(dialog).toHaveTextContent(/this report cannot be run/i);
      expect(within(dialog).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
      expect(mockRun).not.toHaveBeenCalled();
    });

    test('given an account report then Re-run keeps its year, window and comparison, linked to the same reform', async () => {
      // Given: no run details in this page session, only the row
      const user = await openReform([ACCOUNT_REPORT]);
      const list = screen.getByRole('region', { name: 'Reports' });
      expect(within(list).getByText('Compared with Plan B')).toBeInTheDocument();

      // When
      await user.click(within(list).getByRole('button', { name: /re-run/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      const [title, sourceNote, provisions, reformId, year, settings] = mockRun.mock.calls[0];
      expect({ title, sourceNote, provisions, reformId, year }).toEqual({
        title: 'CTC',
        sourceNote: 'Hand-built',
        provisions: [RUN_PROVISION],
        reformId: 'rf-1',
        year: 2028,
      });
      expect(settings).toEqual({
        region: 'state/md',
        windowYears: 10,
        baseline: { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 },
      });
    });

    test('given a report kept in this browser then Re-run keeps the details stored under its v1 report', async () => {
      // Given
      saveReportMeta('902', {
        title: 'CTC',
        sourceNote: 'Hand-built',
        provisions: [RUN_PROVISION],
        createdAt: '2026-10-14T09:00:00Z',
        budgetWindow: { startYear: 2026, windowSize: 3 },
        baseline: { reformId: 'rf-plan-b', policyId: '88', label: 'Plan B' },
      });
      const user = await openReform([BROWSER_REPORT]);

      // When
      await user.click(screen.getByRole('button', { name: /re-run/i }));

      // Then
      await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
      const [, , , reformId, year, settings] = mockRun.mock.calls[0];
      expect({ reformId, year }).toEqual({ reformId: 'rf-1', year: 2026 });
      expect(settings).toEqual({
        region: 'state/md',
        windowYears: 3,
        baseline: { reformId: 'rf-plan-b', label: 'Plan B', policyId: 88 },
      });
    });

    describe('given Re-run finds parameters the model no longer has', () => {
      /** The account report, with a provision for the removed parameter too. */
      const REPORT_WITH_REMOVED_PARAMETER = {
        ...ACCOUNT_REPORT,
        provisions: [RUN_PROVISION, REMOVED_PROVISION],
      };

      beforeEach(() => {
        // Every policy the report ran (88) sets the kept and the removed parameter.
        mockFetchPolicyById.mockResolvedValue(
          v1PolicyContent(
            {
              [RUN_PROVISION.path]: { '2026-01-01.2100-12-31': 3600 },
              [REMOVED_US_PARAMETER]: { '2026-01-01.2100-12-31': 0 },
            },
            [REMOVED_US_PARAMETER]
          )
        );
      });

      async function openTransferDialog(report: object) {
        const user = await openReform([report]);
        await user.click(screen.getByRole('button', { name: /re-run/i }));
        const dialog = await screen.findByRole('dialog', { name: REPORT_DIALOG_NAME });
        return { user, dialog };
      }

      test('then Transfer and run again runs it without them, onto the same saved report', async () => {
        // Given
        mockRun.mockResolvedValue(ACCOUNT_REPORT_ROW_ID);
        const { user, dialog } = await openTransferDialog(REPORT_WITH_REMOVED_PARAMETER);

        // When
        await user.click(within(dialog).getByRole('button', { name: 'Transfer and run again' }));

        // Then: its year, population, window and comparison, the comparison made without them
        await waitFor(() => expect(mockRun).toHaveBeenCalledTimes(1));
        const [title, sourceNote, provisions, reformId, year, settings] = mockRun.mock.calls[0];
        expect({ title, sourceNote, provisions, reformId, year }).toEqual({
          title: 'CTC',
          sourceNote: 'Hand-built',
          provisions: [RUN_PROVISION],
          reformId: 'rf-1',
          year: 2028,
        });
        expect(settings).toEqual({
          region: 'state/md',
          windowYears: 10,
          baseline: {
            reformId: 'rf-plan-b',
            label: 'Plan B',
            parameters: [
              {
                name: RUN_PROVISION.path,
                values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 3600 }],
              },
            ],
          },
          savedReportId: ACCOUNT_REPORT_ROW_ID,
        });
      });

      test('then Not now runs nothing, and the notice names them', async () => {
        // Given
        const { user, dialog } = await openTransferDialog(REPORT_WITH_REMOVED_PARAMETER);

        // When
        await user.click(within(dialog).getByRole('button', { name: 'Not now' }));

        // Then
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
        const notice = screen.getByRole('alert');
        expect(notice).toHaveTextContent(/this report cannot be run/i);
        expect(within(notice).getByText(REMOVED_US_PARAMETER)).toBeInTheDocument();
        expect(mockRun).not.toHaveBeenCalled();
      });

      test('then with nothing left to run, Transfer and run again is off and says why', async () => {
        // When
        const { dialog } = await openTransferDialog({
          ...ACCOUNT_REPORT,
          provisions: [REMOVED_PROVISION],
        });

        // Then
        expect(
          within(dialog).getByRole('button', { name: 'Transfer and run again' })
        ).toBeDisabled();
        expect(dialog).toHaveTextContent(
          /this report changes nothing, so there is nothing to transfer/i
        );
      });

      test('then a run that cannot start says so in the dialog', async () => {
        // Given
        mockRun.mockResolvedValue(null);
        const { user, dialog } = await openTransferDialog(REPORT_WITH_REMOVED_PARAMETER);

        // When
        await user.click(within(dialog).getByRole('button', { name: 'Transfer and run again' }));

        // Then
        expect(await within(dialog).findByRole('alert')).toHaveTextContent(
          'Could not transfer the report. Try again.'
        );
        expect(mockRun).toHaveBeenCalledTimes(1);
      });
    });

    test('given a finished account report then View results opens its link, not the v1 report', async () => {
      // Given: report 901 is complete
      const user = await openReform([{ ...ACCOUNT_REPORT, apiReportId: '901' }]);

      // When
      await user.click(await screen.findByRole('button', { name: /view results/i }));

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(`/us/report/${ACCOUNT_REPORT_ROW_ID}`);
    });

    test('given an account report of the same values then View full impact report opens its link', async () => {
      // Given: against current law, in the reform's year (its v1 report's: 2026)
      const user = await openReform([
        { ...ACCOUNT_REPORT, apiReportId: '905', budgetWindowYears: null, baselineReformId: null },
      ]);

      // When
      await user.click(screen.getByRole('button', { name: /view full impact report/i }));

      // Then
      await waitFor(() =>
        expect(mockNavigate).toHaveBeenCalledWith(`/us/report/${ACCOUNT_REPORT_ROW_ID}`)
      );
      expect(mockRun).not.toHaveBeenCalled();
    });
  });
});
