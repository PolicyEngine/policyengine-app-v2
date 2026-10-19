import { act, render, screen, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportValidation from '@/components/flagship/report/ReportValidation';
import type { ScorecardComparisonsState } from '@/components/flagship/ScorecardComparisons';
import { BillExternalEstimates } from '@/components/flagship/ValidationPanel';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  CDCC_ELIGIBILITY_MAX_PATH,
  cdccDependencyMap,
  NATIONWIDE,
  REPORT_4332_CLAIMS,
  SOI_CDCC_CLAIM,
  STANDARD_DEDUCTION_PATH,
  TREASURY_CDCC_CLAIM,
} from '@/tests/fixtures/libs/flagship/comparisonRelevanceMocks';
import {
  CTC_PATH,
  scorecardClaim,
  utahBaselineClaim,
} from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';

const mockUseScorecardComparisons =
  vi.fn<(countryId: string, paths: string[]) => ScorecardComparisonsState>();

// The traced map's slice for report 4332, so the relevance check runs on known readers.
vi.mock('@/libs/flagship/parameterDependencies', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/parameterDependencies')>()),
  loadParameterDependencies: () => Promise.resolve(cdccDependencyMap),
}));

vi.mock('@/components/flagship/ScorecardComparisons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/ScorecardComparisons')>()),
  useScorecardComparisons: (countryId: string, paths: string[]) =>
    mockUseScorecardComparisons(countryId, paths),
}));

const NO_SCORECARD_ROWS = { built: '2026-08-29', rows: [], unmappedCount: 4 };
const RELATED_REFORM = { ...scorecardClaim(), matchBasis: 'parameter' as const };
const UTAH_BASELINE = { ...utahBaselineClaim, matchBasis: 'program' as const };
const EMPTY_TRACK_RECORD = { modelVersion: '1.808.0', reachedCount: 12, programs: [], rows: [] };
const SAVED_REFORM_BASELINE = 'Smaller CTC';

/** Renders the section and lets the dependency map resolve, as the page would. */
async function renderValidation(props: Partial<Parameters<typeof ReportValidation>[0]> = {}) {
  render(
    <ReportValidation
      countryId="us"
      paths={[CTC_PATH]}
      calibration={mockCalibrationMatches}
      trackRecord={EMPTY_TRACK_RECORD}
      {...props}
    />
  );
  await act(async () => {});
}

const card = (name: string) =>
  screen.getByRole('heading', { level: 3, name }).closest('section') as HTMLElement;

