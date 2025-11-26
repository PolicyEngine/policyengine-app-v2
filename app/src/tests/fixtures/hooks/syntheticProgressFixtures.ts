import { SYNTHETIC_PROGRESS_CONFIG } from '@/hooks/useSyntheticProgress';

/**
 * Test constants for synthetic progress tests
 * Note: These are calculated based on the shared constants in calculationDurations.ts
 * - HOUSEHOLD_DURATION_MS: 60 seconds (1 minute)
 * - SOCIETY_WIDE_DURATION_MS: 360 seconds (6 minutes)
 */
export const SYNTHETIC_PROGRESS_TEST_CONSTANTS = {
  // Household timing tests
  HOUSEHOLD: {
    // 10 seconds is 16.67% of 60 second duration
    TIME_10_SECONDS: 10000,
    PROGRESS_AT_10_SEC_MIN: 15,
    PROGRESS_AT_10_SEC_MAX: 18,

    // 2 seconds is 3.33% of 60 second duration
    TIME_2_SECONDS: 2000,
    EXPECTED_MESSAGE_AT_2_SEC: 'Initializing calculation...',

    // 20 seconds is 33.33% of 60 second duration
    TIME_20_SECONDS: 20000,
    EXPECTED_MESSAGE_AT_20_SEC: 'Running policy simulation...',

    // For testing state transitions
    TIME_FOR_PROGRESS_CHECK: 10000,
  },

  // Economy timing tests
  ECONOMY: {
    // 2 minutes is 33.33% of 6 minute duration (120000ms / 360000ms)
    TIME_2_MINUTES: 120000,
    PROGRESS_AT_2_MIN_MIN: 32,
    PROGRESS_AT_2_MIN_MAX: 34,

    // 30 seconds is 8.33% of 6 minute duration
    TIME_30_SECONDS: 30000,
    EXPECTED_MESSAGE_AT_30_SEC: 'Initializing society-wide calculation...',

    // 1 minute elapsed with 3 minutes remaining server estimate
    TIME_1_MINUTE: 60000,
    SERVER_ESTIMATE_6_MIN_REMAINING: 180000, // 3 minutes remaining = 50% complete
    // Server: 50% (3 min remaining), Synthetic: ~16.67% (1 min elapsed)
    // Blend: (50 * 0.7) + (16.67 * 0.3) = 40%
    BLENDED_PROGRESS_MIN: 39,
    BLENDED_PROGRESS_MAX: 41,

    // Server says 1.5 minutes remaining = 75% complete
    SERVER_ESTIMATE_3_MIN_REMAINING: 90000,
    EXPECTED_MESSAGE_AT_75_PERCENT: 'Simulating reform scenario...',

    // For testing state transitions
    TIME_1_SECOND: 1000,
  },

  // Queue position tests
  QUEUE: {
    POSITION_3: 3,
    EXPECTED_MESSAGE_POSITION_3: 'In queue (position 3)...',
    EXPECTED_MESSAGE_POSITION_5: 'In queue (position 5)...',
    POSITION_5: 5,
    MIN_PROGRESS_IN_QUEUE: 0,
    MAX_PROGRESS_IN_QUEUE: 20,
  },

  // Message tests for specific progress percentages
  MESSAGES: {
    HOUSEHOLD: {
      AT_5_PERCENT: 'Initializing calculation...',
      AT_45_PERCENT: 'Running policy simulation...',
    },
    ECONOMY: {
      AT_30_PERCENT: 'Simulating baseline scenario...',
      AT_85_PERCENT: 'Computing distributional impacts...',
    },
  },

  // Reference to actual config values
  CONFIG: SYNTHETIC_PROGRESS_CONFIG,
} as const;

/**
 * Helper to create server progress data for testing
 */
export const createServerProgress = (overrides?: {
  queuePosition?: number;
  estimatedTimeRemaining?: number;
}) => ({
  queuePosition: overrides?.queuePosition,
  estimatedTimeRemaining: overrides?.estimatedTimeRemaining,
});
