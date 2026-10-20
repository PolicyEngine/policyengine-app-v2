import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCountryCapability } from '@/hooks/useCountries';
import PopulationScopeView from '@/pathways/report/views/population/PopulationScopeView';
import {
  mockOnBack,
  mockOnCancel,
  mockOnScopeSelected,
  mockRegionData,
  resetAllMocks,
  TEST_COUNTRY_ID,
} from '@/tests/fixtures/pathways/report/views/PopulationViewMocks';

vi.mock('@/hooks/useCountries', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/hooks/useCountries')>()),
  useCountryCapability: vi.fn(),
}));

const mockUseCountryCapability = vi.mocked(useCountryCapability);

function listCountryCapability(countryId: 'us' | 'uk', societyWideEnabled: boolean) {
  mockUseCountryCapability.mockReturnValue({
    id: countryId,
    name: countryId === 'us' ? 'United States' : 'United Kingdom',
    householdEnabled: true,
    societyWideEnabled,
  });
}

describe('PopulationScopeView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    listCountryCapability('us', true);
  });

  describe('Household-only countries', () => {
    test('given a household-only country then offers only the custom household option', () => {
      // Given
      listCountryCapability('uk', false);

      // When
      render(
        <PopulationScopeView
          countryId="uk"
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
        />
      );

      // Then
      expect(screen.getByRole('radio', { name: /custom household/i })).toBeChecked();
      expect(screen.queryByRole('radio', { name: /uk-wide/i })).not.toBeInTheDocument();
      expect(screen.getAllByRole('radio')).toHaveLength(1);
    });

    test('given a household-only country when the scope is submitted then a household scope is chosen', async () => {
      // Given
      const user = userEvent.setup();
      listCountryCapability('uk', false);
      render(
        <PopulationScopeView
          countryId="uk"
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: /select scope/i }));

      // Then
      expect(mockOnScopeSelected).toHaveBeenCalledWith(null, 'household');
    });

    test('given a society-wide country then national and household options are both offered', () => {
      // When
      render(
        <PopulationScopeView
          countryId="us"
          regionData={mockRegionData}
          onScopeSelected={mockOnScopeSelected}
        />
      );

      // Then
      expect(screen.getByRole('radio', { name: /all households nationally/i })).toBeChecked();
      expect(screen.getByRole('radio', { name: /custom household/i })).toBeInTheDocument();
      expect(mockUseCountryCapability).toHaveBeenCalledWith('us');
    });
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
