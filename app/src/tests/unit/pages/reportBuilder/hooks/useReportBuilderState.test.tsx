import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useSharedReportData } from '@/hooks/useSharedReportData';
import { useUserReportById } from '@/hooks/useUserReports';
import { useReportBuilderState } from '@/pages/reportBuilder/hooks/useReportBuilderState';

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: vi.fn((selector: (state: any) => unknown) =>
      selector({
        metadata: {
          currentLawId: 1,
        },
      })
    ),
  };
});

vi.mock('@/hooks/useUserReports', () => ({
  useUserReportById: vi.fn(),
}));

vi.mock('@/hooks/useSharedReportData', () => ({
  useSharedReportData: vi.fn(),
}));

const MOCK_ENHANCED_REPORT = {
  userReport: {
    id: 'sur-owned-123',
    reportId: 'report-123',
    countryId: 'us',
    label: 'Warm cached report',
  },
  report: {
    id: 'report-123',
    countryId: 'us',
    year: '2026',
    simulationIds: ['sim-1'],
  },
  simulations: [
    {
      id: 'sim-1',
      countryId: 'us',
      apiVersion: '1.0.0',
      status: 'complete',
      output: null,
      policyId: 'policy-1',
      populationType: 'geography',
      populationId: 'us',
    },
  ],
  policies: [
    {
      id: 'policy-1',
      label: 'Baseline policy',
      parameters: [],
    },
  ],
  households: [],
  geographies: [
    {
      id: 'us',
      geographyId: 'us',
      countryId: 'us',
      name: 'United States',
    },
  ],
  userSimulations: [
    {
      simulationId: 'sim-1',
      label: 'Baseline',
    },
  ],
  userPolicies: [
    {
      policyId: 'policy-1',
      label: 'Baseline policy',
    },
  ],
  userHouseholds: [],
  userGeographies: [],
  isLoading: true,
  error: null,
};

describe('useReportBuilderState', () => {
  beforeEach(() => {
    vi.mocked(useUserReportById).mockReset();
    vi.mocked(useSharedReportData).mockReset();
    vi.mocked(useSharedReportData).mockReturnValue({
      userReport: undefined,
      report: undefined,
      simulations: [],
      policies: [],
      households: [],
      geographies: [],
      userSimulations: [],
      userPolicies: [],
      userHouseholds: [],
      userGeographies: [],
      isLoading: false,
      error: null,
    });
  });

  test('given cached report data while query is still loading then returns hydrated state immediately', () => {
    // Given
    vi.mocked(useUserReportById).mockReturnValue(MOCK_ENHANCED_REPORT as any);

    // When
    const { result } = renderHook(() => useReportBuilderState('sur-owned-123'));

    // Then
    expect(result.current.isLoading).toBe(true);
    expect(result.current.reportState).toMatchObject({
      id: 'sur-owned-123',
      label: 'Warm cached report',
      year: '2026',
    });
    expect(result.current.reportState?.simulations[0]).toMatchObject({
      id: 'sim-1',
      label: 'Baseline',
    });
  });
});
