import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { CalibrationMatchSection } from '@/components/flagship/CalibrationMatches';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';

describe('CalibrationMatchSection', () => {
  test('given the dashboard is unreachable then an honest note renders', () => {
    render(<CalibrationMatchSection matches={null} />);

    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /calibration dashboard/i })).toHaveAttribute(
      'href',
      expect.stringContaining('calibration-diagnostics')
    );
  });

  test('given matches are loading then the spinner state renders', () => {
    render(<CalibrationMatchSection matches={undefined} />);

    expect(screen.getByText(/checking the calibration/i)).toBeInTheDocument();
  });

  test('given reached variables but none calibrated then the gap is stated, not hidden', () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, geography: 'CA', reachedCount: 33, matches: [] }}
      />
    );

    expect(screen.getByText(/none of the 33 variables .* in CA/i)).toBeInTheDocument();
  });

  test('given no provisions at all then nothing renders', () => {
    const { container } = render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, reachedCount: 0, matches: [] }}
      />
    );

    expect(container).toBeEmptyDOMElement();
  });

  test('given matches then each variable renders with its reach, fit, and worst target', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);

    expect(screen.getByText('refundable ctc')).toBeInTheDocument();
    expect(screen.getAllByText(/mechanism · 3 hops/i)).toHaveLength(2);
    expect(screen.getByText('4.0%')).toBeInTheDocument();
    expect(screen.getByText(/IRS Statistics of Income · US · -6.0%/)).toBeInTheDocument();
    expect(screen.getByText(/release populace-us-2024/)).toBeInTheDocument();
  });

  test('given a variable far off then it is called out above the table', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);

    expect(screen.getByText(/worth a look: ctc is more than 25/i)).toBeInTheDocument();
  });
});
