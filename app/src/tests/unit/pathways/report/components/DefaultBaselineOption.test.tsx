import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import { useCreateGeographicAssociation } from '@/hooks/useUserGeographic';
import { useUserSimulations } from '@/hooks/useUserSimulations';
import DefaultBaselineOption from '@/pathways/report/components/DefaultBaselineOption';
import {
  DEFAULT_BASELINE_LABELS,
  mockOnSelect,
  mockUseCreateGeographicAssociation,
  mockUseCreateSimulation,
  mockUseUserSimulationsEmpty,
  mockUseUserSimulationsWithExisting,
  resetAllMocks,
  TEST_COUNTRIES,
  TEST_CURRENT_LAW_ID,
} from '@/tests/fixtures/pathways/report/components/DefaultBaselineOptionMocks';

// Mock hooks
vi.mock('@/hooks/useUserSimulations', () => ({
  useUserSimulations: vi.fn(),
}));

vi.mock('@/hooks/useUserGeographic', () => ({
  useCreateGeographicAssociation: vi.fn(),
}));

vi.mock('@/hooks/useCreateSimulation', () => ({
  useCreateSimulation: vi.fn(),
}));

describe('DefaultBaselineOption', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty);
    vi.mocked(useCreateGeographicAssociation).mockReturnValue(mockUseCreateGeographicAssociation);
    vi.mocked(useCreateSimulation).mockReturnValue(mockUseCreateSimulation);
  });

  describe('Rendering', () => {
    test('given component renders then displays default baseline label', () => {
      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      // Then
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.US)).toBeInTheDocument();
      expect(
        screen.getByText('Use current law with all households nationwide as baseline')
      ).toBeInTheDocument();
    });

    test('given UK country then displays UK label', () => {
      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.UK}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      // Then
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.UK)).toBeInTheDocument();
    });

    test('given component renders then displays card as button', () => {
      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      // Then
      const button = screen.getByRole('button');
      expect(button).toBeInTheDocument();
      expect(button).not.toBeDisabled();
    });

    test('given component renders then displays chevron icon', () => {
      // When
      const { container } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      // Then
      const chevronIcon = container.querySelector('svg');
      expect(chevronIcon).toBeInTheDocument();
    });
  });

  describe('Detecting existing simulations', () => {
    test('given existing default baseline simulation then detects it', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithExisting);

      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      // Then - component renders successfully with existing simulation detected
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.US)).toBeInTheDocument();
    });

    test('given no existing simulation then component renders correctly', () => {
      // Given
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty);

      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      // Then
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.US)).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    test('given button is clicked then becomes disabled', async () => {
      // Given
      const user = userEvent.setup();

      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByRole('button');

      // When
      await user.click(button);

      // Then - button should be disabled to prevent double-clicks
      expect(button).toBeDisabled();
    });

    test('given button is clicked then displays loading text', async () => {
      // Given
      const user = userEvent.setup();

      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByRole('button');

      // When
      await user.click(button);

      // Then - should show either "Creating simulation..." or "Applying simulation..."
      const loadingText = screen.queryByText(/Creating simulation...|Applying simulation.../);
      expect(loadingText).toBeInTheDocument();
    });

    test('given existing simulation and button clicked then shows applying text', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsWithExisting);

      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByRole('button');

      // When
      await user.click(button);

      // Then
      expect(screen.getByText('Applying simulation...')).toBeInTheDocument();
    });

    test('given no existing simulation and button clicked then shows creating text', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserSimulations).mockReturnValue(mockUseUserSimulationsEmpty);

      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );

      const button = screen.getByRole('button');

      // When
      await user.click(button);

      // Then
      expect(screen.getByText('Creating simulation...')).toBeInTheDocument();
    });
  });

  describe('Props handling', () => {
    test('given different country IDs then generates correct labels', () => {
      // Test US
      const { rerender } = render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.US)).toBeInTheDocument();

      // Test UK
      rerender(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.UK}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={mockOnSelect}
        />
      );
      expect(screen.getByText(DEFAULT_BASELINE_LABELS.UK)).toBeInTheDocument();
    });

    test('given onSelect callback then passes it through', () => {
      // Given
      const customCallback = vi.fn();

      // When
      render(
        <DefaultBaselineOption
          countryId={TEST_COUNTRIES.US}
          currentLawId={TEST_CURRENT_LAW_ID}
          onSelect={customCallback}
        />
      );

      // Then - component renders with callback (testing it's accepted as prop)
      expect(screen.getByRole('button')).toBeInTheDocument();
    });
  });
});
