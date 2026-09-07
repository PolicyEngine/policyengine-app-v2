import { render, screen } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { CalibrationMatchSection } from '@/components/flagship/CalibrationMatches';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  mockReportValidationSnapshot,
  NEWER_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/reportValidationMocks';

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
    expect(screen.getAllByRole('link', { name: 'IRS Statistics of Income · US' })).toHaveLength(2);
    expect(screen.getByText(/-6.0%/)).toBeInTheDocument();
    expect(screen.getByText(/release populace-us-2024/)).toBeInTheDocument();
  });

  test('given matches then worst targets and counts link to the dashboard filtered by source and level', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);

    const worst = screen.getAllByRole('link', { name: 'IRS Statistics of Income · US' });
    expect(worst[0]).toHaveAttribute(
      'href',
      'https://calibration-diagnostics.vercel.app/calibration/dashboard/populace/targets?source=irs_soi&level=national'
    );
    expect(screen.getAllByRole('link', { name: '2' })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('source=irs_soi&level=national')
    );
  });

  test('given a variable far off then it is called out above the table', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);

    expect(screen.getByText(/worth a look: ctc is more than 25/i)).toBeInTheDocument();
  });

  test('given a pin that is still current then the card says when it was pinned', () => {
    render(
      <CalibrationMatchSection
        matches={mockCalibrationMatches}
        pin={{ snapshot: mockReportValidationSnapshot, drift: [] }}
      />
    );

    expect(
      screen.getByText(/pinned 2026-09-07; the release and model .* still current/i)
    ).toBeInTheDocument();
  });

  test('given a pin that has drifted then the card names what moved and calls the pin historical', () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, releaseId: NEWER_RELEASE_ID }}
        pin={{
          snapshot: mockReportValidationSnapshot,
          drift: [`the calibration dashboard now serves release ${NEWER_RELEASE_ID}`],
        }}
      />
    );

    expect(
      screen.getByText(
        new RegExp(`since then the calibration dashboard now serves release ${NEWER_RELEASE_ID}`)
      )
    ).toBeInTheDocument();
    expect(screen.getByText(/the pinned one is historical/i)).toBeInTheDocument();
  });
});
