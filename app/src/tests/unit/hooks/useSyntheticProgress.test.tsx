import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getProgressMessage, useSyntheticProgress } from '@/hooks/useSyntheticProgress';
import {
  createServerProgress,
  SYNTHETIC_PROGRESS_TEST_CONSTANTS,
} from '@/tests/fixtures/hooks/syntheticProgressFixtures';

describe('useSyntheticProgress', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('household calculations', () => {
    it('given inactive then returns zero progress', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(false, 'household'));

      // Then
      expect(result.current.progress).toBe(0);
      expect(result.current.message).toBe('');
    });

    it('given active then starts at zero progress', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'household'));

      // Then
      expect(result.current.progress).toBe(0);
    });

    it('given time passes then progress increases', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'household'));

      // When - advance 10 seconds (22.2% of 45 second duration)
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.TIME_10_SECONDS);
      });

      // Then
      expect(result.current.progress).toBeGreaterThan(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.PROGRESS_AT_10_SEC_MIN
      );
      expect(result.current.progress).toBeLessThan(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.PROGRESS_AT_10_SEC_MAX
      );
    });

    it('given full duration passes then caps at max progress', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'household'));

      // When - advance full 45 second duration
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.CONFIG.HOUSEHOLD_DURATION_MS);
      });

      // Then
      expect(result.current.progress).toBe(SYNTHETIC_PROGRESS_TEST_CONSTANTS.CONFIG.MAX_PROGRESS);
    });

    it('given progress under 10% then shows initializing message', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'household'));

      // When - advance 2 seconds (4.4% of duration)
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.TIME_2_SECONDS);
      });

      // Then
      expect(result.current.message).toBe(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.EXPECTED_MESSAGE_AT_2_SEC
      );
    });

    it('given progress 30-60% then shows running simulation message', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'household'));

      // When - advance 20 seconds (44.4% of duration)
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.TIME_20_SECONDS);
      });

      // Then
      expect(result.current.message).toBe(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.EXPECTED_MESSAGE_AT_20_SEC
      );
    });

    it('given becomes inactive then resets to zero', () => {
      // Given
      const { result, rerender } = renderHook(
        ({ active }) => useSyntheticProgress(active, 'household'),
        { initialProps: { active: true } }
      );

      // Advance time
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.HOUSEHOLD.TIME_FOR_PROGRESS_CHECK);
      });

      expect(result.current.progress).toBeGreaterThan(0);

      // When - becomes inactive
      act(() => {
        rerender({ active: false });
      });

      // Then
      expect(result.current.progress).toBe(0);
      expect(result.current.message).toBe('');
    });
  });

  describe('economy calculations', () => {
    it('given no server data then uses pure synthetic progress', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'societyWide'));

      // When - advance 2 minutes (16.67% of 12 minute duration)
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.TIME_2_MINUTES);
      });

      // Then - 2 minutes out of 12 = 16.67%
      expect(result.current.progress).toBeGreaterThan(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.PROGRESS_AT_2_MIN_MIN
      );
      expect(result.current.progress).toBeLessThan(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.PROGRESS_AT_2_MIN_MAX
      );
    });

    it('given queue position then shows queue message with linear progress', () => {
      // Given - queue position is now only used for messaging, not progress calculation
      const { result } = renderHook(() =>
        useSyntheticProgress(
          true,
          'societyWide',
          createServerProgress({
            queuePosition: SYNTHETIC_PROGRESS_TEST_CONSTANTS.QUEUE.POSITION_3,
          })
        )
      );

      // When - advance some time
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.TIME_1_SECOND);
      });

      // Then - should show queue message but use linear time-based progress
      expect(result.current.message).toBe(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.QUEUE.EXPECTED_MESSAGE_POSITION_3
      );
      // Progress should be very low (1 second / 6 minutes = 0.28%)
      expect(result.current.progress).toBeGreaterThan(0);
      expect(result.current.progress).toBeLessThan(1);
    });

    it('given estimated time remaining then uses pure synthetic progress', () => {
      // Given - server provides estimatedTimeRemaining but we ignore it for linear progress
      const { result } = renderHook(() =>
        useSyntheticProgress(
          true,
          'societyWide',
          createServerProgress({
            estimatedTimeRemaining:
              SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.SERVER_ESTIMATE_6_MIN_REMAINING,
          })
        )
      );

      // When - advance 1 minute
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.TIME_1_MINUTE);
      });

      // Then - should use pure synthetic (not blended): 1 min / 6 min = ~16.67%
      expect(result.current.progress).toBeGreaterThan(15);
      expect(result.current.progress).toBeLessThan(18);
    });

    it('given progress under 10% then shows initializing message', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'societyWide'));

      // When - advance 30 seconds (0.69% of duration)
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.TIME_30_SECONDS);
      });

      // Then
      expect(result.current.message).toBe(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.EXPECTED_MESSAGE_AT_30_SEC
      );
    });

    it('given progress 50-75% then shows reform scenario message', () => {
      // Given - advance to 50-75% range (3.5 minutes = 58.33%)
      const { result } = renderHook(() => useSyntheticProgress(true, 'societyWide'));

      // When - advance 3.5 minutes (58.33% of 6 minutes)
      act(() => {
        vi.advanceTimersByTime(3.5 * 60 * 1000);
      });

      // Then
      expect(result.current.message).toBe(
        SYNTHETIC_PROGRESS_TEST_CONSTANTS.ECONOMY.EXPECTED_MESSAGE_AT_75_PERCENT
      );
    });

    it('given full duration then caps at max progress', () => {
      // Given
      const { result } = renderHook(() => useSyntheticProgress(true, 'societyWide'));

      // When - advance 12 minutes
      act(() => {
        vi.advanceTimersByTime(SYNTHETIC_PROGRESS_TEST_CONSTANTS.CONFIG.SOCIETY_WIDE_DURATION_MS);
      });

      // Then
      expect(result.current.progress).toBe(SYNTHETIC_PROGRESS_TEST_CONSTANTS.CONFIG.MAX_PROGRESS);
    });
  });

  describe('getProgressMessage', () => {
    it('given queue position then returns queue message', () => {
      // When
      const message = getProgressMessage(
        50,
        'household',
        createServerProgress({ queuePosition: SYNTHETIC_PROGRESS_TEST_CONSTANTS.QUEUE.POSITION_5 })
      );

      // Then
      expect(message).toBe(SYNTHETIC_PROGRESS_TEST_CONSTANTS.QUEUE.EXPECTED_MESSAGE_POSITION_5);
    });

    it('given household at 5% then returns initializing message', () => {
      // When
      const message = getProgressMessage(5, 'household');

      // Then
      expect(message).toBe(SYNTHETIC_PROGRESS_TEST_CONSTANTS.MESSAGES.HOUSEHOLD.AT_5_PERCENT);
    });

    it('given household at 45% then returns simulation message', () => {
      // When
      const message = getProgressMessage(45, 'household');

      // Then
      expect(message).toBe(SYNTHETIC_PROGRESS_TEST_CONSTANTS.MESSAGES.HOUSEHOLD.AT_45_PERCENT);
    });

    it('given economy at 30% then returns baseline scenario message', () => {
      // When
      const message = getProgressMessage(30, 'societyWide');

      // Then
      expect(message).toBe(SYNTHETIC_PROGRESS_TEST_CONSTANTS.MESSAGES.ECONOMY.AT_30_PERCENT);
    });

    it('given economy at 85% then returns distributional impacts message', () => {
      // When
      const message = getProgressMessage(85, 'societyWide');

      // Then
      expect(message).toBe(SYNTHETIC_PROGRESS_TEST_CONSTANTS.MESSAGES.ECONOMY.AT_85_PERCENT);
    });
  });
});
