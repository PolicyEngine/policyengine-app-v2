import { Report, ReportOutput } from '@/types/ingredients/Report';
import { ReportMetadata } from '@/types/metadata/reportMetadata';
import { ReportCreationPayload } from '@/types/payloads/ReportCreationPayload';
import { ReportSetOutputPayload } from '@/types/payloads/ReportSetOutputPayload';

export const mockReportOutput: ReportOutput = {
  total_impact: 1500000,
  households_affected: 25000,
  average_benefit: 60,
  distribution: {
    income_decile_1: 100,
    income_decile_2: 90,
    income_decile_3: 80,
  },
};

export const mockReport: Report = {
  reportId: 'report-123',
  countryId: 'us',
  apiVersion: 'v1',
  simulationIds: ['sim-456', 'sim-789'],
  status: 'complete',
  output: mockReportOutput,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:35:00Z',
};

export const mockPendingReport: Report = {
  reportId: 'report-pending-001',
  countryId: 'us',
  apiVersion: 'v1',
  simulationIds: ['sim-111'],
  status: 'pending',
  output: null,
  createdAt: '2024-01-15T11:00:00Z',
  updatedAt: '2024-01-15T11:00:00Z',
};

export const mockErrorReport: Report = {
  reportId: 'report-error-002',
  countryId: 'us',
  apiVersion: 'v1',
  simulationIds: ['sim-222', 'sim-333'],
  status: 'error',
  output: null,
  createdAt: '2024-01-15T11:30:00Z',
  updatedAt: '2024-01-15T11:31:00Z',
};

export const mockReportMetadata: ReportMetadata = {
  id: 123,
  country_id: 'us',
  api_version: 'v1',
  simulation_1_id: 'sim-456',
  simulation_2_id: 'sim-789',
  status: 'complete',
  output: JSON.stringify(mockReportOutput),
  created_at: '2024-01-15T10:30:00Z',
  updated_at: '2024-01-15T10:35:00Z',
};

export const mockReportMetadataSingleSimulation: ReportMetadata = {
  id: 1,
  country_id: 'us',
  api_version: 'v1',
  simulation_1_id: 'sim-999',
  simulation_2_id: null,
  status: 'pending',
  output: null,
  created_at: '2024-01-15T12:00:00Z',
  updated_at: '2024-01-15T12:00:00Z',
};

export const mockReportCreationPayload: ReportCreationPayload = {
  simulation_1_id: 'sim-456',
  simulation_2_id: 'sim-789',
};

export const mockCompletedReportPayload: ReportSetOutputPayload = {
  id: 123,
  status: 'complete',
  output: JSON.stringify(mockReportOutput),
};

export const mockErrorReportPayload: ReportSetOutputPayload = {
  id: 2,
  status: 'error',
  output: null,
};
