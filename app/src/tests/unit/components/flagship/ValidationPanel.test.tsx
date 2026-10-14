import { render, screen, within } from '@test-utils';
import { describe, expect, test } from 'vitest';
import type { BillValidation } from '@/api/billFeed';
import {
  BaselineComparisons,
  BillExternalEstimates,
  trackRecordClaims,
} from '@/components/flagship/ValidationPanel';
import { SCORECARD_COMPARISON_URL, type ScorecardMatches } from '@/libs/flagship/modelValidation';
import {
  NATIONWIDE,
  REFUNDABLE_CTC_MAX_PATH,
  REPORT_4332_CLAIMS,
  REPORT_4332_REFORM,
  SNAP_DEDUCTION_PATH,
  SOI_CDCC_CLAIM,
  STANDARD_DEDUCTION_PATH,
  TREASURY_CDCC_CLAIM,
  usReform,
  UT_CTC_AMOUNT_PATH,
  UTAH,
} from '@/tests/fixtures/libs/flagship/comparisonRelevanceMocks';
import { utahBaselineClaim } from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';

/** The scorecard's registry of published claims, where baseline claims are listed. */
const SCORECARD_CLAIMS_URL = 'https://www.policyengine.org/scorecard?view=validation';
const NO_COMPARISON = 'No scorecard comparison measures the programs this reform changes.';
const EMPTY_TRACK_RECORD: ScorecardMatches = {
  modelVersion: '1.808.0',
  reachedCount: 0,
  programs: [],
  rows: [],
};

const SNAP_AND_CTC_TRACK_RECORD: ScorecardMatches = {
  modelVersion: '1.808.0',
  reachedCount: 12,
  programs: [
    { program: 'snap', variable: 'snap', depth: 1, ring: 'primary' },
    { program: 'ctc_refund', variable: 'refundable_ctc', depth: 2, ring: 'mechanism' },
  ],
  rows: [
    {
      source: 'urban-sotsn',
      sourceName: 'Urban Institute — State of the Safety Net 2025',
      sourceUrl: 'https://apps.urban.org/features/state-safety-net/',
      program: 'snap',
      metric: 'eligible_count',
      period: '2023 average month',
      status: 'comparable',
      unitConcept: 'persons',
      externalValue: 69128000,
      peValue: 66363627,
      ratio: 0.96,
      heldOut: true,
      policyengineVariables: ['snap', 'is_snap_eligible'],
    },
    {
      source: 'urban-sotsn',
      sourceName: 'Urban Institute — State of the Safety Net 2025',
      sourceUrl: 'https://apps.urban.org/features/state-safety-net/',
      program: 'ctc_refund',
      metric: 'eligibility_rate',
      period: '2023 average month',
      status: 'constructed',
      unitConcept: 'tax units',
      externalValue: 0.12,
      peValue: 0.114,
      ratio: 0.95,
      heldOut: false,
      policyengineVariables: ['refundable_ctc'],
    },
  ],
};

/** A fiscal note stored as a range with its source and link, but no point estimate. */
const RANGE_ONLY_FISCAL_NOTE: BillValidation = {
  peEstimate: -800_583_615,
  fiscalNoteSource: 'GA Dept. of Audits & Accounts / OPB',
  fiscalNoteUrl: 'https://opb.georgia.gov/fiscal-notes/hb1001',
  targetRangeLow: -840_000_000,
  targetRangeHigh: -680_000_000,
  withinRange: true,
  differencePct: 5.3,
};

