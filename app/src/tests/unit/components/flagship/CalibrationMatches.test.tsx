import { fireEvent, render, screen, within } from '@test-utils';
import { describe, expect, test } from 'vitest';
import { CalibrationMatchSection } from '@/components/flagship/CalibrationMatches';
import {
  mockCalibrationMatches,
  POPULACE_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  mockReportValidationSnapshot,
  NEWER_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/reportValidationMocks';

describe('CalibrationMatchSection', () => {
  test('given the dashboard is unreachable then an honest note renders', () => {
    render(<CalibrationMatchSection matches={null} />);

    expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view dashboard/i })).toHaveAttribute(
      'href',
      expect.stringContaining('calibration-diagnostics')
    );
  });

  test('given matches are loading then the loading state renders', () => {
    render(<CalibrationMatchSection matches={undefined} />);

    expect(
      screen.getByRole('status', { name: 'Checking calibration targets' })
    ).toBeInTheDocument();
  });

  test('given reached variables but none calibrated then the gap is stated, not hidden', () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, geography: 'CA', reachedCount: 33, matches: [] }}
      />
    );

    expect(screen.getByText(/none of the 33 variables .* in CA/i)).toBeInTheDocument();
  });

  test('given no provisions at all then a plain line says no target covers the reform', () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, reachedCount: 0, matches: [] }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Data calibration' })).toBeInTheDocument();
    expect(screen.getByText('No calibration target covers this reform.')).toBeInTheDocument();
  });

  test('shows each target with its period, values, gap and source link', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);
    // One table, so every variable's numbers line up in the same columns.
    const table = screen.getByRole('table', { name: 'Calibration targets' });
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent)
    ).toEqual(['Target', 'Period', 'Official', 'PolicyEngine', 'Gap']);
    expect(screen.getByText('Refundable Child Tax Credit')).toBeInTheDocument();
    expect(screen.getAllByText('IRS Statistics of Income · US')).toHaveLength(2);
    expect(screen.getByText('940K')).toBeInTheDocument();
    expect(screen.getAllByText('1M')[0]).toBeInTheDocument();
    expect(screen.getByText('-6.0%')).toBeInTheDocument();
    expect(screen.getAllByText('2024')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'irs_soi.ty2023.table_1_4.all.actc_returns@2024' })
    ).toBeInTheDocument();
    expect(
      screen.queryByText(/formula steps|How to interpret|Worth a look/i)
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View targets' })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('source=irs_soi&level=national')
    );
  });

  test('clicking a target opens its exact values', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'irs_soi.ty2023.table_1_4.all.actc_returns@2024' })
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('940,000')).toBeInTheDocument();
    expect(screen.getByText('1,000,000')).toBeInTheDocument();
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

  test('given matches then the data release id is collapsed under one label', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);

    expect(screen.getByText('Data release')).toBeInTheDocument();
    expect(screen.getByText(`${POPULACE_RELEASE_ID} · policyengine-us 1.808.0`)).not.toBeVisible();
  });
});
