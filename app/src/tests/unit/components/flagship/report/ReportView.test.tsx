import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, userEvent, waitFor, within } from '@test-utils';
import { useLocation, useNavigate, type NavigateFunction } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import ReportView from '@/components/flagship/report/ReportView';
import { BillExternalEstimates } from '@/components/flagship/ValidationPanel';
import { LocationProvider } from '@/contexts/LocationContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import type { RunReportProvision } from '@/libs/flagship/runReport';
import {
  NATIONAL_UK_BODY_FROM_BREAKDOWN_RELEASE,
  nationalResultFromBody,
} from '@/tests/fixtures/api/localAreaBreakdownMocks';
import {
  NATIONAL_OUTPUT_WITHOUT_AREAS,
  SAVED_OUTPUT_WITH_VERSION_IN_BUNDLE_ONLY,
  STORED_OUTPUT_WITH_AREAS,
  UK_REPORT_SOURCE_NOTE,
  UK_REPORT_TITLE,
  UK_SECTION_PROPS,
  UNVERSIONED_OUTPUT_WITHOUT_AREAS,
} from '@/tests/fixtures/components/flagship/report/ukLocalAreaSectionMocks';
import { COMPUTE_BUTTON_LABEL } from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';
import { OTHER_BREAKDOWN_YEAR } from '@/tests/fixtures/hooks/useUKLocalAreaBreakdownMocks';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';
import { createMockSocietyWideOutput } from '@/tests/fixtures/pages/reportOutputMocks';

vi.mock('@/utils/isSocietyWideReportNoOp', () => ({
  isSocietyWideReportNoOp: () => true,
}));

vi.mock('@/api/budgetWindow', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/api/budgetWindow')>()),
  fetchBudgetWindow: async () => ({ status: 'computing', result: null, progress: 10 }),
}));

function renderCover(populationLabel?: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ReportView
        title="Bigger CTC"
        sourceNote="Hand-built"
        populationLabel={populationLabel}
        provisions={[]}
        year="2026"
        output={null}
        calibration={null}
        trackRecord={null}
      />
    </QueryClientProvider>
  );
}

describe('ReportView overview', () => {
  test('given a reform that changes nothing then the overview says so first', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          output={createMockSocietyWideOutput()}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );

    const panel = screen.getByRole('tabpanel');
    expect(panel.querySelector('[aria-label="No change in this year"]')).toHaveTextContent(
      'This reform changes nothing in 2026'
    );
  });

  test('given a report compared with a saved reform then the cover and the notice name it', () => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          customBaselineLabel="Plan B"
          year="2026"
          output={createMockSocietyWideOutput()}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );

    expect(screen.getByText('Compared with Plan B')).toBeInTheDocument();
    const notice = screen.getByRole('region', { name: 'No change in this year' });
    expect(notice).toHaveTextContent('Every result matches Plan B.');
    expect(notice).not.toHaveTextContent('matches current law');
  });
});

describe('ReportView compared with a saved reform', () => {
  const PROVISION = {
    path: 'gov.irs.credits.ctc.amount.base',
    breadcrumb: 'IRS → Credits → Child tax credit → Base amount',
    unit: 'currency-USD',
    baselineValue: 2000,
    value: 2500,
  };
  const renderWith = (customBaselineLabel?: string) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[PROVISION]}
          customBaselineLabel={customBaselineLabel}
          year="2026"
          output={null}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );
  };
  const valueHeadings = () =>
    within(screen.getByRole('region', { name: 'Policy changes' }))
      .getAllByRole('columnheader')
      .map((header) => header.textContent);

  test('then the changes table says its first values are current law', () => {
    renderWith('Plan B');

    expect(valueHeadings()).toEqual(['Change', 'Current law', 'After', 'Start', 'End']);
  });

  test('given current law then the changes table reads before and after, as before', () => {
    renderWith();

    expect(valueHeadings()).toEqual(['Change', 'Before', 'After', 'Start', 'End']);
  });
});

