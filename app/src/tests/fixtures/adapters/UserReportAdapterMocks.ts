import type { UserReport } from '@/types/ingredients/UserReport';

export const TEST_USER_IDS = {
  USER_123: 'user-123',
  USER_456: 'user-456',
} as const;

export const TEST_REPORT_IDS = {
  REPORT_456: 'report-456',
  REPORT_789: 'report-789',
} as const;

export const TEST_USER_REPORT_IDS = {
  SUR_ABC123: 'sur-abc123',
  SUR_XYZ789: 'sur-xyz789',
} as const;

export const TEST_LABELS = {
  TEST_REPORT: 'My Test Report',
  ANOTHER_REPORT: 'Another Report',
} as const;

export const mockUserReportInput = (overrides?: Partial<Omit<UserReport, 'id' | 'createdAt'>>): Omit<UserReport, 'id' | 'createdAt'> => ({
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_456,
  label: TEST_LABELS.TEST_REPORT,
  updatedAt: '2025-01-15T12:00:00Z',
  isCreated: true,
  ...overrides,
});

export const mockUserReport = (overrides?: Partial<UserReport>): UserReport => ({
  ...mockUserReportInput(),
  id: TEST_USER_REPORT_IDS.SUR_ABC123,
  createdAt: '2025-01-01T00:00:00Z',
  ...overrides,
});

export const mockApiResponse = (overrides?: any) => ({
  id: TEST_USER_REPORT_IDS.SUR_ABC123,
  userId: TEST_USER_IDS.USER_123,
  reportId: TEST_REPORT_IDS.REPORT_456,
  label: TEST_LABELS.TEST_REPORT,
  createdAt: '2025-01-01T00:00:00Z',
  updatedAt: '2025-01-15T12:00:00Z',
  ...overrides,
});
