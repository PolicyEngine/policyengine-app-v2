import { act, fireEvent, render, renderHook, screen, waitFor, within } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  CalibrationMatchSection,
  useCalibrationMatches,
} from '@/components/flagship/CalibrationMatches';
import {
  summarizeGeographyFit,
  type CalibrationMatches,
  type GeographyCalibrationFit,
} from '@/libs/flagship/calibrationMatching';
import {
  mockCalibrationMatches,
  mockCtcLimitingMatch,
  mockDcFitRows,
  mockDcIncomeTaxRow,
  POPULACE_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import {
  mockReportValidationSnapshot,
  NEWER_RELEASE_ID,
} from '@/tests/fixtures/libs/flagship/reportValidationMocks';

const mockCalibrationMatchesForPaths =
  vi.fn<(paths: string[], geography: string) => Promise<CalibrationMatches | null>>();

const mockCalibrationFitForGeography =
  vi.fn<(geography: string) => Promise<GeographyCalibrationFit | null>>();

vi.mock('@/libs/flagship/calibrationMatching', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/calibrationMatching')>()),
  calibrationMatchesForPaths: (paths: string[], geography: string) =>
    mockCalibrationMatchesForPaths(paths, geography),
  calibrationFitForGeography: (geography: string) => mockCalibrationFitForGeography(geography),
}));

/** DC's overall fit over its five fixture targets, the three worst listed. */
const dcFit = (): GeographyCalibrationFit =>
  summarizeGeographyFit('DC', POPULACE_RELEASE_ID, mockDcFitRows, 3);

beforeEach(() => {
  mockCalibrationFitForGeography.mockReset();
  mockCalibrationFitForGeography.mockResolvedValue(dcFit());
});

