import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { ModelTrackRecordSection } from '@/components/flagship/ValidationPanel';

describe('ModelTrackRecordSection', () => {
  test('given the scorecard is unreachable then an honest note renders, not a blank tab', () => {
    render(<ModelTrackRecordSection trackRecord={{ programs: ['snap'], rows: null }} />);

    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /policyengine scorecard/i })).toBeInTheDocument();
  });

  test('given rows are loading then the spinner state renders', () => {
    render(<ModelTrackRecordSection trackRecord={{ programs: ['snap'], rows: undefined }} />);

    expect(screen.getByText(/loading external comparisons/i)).toBeInTheDocument();
  });

  test('given no matched programs then nothing renders', () => {
    const { container } = render(
      <ModelTrackRecordSection trackRecord={{ programs: [], rows: undefined }} />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('given rows then the comparison table renders with honesty labels', () => {
    render(
      <ModelTrackRecordSection
        trackRecord={{
          programs: ['snap'],
          rows: [
            {
              source: 'urban-sotsn',
              program: 'snap',
              metric: 'eligible_count',
              period: '2023 average month',
              status: 'comparable',
              unitConcept: 'persons',
              externalValue: 69128000,
              peValue: 66363627,
              ratio: 0.96,
              heldOut: true,
            },
          ],
        }}
      />
    );

    expect(screen.getByText(/SNAP · Eligible people/)).toBeInTheDocument();
    expect(screen.getByText('0.96×')).toBeInTheDocument();
    expect(screen.getByText('held out')).toBeInTheDocument();
  });
});
