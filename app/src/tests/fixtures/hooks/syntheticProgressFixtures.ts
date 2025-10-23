import { SYNTHETIC_PROGRESS_CONFIG } from '@/hooks/useSyntheticProgress';

/**
 * Test constants for synthetic progress tests
 */
export const SYNTHETIC_PROGRESS_TEST_CONSTANTS = {
  // Household timing tests
  HOUSEHOLD: {
    // 10 seconds is 22.2% of 45 second duration
    TIME_10_SECONDS: 10000,
    PROGRESS_AT_10_SEC_MIN: 20,
    PROGRESS_AT_10_SEC_MAX: 25,

    // 2 seconds is 4.4% of 45 second duration
    TIME_2_SECONDS: 2000,
    EXPECTED_MESSAGE_AT_2_SEC: 'Initializing calculation...',

    // 20 seconds is 44.4% of 45 second duration
    TIME_20_SECONDS: 20000,
    EXPECTED_MESSAGE_AT_20_SEC: 'Running policy simulation...',

    // For testing state transitions
    TIME_FOR_PROGRESS_CHECK: 10000,
  },

  // Economy timing tests
  ECONOMY: {
    // 2 minutes is 16.67% of 12 minute duration (120000ms / 720000ms)
    TIME_2_MINUTES: 120000,
    PROGRESS_AT_2_MIN_MIN: 16,
    PROGRESS_AT_2_MIN_MAX: 17,

    // 30 seconds is 0.69% of 12 minute duration
    TIME_30_SECONDS: 30000,
    EXPECTED_MESSAGE_AT_30_SEC: 'Initializing society-wide calculation...',

    // 1 minute elapsed with 6 minutes remaining server estimate
    TIME_1_MINUTE: 60000,
    SERVER_ESTIMATE_6_MIN_REMAINING: 360000, // 6 minutes = 50% complete
    // Server: 50% (6 min remaining), Synthetic: ~8.33% (1 min elapsed)
    // Blend: (50 * 0.7) + (8.33 * 0.3) = 37.5%
    BLENDED_PROGRESS_MIN: 37,
    BLENDED_PROGRESS_MAX: 38,

    // Server says 3 minutes remaining = 75% complete
    SERVER_ESTIMATE_3_MIN_REMAINING: 180000,
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
