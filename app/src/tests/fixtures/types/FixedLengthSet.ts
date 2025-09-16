import { FixedLengthSet } from '@/types/FixedLengthSet';

// Empty sets of different sizes
export const EMPTY_SET_SIZE_2: FixedLengthSet<string> = [null, null];
export const EMPTY_SET_SIZE_3: FixedLengthSet<string> = [null, null, null];

// Sets with mixed content
export const MIXED_SET_WITH_NULLS: FixedLengthSet<string> = ['value1', null, 'value3'];
export const FULL_STRING_SET: FixedLengthSet<string> = ['value1', 'value2', 'value3'];

// Test values
export const TEST_VALUES = {
  FIRST: 'value1',
  SECOND: 'value2',
  THIRD: 'value3',
} as const;

// Index values
export const INDEX_VALUES = {
  FIRST: 0,
  SECOND: 1,
  THIRD: 2,
} as const;

// Helper to create sets for testing
export const createTestSet = <T>(size: number, fillValue?: T | null): FixedLengthSet<T> => {
  return Array(size).fill(fillValue ?? null);
};

// Common patterns for simulation testing
export const SIMULATION_IDS = {
  TEMP_1: 'temp-1',
  TEMP_2: 'temp-2',
  PERMANENT_1: 'sim-123',
  PERMANENT_2: 'sim-456',
} as const;

export const EMPTY_SIMULATION_SET: FixedLengthSet<string> = [null, null];
export const SINGLE_SIMULATION_SET: FixedLengthSet<string> = [SIMULATION_IDS.TEMP_1, null];
export const FULL_SIMULATION_SET: FixedLengthSet<string> = [SIMULATION_IDS.TEMP_1, SIMULATION_IDS.TEMP_2];