describe('ReportView budget window', () => {
  const renderWith = (budgetWindow?: { startYear: number; windowSize: number }) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Bigger CTC"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          reformPolicyId="9"
          baselinePolicyId="2"
          budgetWindow={budgetWindow}
          output={null}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );
  };

  test('given a window asked for in Build then the overview carries it', async () => {
    renderWith({ startYear: 2026, windowSize: 10 });

    expect(await screen.findByRole('region', { name: 'Budget window' })).toHaveTextContent(
      'Budget, 2026–2035'
    );
  });

  test('given no window asked for then the overview has none', () => {
    renderWith();

    expect(screen.queryByRole('region', { name: 'Budget window' })).not.toBeInTheDocument();
  });
});

describe('ReportView cover', () => {
  test('given a population then the cover reads it and the year, not how the reform was made', () => {
    renderCover('Delaware');

    expect(screen.getByRole('heading', { level: 1, name: 'Bigger CTC' })).toBeInTheDocument();
    expect(screen.getByText('Delaware · 2026')).toBeInTheDocument();
    expect(screen.queryByText(/Hand-built/)).not.toBeInTheDocument();
  });

  test('given no population then the cover has no line under the title', () => {
    renderCover();

    expect(screen.queryByText(/· 2026/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Hand-built/)).not.toBeInTheDocument();
  });

  test('given current law then the cover names no comparison', () => {
    renderCover('Delaware');

    expect(screen.queryByText(/Compared with/)).not.toBeInTheDocument();
  });
});

describe('ReportView validation', () => {
  const CTC_PROVISION: RunReportProvision = {
    path: 'gov.irs.credits.ctc.refundable.individual_max',
    breadcrumb: 'IRS → Credits → CTC → Refundable maximum',
    unit: 'currency-USD',
    baselineValue: 1700,
    value: 499,
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderValidationTab = async (extra: Partial<Parameters<typeof ReportView>[0]> = {}) => {
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ built: null, rows: [], unmappedCount: 0 }))
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Smaller refundable CTC"
          sourceNote="Hand-built"
          provisions={[CTC_PROVISION]}
          year="2026"
          output={null}
          calibration={mockCalibrationMatches}
          trackRecord={{ modelVersion: '1.808.0', reachedCount: 12, programs: [], rows: [] }}
          {...extra}
        />
      </QueryClientProvider>
    );
    await user.click(screen.getByRole('tab', { name: 'Validation' }));
    return screen.getByRole('tabpanel');
  };

  test('given a custom report then validation says no external estimate is available', async () => {
    const panel = await renderValidationTab();

    expect(
      await within(panel).findByText('No external estimate is available for this reform.')
    ).toBeInTheDocument();
    expect(within(panel).getByRole('table', { name: 'Calibration targets' })).toBeInTheDocument();
    expect(
      within(panel).getByRole('heading', { level: 3, name: 'Baseline comparisons' })
    ).toBeInTheDocument();
    // The reform's changes live in the overview; validation does not list them again.
    expect(within(panel).queryByText(/Your reform/)).not.toBeInTheDocument();
    expect(within(panel).queryByText('IRS → Credits → CTC → Refundable maximum')).toBeNull();
  });

  test('given a bill report then validation leads with its fiscal note and the range chip', async () => {
    const panel = await renderValidationTab({
      externalEstimates: (
        <BillExternalEstimates billId={TRACKED_BILL.id} validation={TRACKED_BILL.validation!} />
      ),
    });

    expect(
      within(panel).getByRole('table', { name: 'Estimates for this bill' })
    ).toBeInTheDocument();
    expect(within(panel).getByText('Within fiscal-note range · Δ 2%')).toBeInTheDocument();
    expect(
      within(panel).queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given a custom baseline then validation marks the scorecard not comparable', async () => {
    const panel = await renderValidationTab({ customBaselineLabel: 'Smaller CTC' });

    expect(within(panel).getAllByText('Not comparable')).toHaveLength(2);
    expect(within(panel).getByRole('table', { name: 'Calibration targets' })).toBeInTheDocument();
    // External scores assume current law: the scorecard is not asked.
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls).not.toContain('/api/scorecard-comparisons');
  });

  test('given current law then validation asks the scorecard and marks nothing', async () => {
    const panel = await renderValidationTab();

    await within(panel).findByText('No external estimate is available for this reform.');
    const urls = vi.mocked(fetch).mock.calls.map(([url]) => String(url));
    expect(urls).toContain('/api/scorecard-comparisons');
    expect(within(panel).queryByText('Not comparable')).not.toBeInTheDocument();
  });
});

