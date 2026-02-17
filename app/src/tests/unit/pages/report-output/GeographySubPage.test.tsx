import { render, screen, within } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import GeographySubPage from '@/pages/report-output/GeographySubPage';
import {
  mockGeographyCalifornia,
  mockGeographyNewYork,
} from '@/tests/fixtures/pages/report-output/PopulationSubPage';
import { MetadataRegionEntry } from '@/types/metadata';

// Mock regions data for V2 API labels
const mockRegions: MetadataRegionEntry[] = [
  { name: 'state/ca', label: 'California', type: 'state' },
  { name: 'state/ny', label: 'New York', type: 'state' },
  { name: 'ca', label: 'California', type: 'state' }, // Legacy format
  { name: 'ny', label: 'New York', type: 'state' }, // Legacy format
];

// Mock useRegions hook
vi.mock('@/hooks/useRegions', () => ({
  useRegions: vi.fn(() => ({
    regions: mockRegions,
    isLoading: false,
    error: null,
    rawRegions: [],
  })),
}));

describe('GeographySubPage - Design 4 Table Format', () => {
  describe('Empty and error states', () => {
    test('given no geographies then displays no data message', () => {
      render(<GeographySubPage baselineGeography={undefined} reformGeography={undefined} />);
      expect(screen.getByText(/no geography data available/i)).toBeInTheDocument();
    });
  });

  describe('Table structure', () => {
    test('given geographies then displays table with proper structure', () => {
      render(
        <GeographySubPage
          baselineGeography={mockGeographyCalifornia}
          reformGeography={mockGeographyNewYork}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have property column header
      expect(screen.getByRole('columnheader', { name: /property/i })).toBeInTheDocument();
    });

    test('given different geographies then displays two columns', () => {
      render(
        <GeographySubPage
          baselineGeography={mockGeographyCalifornia}
          reformGeography={mockGeographyNewYork}
        />
      );

      // Should have baseline and reform headers
      const baselineHeaders = screen.getAllByRole('columnheader', { name: /baseline/i });
      expect(baselineHeaders.length).toBeGreaterThanOrEqual(1);

      const reformHeaders = screen.getAllByRole('columnheader', { name: /reform/i });
      expect(reformHeaders.length).toBeGreaterThanOrEqual(1);
    });

    test('given same geographies then displays single merged column', () => {
      render(
        <GeographySubPage
          baselineGeography={mockGeographyCalifornia}
          reformGeography={mockGeographyCalifornia}
        />
      );

      // Should have merged column header
      const mergedHeaders = screen.getAllByRole('columnheader', {
        name: /baseline \/ reform/i,
      });
      expect(mergedHeaders.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Geography properties', () => {
    test('given geography then displays all properties with V2 API labels', () => {
      render(
        <GeographySubPage
          baselineGeography={mockGeographyCalifornia}
          reformGeography={mockGeographyNewYork}
        />
      );

      // Should display geography properties
      expect(screen.getByText(/geographic area/i)).toBeInTheDocument();
      expect(screen.getByText(/type/i)).toBeInTheDocument();

      // Should display human-readable labels from V2 API
      expect(screen.getByText('California')).toBeInTheDocument();
      expect(screen.getByText('New York')).toBeInTheDocument();
      expect(screen.getAllByText('State')).toHaveLength(2); // Region type label
    });

    test('given same geography then displays value once', () => {
      render(
        <GeographySubPage
          baselineGeography={mockGeographyCalifornia}
          reformGeography={mockGeographyCalifornia}
        />
      );

      // Should only show label once per row (merged column)
      const caElements = screen.getAllByText('California');
      expect(caElements.length).toBe(1);
    });
  });

  describe('Design 4 styling', () => {
    test('given table then has proper semantic structure', () => {
      render(
        <GeographySubPage
          baselineGeography={mockGeographyCalifornia}
          reformGeography={mockGeographyNewYork}
        />
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      // Should have thead and tbody
      const rowgroups = within(table).getAllByRole('rowgroup');
      expect(rowgroups.length).toBeGreaterThanOrEqual(2);

      // Should have multiple rows
      const rows = within(table).getAllByRole('row');
      expect(rows.length).toBeGreaterThan(2);
    });
  });
});
