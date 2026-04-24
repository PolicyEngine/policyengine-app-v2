import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { useSimulationCanvas } from '@/pages/reportBuilder/hooks/useSimulationCanvas';
import type { IngredientPickerState, ReportBuilderState } from '@/pages/reportBuilder/types';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';

const mockUseCurrentCountry = vi.fn();
const mockUseUserPolicies = vi.fn();
const mockUseUserHouseholds = vi.fn();
const mockUseRegions = vi.fn();

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
    getRecentIds: () => [],
    getLastUsed: () => null,
  },
  householdUsageStore: {
    getRecentIds: () => [],
    getLastUsed: () => null,
  },
}));

describe('useSimulationCanvas', () => {
  const setReportState = vi.fn();
  const setPickerState = vi.fn();
  const reportState: ReportBuilderState = {
    label: null,
    year: '2026',
    simulations: [initializeSimulationState()],
  };
  const pickerState: IngredientPickerState = {
    isOpen: false,
    simulationIndex: 0,
    ingredientType: 'policy',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    mockUseCurrentCountry.mockReturnValue('us');
    mockUseUserPolicies.mockReturnValue({ data: [], isLoading: false });
    mockUseUserHouseholds.mockReturnValue({ data: [], isLoading: false });
    mockUseRegions.mockReturnValue({ data: [], isLoading: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('given regions never resolve then it stops blocking the builder after 10 seconds', () => {
    const { result } = renderHook(() =>
      useSimulationCanvas({
        reportState,
        setReportState,
        pickerState,
        setPickerState,
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
});
