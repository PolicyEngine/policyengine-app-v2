import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useSimulationCanvas } from '@/pages/reportBuilder/hooks/useSimulationCanvas';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';

const mockUseCurrentCountry = vi.fn();
const mockUseUserPolicies = vi.fn();
const mockUseUserHouseholds = vi.fn();
const mockUseRegions = vi.fn();
const mockGeographyRecentIds = vi.fn();
const mockHouseholdRecentIds = vi.fn();
const mockRefetchPolicyAssociations = vi.fn();
const mockRefetchHouseholdAssociations = vi.fn();

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => mockUseCurrentCountry(),
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  useUserPolicies: (...args: unknown[]) => mockUseUserPolicies(...args),
}));

vi.mock('@/hooks/useUserHousehold', () => ({
  useUserHouseholds: (...args: unknown[]) => mockUseUserHouseholds(...args),
}));

vi.mock('@/hooks/useRegions', () => ({
  useRegions: (...args: unknown[]) => mockUseRegions(...args),
}));

vi.mock('@/api/usageTracking', () => ({
  geographyUsageStore: {
    getRecentIds: (...args: unknown[]) => mockGeographyRecentIds(...args),
    getLastUsed: () => null,
  },
  householdUsageStore: {
    getRecentIds: (...args: unknown[]) => mockHouseholdRecentIds(...args),
    getLastUsed: () => null,
  },
}));

describe('useSimulationCanvas', () => {
  const setReportState = vi.fn();
  const reportState: ReportBuilderState = {
    label: null,
    year: '2026',
    simulations: [initializeSimulationState()],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUseCurrentCountry.mockReturnValue('us');
    mockUseUserPolicies.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetchAssociations: mockRefetchPolicyAssociations,
    });
    mockUseUserHouseholds.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetchAssociations: mockRefetchHouseholdAssociations,
    });
    mockUseRegions.mockReturnValue({ data: [], isLoading: false });
    mockGeographyRecentIds.mockReturnValue([]);
    mockHouseholdRecentIds.mockReturnValue([]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given regions never resolve then it stops blocking the builder after 10 seconds', () => {
    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
      })
    );

    expect(result.current.isInitialLoading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(9_999);
    });
    expect(result.current.isInitialLoading).toBe(true);

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.isInitialLoading).toBe(false);
  });

  test('given policy associations fail then it exposes an error instead of permanent loading', async () => {
    const error = new Error('Policy associations failed');
    mockUseUserPolicies.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      refetchAssociations: mockRefetchPolicyAssociations,
    });

    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
      })
    );

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.catalogError).toBe(error);
    expect(result.current.catalogErrorMessage).toBe("We couldn't load your saved policies.");

    await act(async () => {
      await result.current.retryCatalogs();
    });
    expect(mockRefetchPolicyAssociations).toHaveBeenCalledOnce();
    expect(mockRefetchHouseholdAssociations).not.toHaveBeenCalled();
  });

  test('given household associations fail then it exposes a household catalog error', () => {
    const error = new Error('Household associations failed');
    mockUseUserHouseholds.mockReturnValue({
      data: undefined,
      isLoading: false,
      error,
      refetchAssociations: mockRefetchHouseholdAssociations,
    });

    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
      })
    );

    expect(result.current.isInitialLoading).toBe(false);
    expect(result.current.catalogError).toBe(error);
    expect(result.current.catalogErrorMessage).toBe("We couldn't load your saved households.");
  });

  test('given a selected policy then edit mode opens from policy state without association metadata', () => {
    const reportStateWithPolicy: ReportBuilderState = {
      ...reportState,
      simulations: [
        {
          ...initializeSimulationState(),
          policy: {
            id: 'policy-replacement',
            label: 'Editable policy',
            parameters: [
              {
                name: 'gov.test.parameter',
                values: [],
              },
            ],
          },
        },
      ],
    };

    mockUseUserPolicies.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
      refetchAssociations: mockRefetchPolicyAssociations,
    });

    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState: reportStateWithPolicy,
        setReportState,
      })
    );

    act(() => {
      result.current.handleEditPolicy(0);
    });

    expect(result.current.policyCreationState).toMatchObject({
      isOpen: true,
      simulationIndex: 0,
      initialPolicy: {
        id: 'policy-replacement',
      },
    });
  });

  test('given a saved policy detail error then exposes it as disabled with the shared error message', () => {
    mockUseUserPolicies.mockReturnValue({
      data: [
        {
          association: {
            id: 'broken-association',
            policyId: 'broken-policy',
            label: 'Broken policy',
            countryId: 'us',
          },
          policy: undefined,
          isLoading: false,
          isError: true,
          error: new Error('Policy request failed'),
        },
      ],
      isLoading: false,
      error: null,
      refetchAssociations: mockRefetchPolicyAssociations,
    });

    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
      })
    );

    expect(result.current.savedPolicies).toEqual([
      expect.objectContaining({
        id: 'broken-policy',
        label: 'Broken policy',
        isDisabled: true,
        errorMessage: 'Error loading this policy',
      }),
    ]);
  });

  test('given a recent household detail error then exposes it as a disabled recent', () => {
    mockHouseholdRecentIds.mockReturnValue(['broken-household']);
    mockUseUserHouseholds.mockReturnValue({
      data: [
        {
          association: {
            id: 'broken-association',
            householdId: 'broken-household',
            label: 'Broken household',
            countryId: 'us',
          },
          household: undefined,
          isLoading: false,
          isError: true,
          error: new Error('Household request failed'),
        },
      ],
      isLoading: false,
      error: null,
      refetchAssociations: mockRefetchHouseholdAssociations,
    });

    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
      })
    );

    expect(result.current.recentPopulations).toEqual([
      {
        id: 'broken-household',
        label: 'Broken household',
        type: 'household',
        isDisabled: true,
        errorMessage: 'Error loading this population',
      },
    ]);
  });

  test('given policy browsing is requested then the specialized policy modal opens', () => {
    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
      })
    );

    act(() => {
      result.current.handleBrowseMorePolicies(0);
    });

    expect(result.current.policyBrowseState).toEqual({
      isOpen: true,
      simulationIndex: 0,
    });
    expect(result.current.populationBrowseState.isOpen).toBe(false);
  });

  test('given population browsing is requested then the specialized population modal opens', () => {
    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
      })
    );

    act(() => {
      result.current.handleBrowseMorePopulations(0);
    });

    expect(result.current.populationBrowseState).toEqual({
      isOpen: true,
      simulationIndex: 0,
    });
    expect(result.current.policyBrowseState.isOpen).toBe(false);
  });
});
