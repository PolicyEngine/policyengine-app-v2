import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useFinalizeHouseholdReportOnLoad } from '@/hooks/household/useFinalizeHouseholdReportOnLoad';
import { ResultPersister } from '@/libs/calculations/ResultPersister';
import {
  createFinalizationTestWrapper,
  DURABLE_HOUSEHOLD_SIMULATIONS,
  PENDING_HOUSEHOLD_REPORT,
} from '@/tests/fixtures/hooks/useFinalizeHouseholdReportOnLoadFixtures';

vi.mock('@/libs/calculations/ResultPersister');

describe('useFinalizeHouseholdReportOnLoad', () => {
  const finalizeHouseholdReport = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    finalizeHouseholdReport.mockResolvedValue(true);
    vi.mocked(ResultPersister).mockImplementation(
      () => ({ finalizeHouseholdReport }) as unknown as ResultPersister
    );
  });

  test('test__given_pending_report_with_durable_outputs__then_report_is_finalized_on_load', async () => {
    // Given
    const { wrapper } = createFinalizationTestWrapper();

    // When
    renderHook(
      () =>
        useFinalizeHouseholdReportOnLoad({
          report: PENDING_HOUSEHOLD_REPORT,
          simulations: DURABLE_HOUSEHOLD_SIMULATIONS,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(finalizeHouseholdReport).toHaveBeenCalledOnce();
    });
    expect(finalizeHouseholdReport).toHaveBeenCalledWith(
      PENDING_HOUSEHOLD_REPORT,
      DURABLE_HOUSEHOLD_SIMULATIONS
    );
  });

  test('test__given_completed_report__then_no_finalization_is_started', () => {
    // Given
    const { wrapper } = createFinalizationTestWrapper();

    // When
    renderHook(
      () =>
        useFinalizeHouseholdReportOnLoad({
          report: { ...PENDING_HOUSEHOLD_REPORT, status: 'complete' },
          simulations: DURABLE_HOUSEHOLD_SIMULATIONS,
        }),
      { wrapper }
    );

    // Then
    expect(finalizeHouseholdReport).not.toHaveBeenCalled();
  });

  test('test__given_finalization_retries_are_exhausted__then_user_can_retry', async () => {
    // Given
    const { wrapper } = createFinalizationTestWrapper();
    finalizeHouseholdReport.mockRejectedValueOnce(new Error('Database unavailable'));
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // When
    const { result } = renderHook(
      () =>
        useFinalizeHouseholdReportOnLoad({
          report: PENDING_HOUSEHOLD_REPORT,
          simulations: DURABLE_HOUSEHOLD_SIMULATIONS,
        }),
      { wrapper }
    );

    // Then
    await waitFor(() => {
      expect(result.current.finalizationError?.message).toBe('Database unavailable');
    });

    // When
    finalizeHouseholdReport.mockResolvedValueOnce(true);
    act(() => result.current.retryFinalization());

    // Then
    await waitFor(() => {
      expect(result.current.finalizationError).toBeNull();
    });
    expect(finalizeHouseholdReport).toHaveBeenCalledTimes(2);
    consoleError.mockRestore();
  });
});
