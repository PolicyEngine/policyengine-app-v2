import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import PolicyLabelView from '@/pathways/report/views/policy/PolicyLabelView';
import {
  mockOnBack,
  mockOnCancel,
  mockOnNext,
  mockOnUpdateLabel,
  resetAllMocks,
  TEST_COUNTRY_ID,
  TEST_POLICY_LABEL,
} from '@/tests/fixtures/pathways/report/views/PolicyViewMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

describe('PolicyLabelView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    vi.mocked(useCurrentCountry).mockReturnValue(TEST_COUNTRY_ID);
  });

  describe('Standalone mode', () => {
    test('given standalone mode then displays create policy title', () => {
      // When
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /create policy/i })).toBeInTheDocument();
    });

    test('given standalone mode then displays policy title input', () => {
      // When
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then - label text is visible, input is a sibling (not connected via htmlFor)
      expect(screen.getByText(/policy title/i)).toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });

    test('given standalone mode and null label then shows default My policy', () => {
      // When
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('textbox')).toHaveValue('My policy');
    });
  });

  describe('Report mode', () => {
    test('given report mode without simulationIndex then throws error', () => {
      // Given/When/Then
      expect(() =>
        render(
          <PolicyLabelView
            label={null}
            mode="report"
            onUpdateLabel={mockOnUpdateLabel}
            onNext={mockOnNext}
          />
        )
      ).toThrow('simulationIndex is required');
    });

    test('given report mode baseline then shows baseline policy default label', () => {
      // When
      render(
        <PolicyLabelView
          label={null}
          mode="report"
          simulationIndex={0}
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('textbox')).toHaveValue('Baseline policy');
    });

    test('given report mode reform then shows reform policy default label', () => {
      // When
      render(
        <PolicyLabelView
          label={null}
          mode="report"
          simulationIndex={1}
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('textbox')).toHaveValue('Reform policy');
    });
  });

  describe('User interactions', () => {
    test('given user types label then input updates', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByRole('textbox');

      // When
      await user.clear(input);
      await user.type(input, TEST_POLICY_LABEL);

      // Then
      expect(input).toHaveValue(TEST_POLICY_LABEL);
    });

    test('given user submits then calls onUpdateLabel and onNext', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );
      const submitButton = screen.getByRole('button', { name: /initialize policy/i });

      // When
      await user.click(submitButton);

      // Then
      expect(mockOnUpdateLabel).toHaveBeenCalled();
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Country-specific text', () => {
    test('given US country then shows Initialize button', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('us');

      // When
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialize policy/i })).toBeInTheDocument();
    });

    test('given UK country then shows Initialise button', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('uk');

      // When
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialise policy/i })).toBeInTheDocument();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // When
      render(
        <PolicyLabelView
          label={null}
          mode="standalone"
          onUpdateLabel={mockOnUpdateLabel}
          onNext={mockOnNext}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
