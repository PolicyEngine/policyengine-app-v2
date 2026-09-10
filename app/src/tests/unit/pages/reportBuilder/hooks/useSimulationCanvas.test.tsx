import { act, renderHook } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { Household } from '@/models/Household';
import { useSimulationCanvas } from '@/pages/reportBuilder/hooks/useSimulationCanvas';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import { ownershipReportState } from '@/tests/fixtures/spm/reportBuilderOwnershipMocks';
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

  test.each([
    'different ID',
    'different settings',
    'different inputs',
    'different country',
    'pending draft',
  ] as const)(
    'given an independent reform with %s then editing baseline preserves the reform household and policy',
    (difference) => {
      const independent = ownershipReportState();
      const baseline = independent.simulations[0].population;
      if (difference !== 'different ID') {
        const originalReform = independent.simulations[1].population.household!;
        independent.simulations[1].population = {
          ...baseline,
          household:
            difference === 'different settings'
              ? baseline.household!.withSPM(originalReform.spm)
              : difference === 'different inputs'
                ? baseline.household!.setPersonVariableAtYear(
                    'you',
                    'employment_income',
                    '2026',
                    12345
                  )
                : difference === 'different country'
                  ? Household.fromAppInput({
                      ...baseline.household!.toJSON(),
                      countryId: 'uk',
                      spm: undefined,
                    })
                  : baseline.household,
          ...(difference === 'pending draft' ? { householdNeedsCreation: true } : {}),
        };
      }
      const before = JSON.stringify(independent);
      const { result } = renderHook(() =>
        useSimulationCanvas({ reportState: independent, setReportState })
      );
      const replacement = {
        ...baseline,
        household: baseline.household!.withId('new-baseline'),
      };

      act(() => result.current.handleHouseholdSaved(replacement));
      const updated = setReportState.mock.lastCall?.[0](independent) as ReportBuilderState;

      expect(updated.simulations[0].population.household!.id).toBe('new-baseline');
      expect(updated.simulations[1]).toBe(independent.simulations[1]);
      expect(JSON.stringify(independent)).toBe(before);
    }
  );

  test('given equivalent baseline and reform households then editing baseline retains intentional inheritance', () => {
    const shared = ownershipReportState();
    const baseline = shared.simulations[0].population;
    shared.simulations[1].population = {
      ...baseline,
      household: Household.fromAppInput(baseline.household!.toJSON()),
    };
    const { result } = renderHook(() =>
      useSimulationCanvas({ reportState: shared, setReportState })
    );
    const replacement = { ...baseline, household: baseline.household!.withId('new-baseline') };

    act(() => result.current.handleHouseholdSaved(replacement));
    const updated = setReportState.mock.lastCall?.[0](shared) as ReportBuilderState;

    expect(updated.simulations[0].population.household!.id).toBe('new-baseline');
    expect(updated.simulations[1].population.household!.id).toBe('new-baseline');
    expect(updated.simulations[1].policy).toEqual(shared.simulations[1].policy);
    expect(shared.simulations[0].population.household!.id).toBe('ownership-baseline');
  });

  test.each([false, true])(
    'given household creation is pending %s then opens the matching editor without looking up a synthetic draft association',
    (householdNeedsCreation) => {
      const state = ownershipReportState();
      state.simulations[0].population.householdNeedsCreation = householdNeedsCreation;
      const { result } = renderHook(() =>
        useSimulationCanvas({ reportState: state, setReportState })
      );

      act(() => result.current.handleEditPopulation(0));

      expect(result.current.householdEditorState).toMatchObject({
        isOpen: true,
        initialEditorMode: householdNeedsCreation ? 'create' : 'edit',
        initialPopulation: state.simulations[0].population,
      });
    }
  );

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
