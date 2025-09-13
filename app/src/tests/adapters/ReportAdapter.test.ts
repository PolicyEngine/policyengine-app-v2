import { describe, expect, test } from 'vitest';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import {
  mockCompletedReportPayload,
  mockErrorReport,
  mockErrorReportPayload,
  mockPendingReport,
  mockReport,
  mockReportCreationPayload,
  mockReportMetadata,
  mockReportMetadataSingleSimulation,
  mockReportOutput,
} from '@/tests/fixtures/adapters/reportMocks';
import { Report } from '@/types/ingredients/Report';

describe('ReportAdapter', () => {
  describe('fromMetadata', () => {
    test('given metadata with two simulations then converts to Report correctly', () => {
      // Given
      const metadata = mockReportMetadata;

      // When
      const result = ReportAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual({
        reportId: mockReportMetadata.id,
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
        reportId: mockReportMetadataSingleSimulation.id,
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
        simulation_1_id: singleSimulationId,
        simulation_2_id: null,
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
        simulation_1_id: firstSimId,
        simulation_2_id: secondSimId,
      });
    });
  });

  describe('toCompletedReportPayload', () => {
    test('given report ID and output then creates completed payload correctly', () => {
      // When
      const result = ReportAdapter.toCompletedReportPayload(mockReport);

      // Then
      expect(result).toEqual(mockCompletedReportPayload);
    });

    test('given complex output object then serializes to JSON string correctly', () => {
      // Given
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
      const expectedStatus = 'complete' as const;
      const reportWithComplexOutput: Report = {
        ...mockReport,
        output: complexOutput,
      };

      // When
      const result = ReportAdapter.toCompletedReportPayload(reportWithComplexOutput);

      // Then
      expect(result).toEqual({
        id: 123,
        status: expectedStatus,
        output: JSON.stringify(complexOutput),
      });
    });

    test('given empty output object then creates payload with stringified empty object', () => {
      // Given
      const emptyOutput = {};
      const expectedStatus = 'complete' as const;
      const expectedOutputString = '{}';
      const reportWithEmptyOutput: Report = {
        ...mockReport,
        output: emptyOutput,
      };

      // When
      const result = ReportAdapter.toCompletedReportPayload(reportWithEmptyOutput);

      // Then
      expect(result).toEqual({
        id: 123,
        status: expectedStatus,
        output: expectedOutputString,
      });
    });
  });

  describe('toErrorReportPayload', () => {
    test('given report ID then creates error payload correctly', () => {
      // When
      const result = ReportAdapter.toErrorReportPayload(mockErrorReport);

      // Then
      expect(result).toEqual(mockErrorReportPayload);
    });

    test('given any report ID then always sets status to error and output to null', () => {
      // Given
      const expectedErrorStatus = 'error' as const;
      const expectedNullOutput = null;

      // When
      const result = ReportAdapter.toErrorReportPayload(mockErrorReport);

      // Then
      expect(result).toEqual({
        status: expectedErrorStatus,
        output: expectedNullOutput,
      });
    });
  });
});