describe('BillExternalEstimates', () => {
  test('given a bill with a fiscal note then every estimate shares one aligned table', () => {
    render(
      <BillExternalEstimates billId={TRACKED_BILL.id} validation={TRACKED_BILL.validation!} />
    );

    const table = screen.getByRole('table', { name: 'Estimates for this bill' });
    const cells = (name: string) =>
      within(within(table).getByRole('row', { name: new RegExp(`^${name}`) }))
        .getAllByRole('cell')
        .map((cell) => cell.textContent);
    expect(cells('PolicyEngine')).toEqual(['-$225.5B', '—']);
    expect(cells('Official fiscal note')).toEqual(['-$230.0B', '2.0%']);
    expect(cells('CRFB')).toEqual(['-$220.0B', '-2.5%']);
    expect(cells('Accepted range')).toEqual(['-$250.0B to -$210.0B', '']);
    expect(screen.getByText('Within fiscal-note range · Δ 2%')).toBeInTheDocument();
    expect(screen.getByText(/later effective date/)).toBeInTheDocument();
  });

  test('given a fiscal note with a range and no point estimate then the range names and links it', () => {
    // As ga-hb1001 stores it: the note's range, its source and its link, no single number.
    render(<BillExternalEstimates billId="ga-hb1001" validation={RANGE_ONLY_FISCAL_NOTE} />);

    const table = screen.getByRole('table', { name: 'Estimates for this bill' });
    const range = within(table).getByRole('row', { name: /^Accepted range/ });
    expect(within(range).getByText(RANGE_ONLY_FISCAL_NOTE.fiscalNoteSource!)).toBeInTheDocument();
    expect(within(range).getByRole('link', { name: 'Read source' })).toHaveAttribute(
      'href',
      RANGE_ONLY_FISCAL_NOTE.fiscalNoteUrl
    );
    expect(screen.getByText('Within fiscal-note range · Δ 5.3%')).toBeInTheDocument();
  });

  test('given a fiscal note with a link and no estimate or range then a row still links it', () => {
    render(
      <BillExternalEstimates
        billId="ga-hb1001"
        validation={{
          ...RANGE_ONLY_FISCAL_NOTE,
          targetRangeLow: undefined,
          targetRangeHigh: undefined,
        }}
      />
    );

    const table = screen.getByRole('table', { name: 'Estimates for this bill' });
    const row = within(table).getByRole('row', {
      name: new RegExp(`^${RANGE_ONLY_FISCAL_NOTE.fiscalNoteSource}`),
    });
    expect(within(row).getAllByRole('cell').map((cell) => cell.textContent)).toEqual([
      'No estimate',
      '—',
    ]);
    expect(within(row).getByRole('link', { name: 'Read source' })).toHaveAttribute(
      'href',
      RANGE_ONLY_FISCAL_NOTE.fiscalNoteUrl
    );
  });

  test('given a fiscal note with a named source then its row is called by that source', () => {
    // A proxy note (ct-sb78: OFA's score of another bill) must not read as the bill's own.
    render(
      <BillExternalEstimates
        billId="ct-sb78"
        validation={{
          peEstimate: -60_000_000,
          fiscalNoteEstimate: -57_500_000,
          fiscalNoteSource: 'OFA fiscal note for sSB-1 Sec. 6',
          withinRange: true,
        }}
      />
    );

    const table = screen.getByRole('table', { name: 'Estimates for this bill' });
    expect(
      within(table).getByRole('row', { name: /^OFA fiscal note for sSB-1 Sec\. 6/ })
    ).toHaveTextContent('-$57.5M');
    expect(within(table).queryByText('Official fiscal note')).not.toBeInTheDocument();
  });

  test('given a bill outside the range then the chip says so', () => {
    render(
      <BillExternalEstimates
        billId={TRACKED_BILL.id}
        validation={{ ...TRACKED_BILL.validation!, withinRange: false, differencePct: 31 }}
      />
    );

    expect(screen.getByText('Outside fiscal-note range · Δ 31%')).toBeInTheDocument();
  });

  test('given drifted validation then the chip demands a re-check and the note explains', () => {
    render(
      <BillExternalEstimates
        billId="ut-sb60"
        validation={{
          peEstimate: -120000000,
          fiscalNoteEstimate: -118000000,
          withinRange: true,
          drift: { stale: true, reasons: ['the model estimate has changed since validation'] },
        }}
      />
    );

    expect(screen.getByText(/re-check needed/i)).toBeInTheDocument();
    expect(screen.getByText(/predates the current analysis/i)).toBeInTheDocument();
    expect(screen.queryByText(/within fiscal-note range/i)).not.toBeInTheDocument();
  });
});

