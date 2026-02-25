import { describe, expect, test } from 'vitest';
import { ReportAdapter } from '@/adapters/ReportAdapter';
import {
  mockReportMetadata,
  mockReportMetadataSingleSimulation,
  mockReportOutput,
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
});
