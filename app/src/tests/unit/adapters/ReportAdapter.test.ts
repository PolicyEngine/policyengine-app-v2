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
        id: String(mockReportMetadata.id),
        countryId: mockReportMetadata.country_id,
        year: mockReportMetadata.year,
        apiVersion: mockReportMetadata.api_version,
        simulationIds: ['456', '789'],
        status: mockReportMetadata.status,
        output: mockReportOutput,
      });
    });

    test('given metadata with single simulation then converts to Report with one simulation ID', () => {
      // Given
      const metadata = mockReportMetadataSingleSimulation;

      // When
      const result = ReportAdapter.fromMetadata(metadata);

      // Then
      expect(result).toEqual({
        id: String(mockReportMetadataSingleSimulation.id),
        countryId: mockReportMetadataSingleSimulation.country_id,
        year: mockReportMetadataSingleSimulation.year,
        apiVersion: mockReportMetadataSingleSimulation.api_version,
        simulationIds: ['999'],
        status: mockReportMetadataSingleSimulation.status,
        output: null,
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
      const singleSimulationId = '111';
      const report = {
        ...mockPendingReport,
        simulationIds: [singleSimulationId],
      };

      // When
      const result = ReportAdapter.toCreationPayload(report);

      // Then
      expect(result).toEqual({
        simulation_1_id: 111,
        simulation_2_id: null,
        year: report.year,
      });
    });

    test('given Report with error status then converts to creation payload with error status', () => {
      // Given
      const report = mockErrorReport;

      // When
      const result = ReportAdapter.toCreationPayload(report);

      // Then
      expect(result).toEqual({
        simulation_1_id: 222,
        simulation_2_id: 333,
        year: report.year,
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
        output: complexOutput as any, // Testing conversion logic, not type structure
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
        output: emptyOutput as any, // Testing conversion logic, not type structure
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
        id: 2,
        status: expectedErrorStatus,
        output: expectedNullOutput,
      });
    });
  });
});