describe('BaselineComparisons', () => {
  test('given the scorecard is unreachable then an honest note renders, not a blank card', () => {
    render(
      <BaselineComparisons trackRecord={null} scorecardRows={null} reform={REPORT_4332_REFORM} />
    );

    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view scorecard/i })).toBeInTheDocument();
  });

  test('given matches are loading then the loading state renders', () => {
    render(
      <BaselineComparisons trackRecord={undefined} scorecardRows={undefined} reform={undefined} />
    );

    expect(
      screen.getByRole('status', { name: 'Loading baseline comparisons' })
    ).toBeInTheDocument();
  });

  test('given the reform is still being traced then rows wait instead of showing unchecked', () => {
    render(
      <BaselineComparisons
        trackRecord={EMPTY_TRACK_RECORD}
        scorecardRows={REPORT_4332_CLAIMS}
        reform={undefined}
      />
    );

    expect(
      screen.getByRole('status', { name: 'Loading baseline comparisons' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('given the reform reaches nothing then a plain line says no comparison covers it', () => {
    render(
      <BaselineComparisons
        trackRecord={EMPTY_TRACK_RECORD}
        scorecardRows={[]}
        reform={REPORT_4332_REFORM}
      />
    );

    expect(screen.getByText(NO_COMPARISON)).toBeInTheDocument();
  });

  test('given only loose matches then one plain line says so instead of listing them', () => {
    render(
      <BaselineComparisons
        trackRecord={SNAP_AND_CTC_TRACK_RECORD}
        scorecardRows={REPORT_4332_CLAIMS}
        reform={usReform([STANDARD_DEDUCTION_PATH], NATIONWIDE)}
      />
    );

    expect(screen.getByText(NO_COMPARISON)).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  test('given report 4332 then only the CDCC rows show, each linked to the scorecard', () => {
    render(
      <BaselineComparisons
        trackRecord={EMPTY_TRACK_RECORD}
        scorecardRows={REPORT_4332_CLAIMS}
        reform={REPORT_4332_REFORM}
      />
    );

    const table = screen.getByRole('table', { name: 'Baseline comparisons' });
    expect(within(table).getAllByRole('row')).toHaveLength(3);
    expect(
      within(table).getByRole('button', { name: TREASURY_CDCC_CLAIM.name })
    ).toBeInTheDocument();
    expect(within(table).getByRole('button', { name: SOI_CDCC_CLAIM.name })).toBeInTheDocument();
    expect(within(table).queryByText(/Maryland|South Carolina|saver/i)).not.toBeInTheDocument();
    for (const link of within(table).getAllByRole('link', { name: 'View in scorecard' })) {
      expect(link).toHaveAttribute('href', SCORECARD_CLAIMS_URL);
    }
    expect(within(table).queryByText(/not recorded/i)).not.toBeInTheDocument();
  });

  test('given track record and scorecard rows then they share one table', () => {
    render(
      <BaselineComparisons
        trackRecord={SNAP_AND_CTC_TRACK_RECORD}
        scorecardRows={[{ ...utahBaselineClaim, matchBasis: 'program' }]}
        reform={usReform([SNAP_DEDUCTION_PATH, REFUNDABLE_CTC_MAX_PATH, UT_CTC_AMOUNT_PATH], UTAH)}
      />
    );

    expect(screen.getByRole('heading', { name: 'Baseline comparisons' })).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.getByRole('button', { name: 'SNAP — Eligible people' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Refundable CTC — Eligibility rate' })
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Utah Child Tax Credit' })).toBeInTheDocument();
    expect(screen.queryByText(/formula steps/)).not.toBeInTheDocument();
    expect(screen.getByText('69.1M')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Read source' })[0]).toHaveAttribute(
      'href',
      'https://apps.urban.org/features/state-safety-net/'
    );
  });

  test('given both kinds of row then each links to the scorecard view that lists it', () => {
    render(
      <BaselineComparisons
        trackRecord={SNAP_AND_CTC_TRACK_RECORD}
        scorecardRows={[{ ...utahBaselineClaim, matchBasis: 'program' }]}
        reform={usReform([SNAP_DEDUCTION_PATH, UT_CTC_AMOUNT_PATH], UTAH)}
      />
    );

    const scorecardLink = (title: string) =>
      within(screen.getByRole('row', { name: new RegExp(`^${title}`) })).getByRole('link', {
        name: 'View in scorecard',
      });
    expect(scorecardLink('SNAP — Eligible people')).toHaveAttribute(
      'href',
      SCORECARD_COMPARISON_URL
    );
    expect(scorecardLink('Utah Child Tax Credit')).toHaveAttribute('href', SCORECARD_CLAIMS_URL);
  });
});

describe('trackRecordClaims', () => {
  test('given track record rows then each becomes a baseline claim with its program in the title', () => {
    const [snap] = trackRecordClaims(SNAP_AND_CTC_TRACK_RECORD);

    expect(snap.row.reform_framework).toBe('baseline');
    expect(snap.row.calibration_relationship).toBe('held_out');
    expect(snap.row.program).toBe('snap');
    expect(snap.presentation?.title).toBe('SNAP — Eligible people');
    expect(snap.presentation?.externalValue).toBe('69.1M');
  });

  test('given a row without a model period then none is invented', () => {
    const [snap] = trackRecordClaims(SNAP_AND_CTC_TRACK_RECORD);

    expect(snap.presentation?.modelPeriod).toBeUndefined();
    expect(snap.presentation?.externalPeriod).toBe('2023 average month');
  });
});
