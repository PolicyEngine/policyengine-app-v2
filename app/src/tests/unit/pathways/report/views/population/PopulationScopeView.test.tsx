import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PopulationScopeView from '@/pathways/report/views/population/PopulationScopeView';
import {
  mockOnBack,
  mockOnCancel,
  mockOnScopeSelected,
  mockRegionData,
  resetAllMocks,
  TEST_COUNTRY_ID,
} from '@/tests/fixtures/pathways/report/views/PopulationViewMocks';

describe('PopulationScopeView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    test('given component renders then displays title', () => {
      // When
      render(
        <PopulationScopeView
          countryId={TEST_COUNTRY_ID}
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /select household scope/i })).toBeInTheDocument();
    });

    test('given component renders then displays select scope button', () => {
      // When
      render(
        <PopulationScopeView
          countryId={TEST_COUNTRY_ID}
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /select scope/i })).toBeInTheDocument();
    });
  });

  describe('US country options', () => {
    test('given US country then displays US geographic options', () => {
      // When
      render(
        <PopulationScopeView
          countryId="us"
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
        />
      );

      // Then
      expect(screen.getByText(/national/i)).toBeInTheDocument();
    });
  });

  describe('UK country options', () => {
    test('given UK country then renders without error', () => {
      // When
      const { container } = render(
        <PopulationScopeView
          countryId="uk"
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
        />
      );

      // Then
      expect(container).toBeInTheDocument();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <PopulationScopeView
          countryId={TEST_COUNTRY_ID}
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // When
      render(
        <PopulationScopeView
          countryId={TEST_COUNTRY_ID}
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
