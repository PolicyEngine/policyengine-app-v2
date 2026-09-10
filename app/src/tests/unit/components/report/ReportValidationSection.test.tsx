import { render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportValidationSection from '@/components/report/ReportValidationSection';
import { mockCalibrationMatches } from '@/tests/fixtures/libs/flagship/calibrationMatchingMocks';
import type { Policy } from '@/types/ingredients/Policy';

const {
  mockCalibrationMatchesForPaths,
  mockScorecardProgramsForPaths,
  mockFetchModelValidation,
  mockFindByApiReportId,
  mockIsFlagshipShellEnabled,
} = vi.hoisted(() => ({
  mockCalibrationMatchesForPaths: vi.fn(),
  mockScorecardProgramsForPaths: vi.fn(),
  mockFetchModelValidation: vi.fn(),
  mockFindByApiReportId: vi.fn(),
  mockIsFlagshipShellEnabled: vi.fn(),
}));

vi.mock('@/libs/flagship/calibrationMatching', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/calibrationMatching')>()),
  calibrationMatchesForPaths: mockCalibrationMatchesForPaths,
}));

vi.mock('@/libs/flagship/modelValidation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/libs/flagship/modelValidation')>()),
  scorecardProgramsForPaths: mockScorecardProgramsForPaths,
  fetchModelValidation: mockFetchModelValidation,
}));

vi.mock('@/api/flagshipReportStore', () => ({
  getFlagshipReportStore: () => ({
    findByApiReportId: mockFindByApiReportId,
    saveValidation: vi.fn(),
  }),
}));

vi.mock('@/libs/featureFlags', () => ({
  isFlagshipShellEnabled: mockIsFlagshipShellEnabled,
}));

vi.mock('@/components/flagship/EstimateValidation', () => ({
  default: vi.fn(() => <div data-testid="estimate-validation" />),
}));

const reformPolicy: Policy = {
  id: 'reform-policy',
  countryId: 'us',
  label: 'CTC to $2,500',
  parameters: [
    {
      name: 'gov.irs.credits.ctc.amount.base[0].amount',
      values: [{ startDate: '2026-01-01', endDate: '2100-12-31', value: 2500 }],
    },
  ],
};

function renderSection(policy: Policy | null = reformPolicy) {
  return render(
    <ReportValidationSection
      countryId="us"
      reformPolicy={policy}
      region="us"
      year="2026"
      apiReportId={1234}
      label="CTC report"
      peEstimate={-1e9}
    />
  );
}

describe('ReportValidationSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsFlagshipShellEnabled.mockReturnValue(false);
    mockCalibrationMatchesForPaths.mockResolvedValue(mockCalibrationMatches);
    mockScorecardProgramsForPaths.mockResolvedValue(['ctc_refund']);
    mockFetchModelValidation.mockResolvedValue(null);
    mockFindByApiReportId.mockResolvedValue(null);
  });

  test('given a reform policy then the calibration check runs for its parameter paths', async () => {
    renderSection();

    await waitFor(() => {
      expect(screen.getByText(/data calibration/i)).toBeInTheDocument();
    });
    expect(mockCalibrationMatchesForPaths).toHaveBeenCalledWith(
      ['gov.irs.credits.ctc.amount.base[0].amount'],
      'US'
    );
    expect(mockScorecardProgramsForPaths).toHaveBeenCalledWith([
      'gov.irs.credits.ctc.amount.base[0].amount',
    ]);
  });

  test('given the flagship shell is off then the external-estimates agent and the pin stay out', async () => {
    renderSection();

    await waitFor(() => {
      expect(screen.getByText(/data calibration/i)).toBeInTheDocument();
    });
    expect(screen.queryByTestId('estimate-validation')).not.toBeInTheDocument();
    expect(mockFindByApiReportId).not.toHaveBeenCalled();
  });

  test('given the flagship shell is on then the external-estimates check and the pin are wired', async () => {
    mockIsFlagshipShellEnabled.mockReturnValue(true);

    renderSection();

    await waitFor(() => {
      expect(screen.getByTestId('estimate-validation')).toBeInTheDocument();
    });
    expect(mockFindByApiReportId).toHaveBeenCalledWith('anonymous', '1234');
  });

  test('given no parameter reaches a traced variable then the gap is stated', async () => {
    mockCalibrationMatchesForPaths.mockResolvedValue({
      ...mockCalibrationMatches,
      reachedCount: 0,
      matches: [],
    });
    mockScorecardProgramsForPaths.mockResolvedValue([]);

    renderSection();

    await waitFor(() => {
      expect(screen.getByText(/no calibration or scorecard check to show/i)).toBeInTheDocument();
    });
  });

  test('given no reform policy then nothing renders', () => {
    const { container } = renderSection(null);

    expect(container).toBeEmptyDOMElement();
    expect(mockCalibrationMatchesForPaths).not.toHaveBeenCalled();
  });
});