describe('ReportView districts by country', () => {
  const renderIn = (countryId: string, region?: string) => {
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Higher personal allowance"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          region={region}
          output={null}
          districtsPending={<p>Maps load with the results</p>}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>,
      countryId
    );
  };

  test('given a US report then the tab and the card read districts, as before', () => {
    renderIn('us');

    expect(screen.getByRole('tab', { name: 'Districts' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore districts' })).toHaveTextContent(
      'District impacts'
    );
  });

  test('given a UK report then the tab and the card read local areas', async () => {
    const user = userEvent.setup();
    renderIn('uk');

    expect(screen.queryByRole('tab', { name: 'Districts' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Explore local areas' })).toHaveTextContent(
      'Compare income changes across constituencies and local authorities on a map.'
    );

    await user.click(screen.getByRole('tab', { name: 'Local areas' }));

    expect(
      screen.getByRole('heading', { name: 'Constituencies and local authorities' })
    ).toBeInTheDocument();
  });

  test('given a UK report on a country then it keeps the local areas tab', () => {
    renderIn('uk', 'country/scotland');

    expect(screen.getByRole('tab', { name: 'Local areas' })).toBeInTheDocument();
  });

  test.each(['constituency/Bedford', 'local_authority/Bedford'])(
    'given a UK report on %s then it has no local areas tab or card',
    (region) => {
      renderIn('uk', region);

      expect(screen.queryByRole('tab', { name: 'Local areas' })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Explore local areas' })).not.toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Household' })).toBeInTheDocument();
    }
  );
});

describe('ReportView UK local areas', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  const renderUKReport = (output: Parameters<typeof ReportView>[0]['output']) => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ status: 'computing', queue_position: 1, result: null }))
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title={UK_REPORT_TITLE}
          sourceNote={UK_REPORT_SOURCE_NOTE}
          provisions={[]}
          year={UK_SECTION_PROPS.year}
          region={UK_SECTION_PROPS.region}
          reformPolicyId={UK_SECTION_PROPS.reformPolicyId}
          baselinePolicyId={UK_SECTION_PROPS.baselinePolicyId}
          output={output}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>,
      'uk'
    );
  };

  const economyRequests = () =>
    vi
      .mocked(fetch)
      .mock.calls.map(([url]) => String(url))
      .filter((url) => url.includes('/economy/'));

  test('given results without area impacts then the card says they are calculated on request', () => {
    // When
    renderUKReport(NATIONAL_OUTPUT_WITHOUT_AREAS);

    // Then
    expect(screen.getByRole('button', { name: 'Explore local areas' })).toHaveTextContent(
      'Calculate income changes across constituencies and local authorities, and compare them on a map.'
    );
  });

  test('given results without area impacts then the local areas tab offers to compute them and sends nothing', async () => {
    // Given
    const user = userEvent.setup();
    renderUKReport(NATIONAL_OUTPUT_WITHOUT_AREAS);

    // When
    await user.click(screen.getByRole('tab', { name: 'Local areas' }));

    // Then
    expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
    expect(economyRequests()).toEqual([]);
  });

  test('given the Public API body for a .py 6.10.0 national result then the local areas tab offers to compute', async () => {
    // Given
    const user = userEvent.setup();
    const output = await nationalResultFromBody(NATIONAL_UK_BODY_FROM_BREAKDOWN_RELEASE);
    renderUKReport(output);

    // When
    await user.click(screen.getByRole('tab', { name: 'Local areas' }));

    // Then
    expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
    expect(screen.queryByText('No constituency data available')).not.toBeInTheDocument();
  });

  test('given a saved .py 6.10.0 result with the version only in its bundle then the local areas tab offers to compute', async () => {
    // Given
    const user = userEvent.setup();
    renderUKReport(SAVED_OUTPUT_WITH_VERSION_IN_BUNDLE_ONLY);

    // When
    await user.click(screen.getByRole('tab', { name: 'Local areas' }));

    // Then
    expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
  });

  test('given compute clicked then one breakdown request goes for the report region and year', async () => {
    // Given
    const user = userEvent.setup();
    renderUKReport(NATIONAL_OUTPUT_WITHOUT_AREAS);
    await user.click(screen.getByRole('tab', { name: 'Local areas' }));

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    await waitFor(() => expect(economyRequests()).toHaveLength(1));
    expect(economyRequests()[0]).toContain(
      `/uk/economy/${UK_SECTION_PROPS.reformPolicyId}/over/${UK_SECTION_PROPS.baselinePolicyId}?region=uk&time_period=${UK_SECTION_PROPS.year}&breakdown=local_areas`
    );
    expect(await screen.findByRole('progressbar')).toBeInTheDocument();
  });

  test('given compute clicked then switching to another year sends no request until compute is clicked for it', async () => {
    // Given
    const user = userEvent.setup();
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ status: 'computing', queue_position: 1, result: null }))
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const reportForYear = (year: string) => (
      <QueryClientProvider client={queryClient}>
        <ReportView
          title={UK_REPORT_TITLE}
          sourceNote={UK_REPORT_SOURCE_NOTE}
          provisions={[]}
          year={year}
          region={UK_SECTION_PROPS.region}
          reformPolicyId={UK_SECTION_PROPS.reformPolicyId}
          baselinePolicyId={UK_SECTION_PROPS.baselinePolicyId}
          output={NATIONAL_OUTPUT_WITHOUT_AREAS}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );
    const { rerender } = render(reportForYear(UK_SECTION_PROPS.year), 'uk');
    await user.click(screen.getByRole('tab', { name: 'Local areas' }));
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));
    await waitFor(() => expect(economyRequests()).toHaveLength(1));

    // When
    rerender(reportForYear(OTHER_BREAKDOWN_YEAR));

    // Then
    expect(await screen.findByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
    expect(economyRequests()).toHaveLength(1);
  });

  test('given stored results with no version and no area data then the card and the tab read as before, with no compute', async () => {
    // Given
    const user = userEvent.setup();
    renderUKReport(UNVERSIONED_OUTPUT_WITHOUT_AREAS);
    expect(screen.getByRole('button', { name: 'Explore local areas' })).toHaveTextContent(
      'Compare income changes across constituencies and local authorities on a map.'
    );

    // When
    await user.click(screen.getByRole('tab', { name: 'Local areas' }));

    // Then
    expect(screen.getByText('No constituency data available')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
    expect(economyRequests()).toEqual([]);
  });

  test('given saved results with area impacts then the tab shows the maps with no button', async () => {
    // Given
    const user = userEvent.setup();
    renderUKReport(STORED_OUTPUT_WITH_AREAS);
    expect(screen.getByRole('button', { name: 'Explore local areas' })).toHaveTextContent(
      'Compare income changes across constituencies and local authorities on a map.'
    );

    // When
    await user.click(screen.getByRole('tab', { name: 'Local areas' }));

    // Then
    expect(
      screen.getByText('Absolute household income change by constituency')
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
    expect(economyRequests()).toEqual([]);
  });
});

