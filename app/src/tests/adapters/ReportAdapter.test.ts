import { describe, test, expect } from 'vitest';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import {
  mockReport,
  mockPendingReport,
  mockErrorReport,
  mockReportOutput,
  mockReportMetadata,
  mockReportMetadataSingleSimulation,
  mockReportCreationPayload,
  mockCompletedReportPayload,
  mockErrorReportPayload,
} from '@/tests/fixtures/adapters/reportMocks';

describe('ReportAdapter', () => {
  describe('fromMetadata', () => {
    test('given metadata with two simulations then converts to Report correctly', () => {
      // Given
      const metadata = mockReportMetadata;

      // When
      const result = ReportAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual({
        reportId: mockReportMetadata.report_id,
        simulationIds: [mockReportMetadata.simulation_1_id, mockReportMetadata.simulation_2_id],
        status: mockReportMetadata.status,
        output: mockReportOutput,
        createdAt: mockReportMetadata.created_at,
        updatedAt: mockReportMetadata.updated_at,
      });
    });

    test('given metadata with single simulation then converts to Report with one simulation ID', () => {
      // Given
      const metadata = mockReportMetadataSingleSimulation;

      // When
      const result = ReportAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual({
        reportId: mockReportMetadataSingleSimulation.report_id,
        simulationIds: [mockReportMetadataSingleSimulation.simulation_1_id],
        status: mockReportMetadataSingleSimulation.status,
        output: mockReportMetadataSingleSimulation.output,
        createdAt: mockReportMetadataSingleSimulation.created_at,
        updatedAt: mockReportMetadataSingleSimulation.updated_at,
      });
    });

    test('given metadata with null output then converts to Report with null output', () => {
      // Given
      const pendingStatus = 'pending' as const;
      const nullOutput = null;
      const metadata = {
        ...mockReportMetadata,
        output: nullOutput,
        status: pendingStatus,
      };

      // When
      const result = ReportAdapter.fromMetadata(metadata);

      // Then
      expect(result.output).toBe(nullOutput);
      expect(result.status).toBe(pendingStatus);
    });

    test('given metadata with error status then converts to Report with error status', () => {
      // Given
      const errorStatus = 'error' as const;
      const nullOutput = null;
      const metadata = {
        ...mockReportMetadata,
        status: errorStatus,
        output: nullOutput,
      };

      // When
      const result = ReportAdapter.fromMetadata(metadata);

      // Then
      expect(result.status).toBe(errorStatus);
      expect(result.output).toBe(nullOutput);
    });
  });

  describe('toCreationPayload', () => {
    test('given Report with two simulations then converts to creation payload correctly', () => {
      // Given
      const report = mockReport;

      // When
      const result = ReportAdapter.toCreationPayload(report);

      // Then
      expect(result).toEqual(mockReportCreationPayload);
    });

    test('given Report with single simulation then converts to creation payload with null second simulation', () => {
      // Given
      const singleSimulationId = 'sim-111';
      const report = {
        ...mockPendingReport,
        simulationIds: [singleSimulationId],
      };

      // When
      const result = ReportAdapter.toCreationPayload(report);

      // Then
      expect(result).toEqual({
        report_id: mockPendingReport.reportId,
        simulation_1_id: singleSimulationId,
        simulation_2_id: null,
        status: mockPendingReport.status,
        created_at: mockPendingReport.createdAt,
        updated_at: mockPendingReport.updatedAt,
      });
    });

    test('given Report with error status then converts to creation payload with error status', () => {
      // Given
      const report = mockErrorReport;

      // When
      const result = ReportAdapter.toCreationPayload(report);

      // Then
      const [firstSimId, secondSimId] = mockErrorReport.simulationIds;
      expect(result).toEqual({
        report_id: mockErrorReport.reportId,
        simulation_1_id: firstSimId,
        simulation_2_id: secondSimId,
        status: mockErrorReport.status,
        created_at: mockErrorReport.createdAt,
        updated_at: mockErrorReport.updatedAt,
      });
    });
  });

  describe('toCompletedReportPayload', () => {
    test('given report ID and output then creates completed payload correctly', () => {
      // Given
      const reportId = 'report-123';
      const output = mockReportOutput;
      const updatedAt = '2024-01-15T10:35:00Z';

      // When
      const result = ReportAdapter.toCompletedReportPayload(reportId, output, updatedAt);

      // Then
      expect(result).toEqual(mockCompletedReportPayload);
    });

    test('given complex output object then serializes to JSON string correctly', () => {
      // Given
      const reportId = 'report-complex';
      const complexOutput = {
        nested: {
          deeply: {
            value: 123,
            array: [1, 2, 3],
          },
        },
        boolean: true,
        null_value: null,
      };
      const updatedAt = '2024-01-15T15:00:00Z';
      const expectedStatus = 'complete' as const;

      // When
      const result = ReportAdapter.toCompletedReportPayload(reportId, complexOutput, updatedAt);

      // Then
      expect(result).toEqual({
        report_id: reportId,
        status: expectedStatus,
        output: JSON.stringify(complexOutput),
        updated_at: updatedAt,
      });
    });

    test('given empty output object then creates payload with stringified empty object', () => {
      // Given
      const reportId = 'report-empty';
      const emptyOutput = {};
      const updatedAt = '2024-01-15T16:00:00Z';
      const expectedStatus = 'complete' as const;
      const expectedOutputString = '{}';

      // When
      const result = ReportAdapter.toCompletedReportPayload(reportId, emptyOutput, updatedAt);

      // Then
      expect(result).toEqual({
        report_id: reportId,
        status: expectedStatus,
        output: expectedOutputString,
        updated_at: updatedAt,
      });
    });
  });

  describe('toErrorReportPayload', () => {
    test('given report ID then creates error payload correctly', () => {
      // Given
      const reportId = mockErrorReportPayload.report_id;
      const updatedAt = mockErrorReportPayload.updated_at;

      // When
      const result = ReportAdapter.toErrorReportPayload(reportId, updatedAt);

      // Then
      expect(result).toEqual(mockErrorReportPayload);
    });

    test('given any report ID then always sets status to error and output to null', () => {
      // Given
      const reportId = 'report-test-error';
      const updatedAt = '2024-01-15T20:00:00Z';
      const expectedErrorStatus = 'error' as const;
      const expectedNullOutput = null;

      // When
      const result = ReportAdapter.toErrorReportPayload(reportId, updatedAt);

      // Then
      expect(result).toEqual({
        report_id: reportId,
        status: expectedErrorStatus,
        output: expectedNullOutput,
        updated_at: updatedAt,
      });
    });
  });
});