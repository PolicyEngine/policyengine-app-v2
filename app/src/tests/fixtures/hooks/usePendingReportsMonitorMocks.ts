// Test constants
export const TEST_COUNTRY_ID = 'us';
export const PENDING_REPORT_ID_1 = '123';
export const PENDING_REPORT_ID_2 = '456';
export const COMPLETE_REPORT_ID = '789';

// Mock report data
export const mockPendingReport1 = { id: PENDING_REPORT_ID_1, status: 'pending' };
export const mockPendingReport2 = { id: PENDING_REPORT_ID_2, status: 'pending' };
export const mockCompleteReport = { id: COMPLETE_REPORT_ID, status: 'complete' };

export const mockReportsWithPending = [
  mockPendingReport1,
  mockPendingReport2,
  mockCompleteReport,
];

export const mockReportsAllComplete = [mockCompleteReport];

export const mockReportsWithMissingIds = [
  mockPendingReport1,
  { id: undefined, status: 'pending' },
  { status: 'pending' },
];

// Mock calculation status responses
export const mockCalculationComplete = {
  status: 'ok',
  result: { /* mock result data */ },
};

export const mockCalculationError = {
  status: 'error',
  error: 'Calculation failed',
};

export const mockCalculationComputing = {
  status: 'computing',
  progress: 0.5,
};

// Mock query keys
export const mockReportKeys = {
  all: ['reports'],
};

export const mockReportAssociationKeys = {
  all: ['report-associations'],
};
