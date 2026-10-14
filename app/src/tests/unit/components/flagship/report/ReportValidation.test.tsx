import { render, screen, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportValidation from '@/components/flagship/report/ReportValidation';
import type { ScorecardComparisonsState } from '@/components/flagship/ScorecardComparisons';
import { BillExternalEstimates } from '@/components/flagship/ValidationPanel';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  CTC_PATH,
  scorecardClaim,
  utahBaselineClaim,
} from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';

const mockUseScorecardComparisons = vi.fn<() => ScorecardComparisonsState>();

vi.mock('@/components/flagship/ScorecardComparisons', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/components/flagship/ScorecardComparisons')>()),
  useScorecardComparisons: () => mockUseScorecardComparisons(),
}));

const NO_SCORECARD_ROWS = { built: '2026-08-29', rows: [], unmappedCount: 4 };
const RELATED_REFORM = { ...scorecardClaim(), matchBasis: 'parameter' as const };
const UTAH_BASELINE = { ...utahBaselineClaim, matchBasis: 'program' as const };
const EMPTY_TRACK_RECORD = { modelVersion: '1.808.0', reachedCount: 12, programs: [], rows: [] };

function renderValidation(props: Partial<Parameters<typeof ReportValidation>[0]> = {}) {
  return render(
    <ReportValidation
      countryId="us"
      paths={[CTC_PATH]}
      calibration={mockCalibrationMatches}
      trackRecord={EMPTY_TRACK_RECORD}
      {...props}
    />
  );
}

const card = (name: string) =>
  screen.getByRole('heading', { level: 3, name }).closest('section') as HTMLElement;

describe('ReportValidation', () => {
  beforeEach(() => {
    mockUseScorecardComparisons.mockReset();
    mockUseScorecardComparisons.mockReturnValue(NO_SCORECARD_ROWS);
  });

  test('given a custom report then the external estimates, calibration and baseline cards render in order', () => {
    renderValidation();

    expect(
      screen.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)
    ).toEqual(['External estimates', 'Data calibration', 'Baseline comparisons']);
  });

  test('given a custom report without external estimates then one plain line says so', () => {
    renderValidation();

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

  test('given a custom report with scorer estimates then they show instead of the plain line', () => {
    mockUseScorecardComparisons.mockReturnValue({
      ...NO_SCORECARD_ROWS,
      rows: [RELATED_REFORM],
    });
    renderValidation();

    const estimates = card('External estimates');
    expect(within(estimates).getByRole('table', { name: 'Related reforms' })).toBeInTheDocument();
    expect(within(estimates).getByRole('button', { name: 'CTC extension' })).toBeInTheDocument();
    expect(within(estimates).getByText('Joint Committee on Taxation')).toBeInTheDocument();
    expect(
      within(estimates).queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given a bill report then its fiscal note leads the external estimates', () => {
    renderValidation({
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

  test('given scorecard baseline claims then they join the baseline comparisons, not the estimates', () => {
    mockUseScorecardComparisons.mockReturnValue({
      ...NO_SCORECARD_ROWS,
      rows: [UTAH_BASELINE],
    });
    renderValidation();

    expect(
      within(card('Baseline comparisons')).getByRole('button', { name: 'Utah Child Tax Credit' })
    ).toBeInTheDocument();
    expect(
      within(card('External estimates')).getByText(
        'No external estimate is available for this reform.'
      )
    ).toBeInTheDocument();
  });

  test('given the scorecard is still loading then the estimates card says it is loading', () => {
    mockUseScorecardComparisons.mockReturnValue(undefined);
    renderValidation();

    expect(within(card('External estimates')).getByRole('status')).toHaveTextContent(
      'Loading external estimates…'
    );
  });

  test('given the scorecard is unavailable then the estimates card says so, not that none exists', () => {
    mockUseScorecardComparisons.mockReturnValue(null);
    renderValidation();

    expect(
      within(card('External estimates')).getByText(
        'External estimates are temporarily unavailable.'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('No external estimate is available for this reform.')
    ).not.toBeInTheDocument();
  });

  test('given the coverage of the scorecard match then it is collapsed under the estimates', () => {
    renderValidation();

    expect(within(card('External estimates')).getByText('Coverage')).toBeInTheDocument();
    expect(
      within(card('External estimates')).getByText(/4 claims in this country have no usable/)
    ).not.toBeVisible();
  });
});
