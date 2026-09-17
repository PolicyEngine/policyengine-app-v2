import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import {
  BillValidationSection,
  ModelTrackRecordSection,
} from '@/components/flagship/ValidationPanel';

describe('BillValidationSection', () => {
  test('given drifted validation then the chip demands a re-check and the note explains', () => {
    render(
      <BillValidationSection
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

describe('ModelTrackRecordSection', () => {
  const ctcMatch = {
    program: 'ctc_refund',
    variable: 'refundable_ctc',
    depth: 2,
    ring: 'mechanism' as const,
  };

  test('given the scorecard is unreachable then an honest note renders, not a blank tab', () => {
    render(<ModelTrackRecordSection trackRecord={null} />);

    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /policyengine scorecard/i })).toBeInTheDocument();
  });

  test('given matches are loading then the spinner state renders', () => {
    render(<ModelTrackRecordSection trackRecord={undefined} />);

    expect(screen.getByText(/loading external comparisons/i)).toBeInTheDocument();
  });

  test('given the reform reaches nothing then nothing renders', () => {
    const { container } = render(
      <ModelTrackRecordSection
        trackRecord={{ modelVersion: '1.808.0', reachedCount: 0, programs: [], rows: [] }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('given reached variables the scorecard does not measure then the note says so', () => {
    render(
      <ModelTrackRecordSection
        trackRecord={{ modelVersion: '1.808.0', reachedCount: 30, programs: [], rows: [] }}
      />
    );

    expect(
      screen.getByText(/none of the 30 variables this reform moves is measured/i)
    ).toBeInTheDocument();
  });

  test('given rows then each program heads its comparisons with its distance from the reform', () => {
    render(
      <ModelTrackRecordSection
        trackRecord={{
          modelVersion: '1.808.0',
          reachedCount: 12,
          programs: [{ program: 'snap', variable: 'snap', depth: 1, ring: 'primary' }, ctcMatch],
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
        }}
      />
    );

    expect(screen.getByText('Baseline comparisons')).toBeInTheDocument();
    expect(screen.getByText('SNAP — Eligible people')).toBeInTheDocument();
    expect(screen.getByText('Refundable CTC — Eligibility rate')).toBeInTheDocument();
    expect(screen.getAllByText(/at policyengine-us 1\.808\.0/)).toHaveLength(2);
    expect(screen.getByText(/Primary · reads the parameter directly/)).toBeInTheDocument();
    expect(screen.getByText(/Mechanism · 2 formula steps from the parameter/)).toBeInTheDocument();
    expect(screen.getByText('69.1M')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Read source' })[0]).toHaveAttribute(
      'href',
      'https://apps.urban.org/features/state-safety-net/'
    );
    expect(screen.getByText(/was not used to calibrate/)).toBeInTheDocument();
    expect(screen.getByText(/not an independent holdout/)).toBeInTheDocument();
  });
});
