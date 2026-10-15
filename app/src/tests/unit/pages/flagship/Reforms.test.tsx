import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderWithCountry, screen, userEvent, within } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CURRENT_YEAR } from '@/constants';
import { clearDraftReform, draftYear, getDraftReform } from '@/libs/draftReform';
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

vi.mock('@/api/report', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/report')>()),
  fetchReportById: async (_countryId: string, reportId: string) => ({
    id: reportId,
    status: reportId === '901' ? 'complete' : 'pending',
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

    // Each period on its own row: its dates and the reform's value then.
    const rows = within(screen.getByRole('table', { name: 'Parameters' })).getAllByRole('row');
    expect(rows.slice(1).map((row) => row.textContent)).toEqual([
      expect.stringMatching(/2500.*2026 only$/),
      expect.stringMatching(/2550.*2027 only$/),
      expect.stringMatching(/2600.*from 2028$/),
    ]);
  });
  test('given reports run from a reform then its card counts them and its detail lists them', async () => {
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

    expect(await screen.findByText('2 reports · latest Oct 14')).toBeInTheDocument();
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
});
