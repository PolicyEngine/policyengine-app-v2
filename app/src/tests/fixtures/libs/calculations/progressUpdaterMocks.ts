import { vi } from 'vitest';
import { HouseholdProgressUpdater } from '@/libs/calculations/progressUpdater';

// Test constants
export const TEST_PROGRESS_REPORT_ID = 'progress-report-123';
export const TEST_PROGRESS_INTERVAL = 500; // milliseconds

// Mock progress updater
export const createMockProgressUpdater = (): jest.Mocked<HouseholdProgressUpdater> => ({
  startProgressUpdates: vi.fn(),
  stopProgressUpdates: vi.fn(),
  stopAllUpdates: vi.fn(),
});