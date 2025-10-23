import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useHouseholdCalculations } from '@/pages/report-output/useHouseholdCalculations';
import {
  mockViewModelShouldStart,
  mockViewModelShouldNotStart,
  mockViewModelNoConfig,
  mockOrchestrator,
  mockCalcConfig,
} from '@/tests/fixtures/pages/report-output/useHouseholdCalculationsMocks';

// Mock the household orchestrator hook
vi.mock('@/hooks/household', () => ({
  useHouseholdReportOrchestrator: () => mockOrchestrator,
}));

describe('useHouseholdCalculations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('given view model indicates should start then starts calculation', () => {
    // Given
    const viewModel = mockViewModelShouldStart();

    // When
    renderHook(() => useHouseholdCalculations(viewModel));

    // Then
    expect(mockOrchestrator.startReport).toHaveBeenCalledWith(mockCalcConfig);
  });

  it('given view model indicates should not start then skips calculation', () => {
    // Given
    const viewModel = mockViewModelShouldNotStart();

    // When
    renderHook(() => useHouseholdCalculations(viewModel));

    // Then
    expect(mockOrchestrator.startReport).not.toHaveBeenCalled();
  });

  it('given no config then skips calculation', () => {
    // Given
    const viewModel = mockViewModelNoConfig();

    // When
    renderHook(() => useHouseholdCalculations(viewModel));

    // Then
    expect(mockOrchestrator.startReport).not.toHaveBeenCalled();
  });

  it('given hook then returns orchestrator', () => {
    // Given
    const viewModel = mockViewModelShouldNotStart();

    // When
    const { result } = renderHook(() => useHouseholdCalculations(viewModel));

    // Then
    expect(result.current.orchestrator).toBe(mockOrchestrator);
  });

  it('given simulation states change then re-evaluates', () => {
    // Given
    const viewModel = mockViewModelShouldStart();

    // When
    const { rerender } = renderHook(() => useHouseholdCalculations(viewModel));

    // Change the state
    viewModel.simulationStates.isPending = true;
    rerender();

    // Then
    expect(mockOrchestrator.startReport).toHaveBeenCalledTimes(2);
  });
});