describe('ReportView analytics', () => {
  afterEach(() => {
    delete window.gtag;
  });

  test('given tabs opened then each sends one event with its tab and the region kind only', async () => {
    const user = userEvent.setup();
    const gtag = vi.fn();
    window.gtag = gtag;
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <ReportView
          title="Higher CTC"
          sourceNote="Hand-built"
          provisions={[]}
          year="2026"
          region="state/ca"
          output={null}
          calibration={null}
          trackRecord={null}
        />
      </QueryClientProvider>
    );

    // The open tab again sends nothing.
    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    await user.click(screen.getByRole('tab', { name: 'Household' }));
    await user.click(screen.getByRole('tab', { name: 'Districts' }));

    expect(gtag.mock.calls).toEqual([
      ['event', 'report_tab_viewed', { country_id: 'us', tab: 'household', region_kind: 'state' }],
      ['event', 'report_tab_viewed', { country_id: 'us', tab: 'districts', region_kind: 'state' }],
    ]);
  });
});

describe('ReportView section history', () => {
  let historyNavigate: NavigateFunction;

  /** Shows the address's query, and keeps the router's navigate for Back and Forward. */
  function AddressProbe() {
    historyNavigate = useNavigate();
    const location = useLocation();
    return <output aria-label="Address query">{location.search}</output>;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    delete window.gtag;
  });

  const reportView = (extra: Partial<Parameters<typeof ReportView>[0]> = {}) => (
    <ReportView
      title="Smaller refundable CTC"
      sourceNote="Hand-built"
      provisions={[]}
      year="2026"
      region="state/ca"
      output={null}
      calibration={null}
      trackRecord={null}
      {...extra}
    />
  );

  const renderWithHistory = () => {
    // Validation asks for its comparisons when it opens.
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json({ built: null, rows: [], unmappedCount: 0 }))
    );
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <AddressProbe />
        {reportView()}
      </QueryClientProvider>
    );
  };

  /** Renders the report at a fixed address, with navigation recorded rather than followed. */
  const renderAtAddressRecordingNavigation = (
    search: string,
    countryId = 'us',
    region?: string
  ) => {
    const push = vi.fn();
    const replace = vi.fn();
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={queryClient}>
        <LocationProvider value={{ pathname: '/us/report/3741', search }}>
          <NavigationProvider value={{ push, replace, back: vi.fn() }}>
            {reportView({ region })}
          </NavigationProvider>
        </LocationProvider>
      </QueryClientProvider>,
      countryId
    );
    return { push, replace };
  };

  const renderAtAddress = (search: string, countryId = 'us', region?: string) =>
    renderAtAddressRecordingNavigation(search, countryId, region).push;

  const selectedTab = () => screen.getByRole('tab', { selected: true });
  const addressQuery = () => screen.getByLabelText('Address query');
  const goBack = () =>
    act(async () => {
      await historyNavigate(-1);
    });
  const goForward = () =>
    act(async () => {
      await historyNavigate(1);
    });

  test('given validation opened from its overview card then Back returns to the overview', async () => {
    const user = userEvent.setup();
    renderWithHistory();

    await user.click(screen.getByRole('button', { name: 'Review validation' }));

    expect(selectedTab()).toHaveAccessibleName('Validation');
    expect(addressQuery()).toHaveTextContent('?tab=validation');

    await goBack();

    await waitFor(() => expect(selectedTab()).toHaveAccessibleName('Overview'));
    expect(addressQuery()).toBeEmptyDOMElement();

    await goForward();

    await waitFor(() => expect(selectedTab()).toHaveAccessibleName('Validation'));
  });

  test('given tabs opened in turn then Back steps through each to the overview', async () => {
    const user = userEvent.setup();
    renderWithHistory();

    await user.click(screen.getByRole('tab', { name: 'Household' }));
    await user.click(screen.getByRole('tab', { name: 'Districts' }));
    await goBack();

    await waitFor(() => expect(selectedTab()).toHaveAccessibleName('Household'));

    await goBack();

    await waitFor(() => expect(selectedTab()).toHaveAccessibleName('Overview'));
  });

  test('given the open tab clicked again then no history entry is added', async () => {
    const user = userEvent.setup();
    const push = renderAtAddress('');

    await user.click(screen.getByRole('tab', { name: 'Overview' }));

    expect(push).not.toHaveBeenCalled();
  });

  test('given the address updating after the click then each section opened adds one entry', async () => {
    // A tab asks to open on press and again on focus; Next.js can update
    // the address after both, as this fixed address never does.
    const user = userEvent.setup();
    const push = renderAtAddress('?tab=household');

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    await user.click(screen.getByRole('tab', { name: 'Districts' }));

    expect(push.mock.calls).toEqual([['/us/report/3741'], ['/us/report/3741?tab=districts']]);
  });

  test('given arrow keys moving across several tabs then Back returns to the overview', async () => {
    const user = userEvent.setup();
    renderWithHistory();

    // Clicking the open tab only focuses it.
    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    for (const tabName of ['Economic impacts', 'Districts', 'Household']) {
      await user.keyboard('{ArrowRight}');
      await waitFor(() => expect(selectedTab()).toHaveAccessibleName(tabName));
    }

    await goBack();

    await waitFor(() => expect(selectedTab()).toHaveAccessibleName('Overview'));
    expect(addressQuery()).toBeEmptyDOMElement();
  });

  test('given an arrow key leaving the overview then the section is a new history entry', async () => {
    const user = userEvent.setup();
    const { push, replace } = renderAtAddressRecordingNavigation('');

    await user.click(screen.getByRole('tab', { name: 'Overview' }));
    await user.keyboard('{ArrowRight}');

    await waitFor(() => expect(push).toHaveBeenCalledWith('/us/report/3741?tab=economy'));
    expect(replace).not.toHaveBeenCalled();
  });

  test('given an arrow key moving from one section to another then it replaces the entry', async () => {
    const user = userEvent.setup();
    const { push, replace } = renderAtAddressRecordingNavigation('?tab=economy');

    await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
    await user.keyboard('{ArrowRight}');

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/us/report/3741?tab=districts'));
    expect(push).not.toHaveBeenCalled();
  });

  test('given a click after an arrow key move then the clicked section is a new entry', async () => {
    const user = userEvent.setup();
    const { push, replace } = renderAtAddressRecordingNavigation('?tab=economy');

    await user.click(screen.getByRole('tab', { name: 'Economic impacts' }));
    await user.keyboard('{ArrowRight}');
    await waitFor(() => expect(replace).toHaveBeenCalledTimes(1));
    await user.click(screen.getByRole('tab', { name: 'Validation' }));

    expect(push.mock.calls).toEqual([['/us/report/3741?tab=validation']]);
  });

  test('given an address naming a section then that section opens', () => {
    renderAtAddress('?tab=economy');

    expect(selectedTab()).toHaveAccessibleName('Economic impacts');
  });

  test('given an address naming a section the report does not have then the overview opens', () => {
    renderAtAddress('?tab=districts', 'uk', 'constituency/Bedford');

    expect(selectedTab()).toHaveAccessibleName('Overview');
  });

  test('given Back and Forward restore sections then no tab events are sent', async () => {
    const user = userEvent.setup();
    const gtag = vi.fn();
    window.gtag = gtag;
    renderWithHistory();

    await user.click(screen.getByRole('tab', { name: 'Household' }));
    await goBack();
    await waitFor(() => expect(selectedTab()).toHaveAccessibleName('Overview'));
    await goForward();
    await waitFor(() => expect(selectedTab()).toHaveAccessibleName('Household'));

    expect(gtag.mock.calls).toEqual([
      ['event', 'report_tab_viewed', { country_id: 'us', tab: 'household', region_kind: 'state' }],
    ]);
  });
});