describe('ReportValidation', () => {
  beforeEach(() => {
    mockUseScorecardComparisons.mockReset();
    mockUseScorecardComparisons.mockReturnValue(NO_SCORECARD_ROWS);
  });

  test('given a custom report then the external estimates, calibration and baseline cards render in order', async () => {
    await renderValidation();

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(['External estimates', 'Data calibration', 'Baseline comparisons']);
  });

  test('given a custom report without external estimates then one plain line says so', async () => {
    await renderValidation();

    expect(
      within(card('External estimates')).getByText(
        'No external estimate is available for this reform.'
      )
    ).toBeInTheDocument();
    expect(within(card('External estimates')).queryByRole('table')).not.toBeInTheDocument();
    // The calibration comparison is there all the same.
    expect(
      within(card('Data calibration')).getByRole('table', { name: 'Calibration targets' })
    ).toBeInTheDocument();
  });

  test('given a custom report with scorer estimates then they show instead of the plain line', async () => {
    mockUseScorecardComparisons.mockReturnValue({
      ...NO_SCORECARD_ROWS,
      rows: [RELATED_REFORM],
    });
    await renderValidation();

    const estimates = card('External estimates');
    expect(within(estimates).getByRole('table', { name: 'Related reforms' })).toBeInTheDocument();
    expect(within(estimates).getByRole('button', { name: 'CTC extension' })).toBeInTheDocument();
    expect(within(estimates).getByText('Joint Committee on Taxation')).toBeInTheDocument();
    expect(
      within(estimates).queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given a bill report then its fiscal note leads the external estimates', async () => {
    await renderValidation({
      externalEstimates: (
        <BillExternalEstimates billId={TRACKED_BILL.id} validation={TRACKED_BILL.validation!} />
      ),
      externalEstimatesNote: 'Tracker estimate: policyengine-us 1.729.3',
    });

    const estimates = card('External estimates');
    expect(
      within(estimates).getByRole('table', { name: 'Estimates for this bill' })
    ).toBeInTheDocument();
    expect(within(estimates).getByText('Within fiscal-note range · Δ 2%')).toBeInTheDocument();
    expect(
      within(estimates).getByText('Tracker estimate: policyengine-us 1.729.3')
    ).toBeInTheDocument();
    expect(
      within(estimates).queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given report 4332 then the baseline card lists only the CDCC comparisons', async () => {
    mockUseScorecardComparisons.mockReturnValue({
      ...NO_SCORECARD_ROWS,
      rows: REPORT_4332_CLAIMS,
    });
    await renderValidation({ paths: [CDCC_ELIGIBILITY_MAX_PATH], region: NATIONWIDE });

    const baseline = card('Baseline comparisons');
    const table = await within(baseline).findByRole('table', { name: 'Baseline comparisons' });
    expect(
      within(table)
        .getAllByRole('button')
        .map((button) => button.textContent)
    ).toEqual([TREASURY_CDCC_CLAIM.name, SOI_CDCC_CLAIM.name]);
    expect(within(table).getAllByRole('link', { name: 'View in scorecard' })).toHaveLength(2);
    expect(within(table).queryByText('Period not recorded separately')).not.toBeInTheDocument();
    expect(
      within(card('External estimates')).getByText(
        'No external estimate is available for this reform.'
      )
    ).toBeInTheDocument();
  });

  test('given baseline claims of other programs then one plain line says none applies', async () => {
    mockUseScorecardComparisons.mockReturnValue({
      ...NO_SCORECARD_ROWS,
      rows: REPORT_4332_CLAIMS,
    });
    await renderValidation({ paths: [STANDARD_DEDUCTION_PATH], region: NATIONWIDE });

    expect(
      await within(card('Baseline comparisons')).findByText(
        'No scorecard comparison measures the programs this reform changes.'
      )
    ).toBeInTheDocument();
    expect(within(card('Baseline comparisons')).queryByRole('table')).not.toBeInTheDocument();
  });

  test('given the scorecard is still loading then the estimates card says it is loading', async () => {
    mockUseScorecardComparisons.mockReturnValue(undefined);
    await renderValidation();

    expect(
      within(card('External estimates')).getByRole('status', { name: 'Loading external estimates' })
    ).toBeInTheDocument();
  });

  test('given the scorecard is unavailable then the estimates card says so, not that none exists', async () => {
    mockUseScorecardComparisons.mockReturnValue(null);
    await renderValidation();

    expect(
      within(card('External estimates')).getByText(
        'External estimates are temporarily unavailable.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given the coverage of the scorecard match then it is collapsed under the estimates', async () => {
    await renderValidation();

    expect(within(card('External estimates')).getByText('Coverage')).toBeInTheDocument();
    expect(
      within(card('External estimates')).getByText(/4 claims in this country have no usable/)
    ).not.toBeVisible();
  });

  test('given a custom baseline then both scorecard cards are marked not comparable', async () => {
    mockUseScorecardComparisons.mockReturnValue({
      ...NO_SCORECARD_ROWS,
      rows: [RELATED_REFORM, UTAH_BASELINE],
    });
    await renderValidation({ baselineLabel: SAVED_REFORM_BASELINE });

    for (const name of ['External estimates', 'Baseline comparisons']) {
      expect(within(card(name)).getByText('Not comparable')).toBeInTheDocument();
      expect(within(card(name)).queryByRole('table')).not.toBeInTheDocument();
    }
    expect(
      within(card('External estimates')).getByText(
        'External estimates assume current law. This report compares with Smaller CTC.'
      )
    ).toBeInTheDocument();
    expect(
      within(card('Baseline comparisons')).getByText(
        'The scorecard measures current law. This report compares with Smaller CTC.'
      )
    ).toBeInTheDocument();
  });

  test('given a custom baseline then the scorecard is not asked and calibration still shows', async () => {
    await renderValidation({ baselineLabel: SAVED_REFORM_BASELINE });

    expect(mockUseScorecardComparisons).toHaveBeenCalledWith('us', []);
    expect(
      within(card('Data calibration')).getByRole('table', { name: 'Calibration targets' })
    ).toBeInTheDocument();
  });

  test('given current law then the scorecard is asked for the reform paths and nothing is marked', async () => {
    await renderValidation();

    expect(mockUseScorecardComparisons).toHaveBeenCalledWith('us', [CTC_PATH]);
    expect(screen.queryByText('Not comparable')).not.toBeInTheDocument();
  });

  test('given a UK report then one line says calibration is US-only and no US data shows', async () => {
    await renderValidation({
      countryId: 'uk',
      region: 'uk',
      paths: ['gov.simulation.capital_gains_responses.elasticity'],
      // Even if a caller hands over US results, a UK report does not show them,
      // nor a US state's overall data fit.
      calibration: { ...mockCalibrationMatches, geography: 'DC' },
    });

    const calibration = card('Data calibration');
    expect(
      within(calibration).getByText('Calibration diagnostics are available for US reports for now.')
    ).toBeInTheDocument();
    expect(within(calibration).queryByText(/data fit/)).not.toBeInTheDocument();
    expect(within(calibration).queryByRole('table')).not.toBeInTheDocument();
    expect(within(calibration).queryByRole('link')).not.toBeInTheDocument();
    expect(
      within(card('Baseline comparisons')).getByRole('link', { name: /view scorecard/i })
    ).toHaveAttribute('href', 'https://www.policyengine.org/scorecard?view=scorecard&country=uk');
  });
});
