import { render, screen, within } from '@test-utils';
import { describe, expect, test } from 'vitest';
import {
  BaselineComparisons,
  BillExternalEstimates,
  trackRecordClaims,
} from '@/components/flagship/ValidationPanel';
import type { ScorecardMatches } from '@/libs/flagship/modelValidation';
import { utahBaselineClaim } from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';
import { TRACKED_BILL } from '@/tests/fixtures/libs/flagship/trackedBillMocks';

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
    render(<BaselineComparisons trackRecord={null} scorecardRows={null} />);

    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view scorecard/i })).toBeInTheDocument();
  });

  test('given matches are loading then the loading state renders', () => {
    render(<BaselineComparisons trackRecord={undefined} scorecardRows={undefined} />);

    expect(
      screen.getByRole('status', { name: 'Loading baseline comparisons' })
    ).toBeInTheDocument();
  });

  test('given the reform reaches nothing then a plain line says no comparison covers it', () => {
    render(
      <BaselineComparisons
        trackRecord={{ modelVersion: '1.808.0', reachedCount: 0, programs: [], rows: [] }}
        scorecardRows={[]}
      />
    );

    expect(screen.getByText('No baseline comparison covers this reform.')).toBeInTheDocument();
  });

  test('given reached variables the scorecard does not measure then the note says so', () => {
    render(
      <BaselineComparisons
        trackRecord={{ modelVersion: '1.808.0', reachedCount: 30, programs: [], rows: [] }}
        scorecardRows={[]}
      />
    );

    expect(
      screen.getByText(/none of the 30 variables this reform moves is measured/i)
    ).toBeInTheDocument();
  });

  test('given track record and scorecard rows then they share one table', () => {
    render(
      <BaselineComparisons
        trackRecord={SNAP_AND_CTC_TRACK_RECORD}
        scorecardRows={[{ ...utahBaselineClaim, matchBasis: 'program' }]}
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
});

describe('trackRecordClaims', () => {
  test('given track record rows then each becomes a baseline claim with its program in the title', () => {
    const [snap] = trackRecordClaims(SNAP_AND_CTC_TRACK_RECORD);

    expect(snap.row.reform_framework).toBe('baseline');
    expect(snap.row.calibration_relationship).toBe('held_out');
    expect(snap.presentation?.title).toBe('SNAP — Eligible people');
    expect(snap.presentation?.externalValue).toBe('69.1M');
  });
});