/** A UK parameter that is also in the US dependency map. */
const UK_ELASTICITY_PATH = 'gov.simulation.capital_gains_responses.elasticity';

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

  test('given no target of a changed program then one plain line says so', async () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, geography: 'CA', reachedCount: 33, matches: [] }}
      />
    );

    expect(screen.getByRole('heading', { name: 'Data calibration' })).toBeInTheDocument();
    expect(
      screen.getByText('No calibration target measures the programs this reform changes.')
    ).toBeInTheDocument();
    // Only the state's overall fit has a table; the reform has none.
    await screen.findByRole('heading', { name: 'California data fit' });
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(screen.queryByRole('table', { name: /^(Related )?calibration targets$/i })).toBeNull();
  });

  test('given the map traces nothing the reform changes then it says so, not "no target"', () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, geography: 'US', reachedCount: 0, matches: [] }}
      />
    );

    expect(
      screen.getByText(/does not trace the parameters this reform changes/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/No calibration target measures/)).not.toBeInTheDocument();
  });

  test('given nothing measures the change but related targets do then they show as related', async () => {
    render(
      <CalibrationMatchSection
        matches={{
          ...mockCalibrationMatches,
          geography: 'VT',
          matches: [],
          related: mockCalibrationMatches.matches.slice(0, 1),
        }}
      />
    );

    // Related targets are measured, so the card must not say no target measures anything.
    expect(screen.queryByText(/No calibration target measures/)).not.toBeInTheDocument();
    expect(
      screen.getByText(/These targets in Vermont do not measure a program this reform changes/)
    ).toHaveTextContent('the change reaches them through the model');
    expect(screen.getByRole('table', { name: 'Related calibration targets' })).toBeInTheDocument();
    await screen.findByRole('heading', { name: 'Vermont data fit' });
  });

  test('given a DC CTC reform matching the DC income tax target then it shows as a direct match', async () => {
    render(
      <CalibrationMatchSection
        matches={{
          ...mockCalibrationMatches,
          geography: 'DC',
          matches: [
            {
              variable: 'state_income_tax',
              depth: 3,
              via: 'dc_income_tax',
              ring: 'mechanism',
              targets: [mockDcIncomeTaxRow],
              targetCount: 1,
              meanAbsRelativeError: 0.0646,
              worst: mockDcIncomeTaxRow,
            },
          ],
        }}
      />
    );

    const table = screen.getByRole('table', { name: 'Calibration targets' });
    expect(within(table).getByText('State income tax')).toBeInTheDocument();
    expect(within(table).getByRole('button', { name: 'Collections · t40' })).toBeInTheDocument();
    expect(within(table).getByText('6.5%')).toBeInTheDocument();
    expect(screen.queryByText(/No calibration target measures/)).not.toBeInTheDocument();
    await screen.findByRole('table', {
      name: 'Worst-fit calibration targets in District of Columbia',
    });
  });

  test('given a state report then the state’s overall data fit follows, as context', async () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, geography: 'DC', matches: [], related: [] }}
      />
    );

    // The reform-specific line comes first, then the state summary.
    expect(
      screen.getByText('No calibration target measures the programs this reform changes.')
    ).toBeInTheDocument();
    expect(
      await screen.findByRole('heading', { name: 'District of Columbia data fit' })
    ).toBeInTheDocument();
    expect(mockCalibrationFitForGeography).toHaveBeenCalledWith('DC');
    expect(
      screen.getByText(
        /How well the data fits District of Columbia overall, whatever the reform changes\./
      )
    ).toHaveTextContent('5 targets, 60.0% within 10.0% of the official value');
    const table = screen.getByRole('table', {
      name: 'Worst-fit calibration targets in District of Columbia',
    });
    const rows = within(table).getAllByRole('row').slice(1);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Rental income');
    expect(rows[0]).toHaveTextContent('9739%');
    expect(rows[1]).toHaveTextContent('TANF');
    expect(rows[1]).toHaveTextContent('-79.3%');
    expect(rows[2]).toHaveTextContent('State income tax');
    expect(within(rows[2]).getByRole('button', { name: 'Collections · t40' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'View all District of Columbia targets in dashboard' })
    ).toHaveAttribute('href', expect.stringContaining('level=state&geography=DC'));
  });

  test('given the state fit is unavailable then the summary says so', async () => {
    mockCalibrationFitForGeography.mockResolvedValue(null);
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, geography: 'DC', matches: [], related: [] }}
      />
    );

    expect(
      await screen.findByText(
        'The District of Columbia calibration targets are temporarily unavailable.'
      )
    ).toBeInTheDocument();
  });

  test('given a national report then no state summary is fetched or shown', async () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);

    await act(async () => {});
    expect(mockCalibrationFitForGeography).not.toHaveBeenCalled();
    expect(screen.queryByText(/data fit/)).not.toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
  });

  test('given direct matches then related targets do not show', () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, related: mockCalibrationMatches.matches }}
      />
    );

    expect(screen.getByRole('table', { name: 'Calibration targets' })).toBeInTheDocument();
    expect(
      screen.queryByRole('table', { name: 'Related calibration targets' })
    ).not.toBeInTheDocument();
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
    expect(screen.getByRole('button', { name: 'Returns' })).toHaveAttribute(
      'title',
      'irs_soi.ty2023.table_1_4.all.actc_returns@2024'
    );
    expect(screen.queryByText(/irs_soi\.ty2023/)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/formula steps|How to interpret|Worth a look/i)
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'View targets' })[0]).toHaveAttribute(
      'href',
      expect.stringContaining('source=irs_soi&level=national')
    );
  });

  test('clicking a target opens its exact values and its dashboard id', () => {
    render(<CalibrationMatchSection matches={mockCalibrationMatches} />);
    fireEvent.click(screen.getByRole('button', { name: 'Returns' }));

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Refundable Child Tax Credit · Returns')).toBeInTheDocument();
    expect(
      within(dialog).getByText('irs_soi.ty2023.table_1_4.all.actc_returns@2024')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('940,000')).toBeInTheDocument();
    expect(within(dialog).getByText('1,000,000')).toBeInTheDocument();
  });

  test('given a group named for a raw model variable then it reads as words', () => {
    render(
      <CalibrationMatchSection
        matches={{ ...mockCalibrationMatches, matches: [mockCtcLimitingMatch] }}
      />
    );

    expect(screen.getByText('CTC limiting tax liability')).toBeInTheDocument();
    expect(screen.queryByText(/ctc_limiting|Ctc limiting/)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Amount' })).toBeInTheDocument();
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

describe('useCalibrationMatches', () => {
  beforeEach(() => {
    mockCalibrationMatchesForPaths.mockReset();
    mockCalibrationMatchesForPaths.mockResolvedValue(mockCalibrationMatches);
  });

  test('given a UK report then no US calibration target is fetched', async () => {
    const { result } = renderHook(() => useCalibrationMatches([UK_ELASTICITY_PATH], 'uk', 'uk'));

    await waitFor(() => expect(result.current).toBeNull());
    expect(mockCalibrationMatchesForPaths).not.toHaveBeenCalled();
  });

  test('given the country is not known yet then nothing is fetched', async () => {
    const { result } = renderHook(() =>
      useCalibrationMatches([UK_ELASTICITY_PATH], undefined, undefined)
    );

    await act(async () => {});
    expect(result.current).toBeUndefined();
    expect(mockCalibrationMatchesForPaths).not.toHaveBeenCalled();
  });

  test('given a US state report then the state targets are fetched as before', async () => {
    const { result } = renderHook(() =>
      useCalibrationMatches([UK_ELASTICITY_PATH], 'state/ca', 'us')
    );

    await waitFor(() => expect(result.current).toEqual(mockCalibrationMatches));
    expect(mockCalibrationMatchesForPaths).toHaveBeenCalledWith([UK_ELASTICITY_PATH], 'CA');
  });
});
