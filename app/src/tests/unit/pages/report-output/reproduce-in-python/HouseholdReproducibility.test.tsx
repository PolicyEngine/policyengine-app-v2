import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import HouseholdReproducibility from '@/pages/report-output/reproduce-in-python/HouseholdReproducibility';
import {
  DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS,
  EXPECTED_CODE_SNIPPETS,
  EXPECTED_TEXT,
  MOCK_REPORT_YEAR,
  UK_HOUSEHOLD_REPRODUCIBILITY_PROPS,
} from '@/tests/fixtures/pages/report-output/reproduce-in-python/reproducibilityMocks';

// Mock the useReportYear hook
vi.mock('@/hooks/useReportYear', () => ({
  useReportYear: () => MOCK_REPORT_YEAR,
}));

describe('HouseholdReproducibility', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    test('given valid props then renders title and instructions', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByRole('heading', { name: EXPECTED_TEXT.TITLE })).toBeInTheDocument();
      expect(screen.getByText(/Run the code below in a/)).toBeInTheDocument();
      expect(screen.getByText(EXPECTED_TEXT.PYTHON_LABEL)).toBeInTheDocument();
    });

    test('given valid props then renders Python notebook link', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      const link = screen.getByRole('link', { name: /Python notebook/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href');
      expect(link).toHaveAttribute('target', '_blank');
    });

    test('given valid props then renders earning variation toggle', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByText(EXPECTED_TEXT.EARNING_VARIATION_LABEL)).toBeInTheDocument();
      // Mantine Switch renders as a button with switch role
      expect(screen.getByRole('switch')).toBeInTheDocument();
    });

    test('given valid props then renders copy button', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByRole('button', { name: /Copy code to clipboard/i })).toBeInTheDocument();
    });

    test('given US country then generates US-specific code', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.US_HOUSEHOLD_IMPORT))
      ).toBeInTheDocument();
    });

    test('given UK country then generates UK-specific code', () => {
      // When
      render(<HouseholdReproducibility {...UK_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.UK_HOUSEHOLD_IMPORT))
      ).toBeInTheDocument();
    });

    test('given reform policy then includes Reform import in code', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.REFORM_IMPORT))
      ).toBeInTheDocument();
    });

    test('given household input then includes simulation setup in code', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(
        screen.getByText(new RegExp(EXPECTED_CODE_SNIPPETS.SIMULATION_CREATE))
      ).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    test('given copy button exists then user can click it', async () => {
      // Given
      const user = userEvent.setup();
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);
      const copyButton = screen.getByRole('button', { name: /Copy code to clipboard/i });

      // When/Then - button should be clickable without error
      await user.click(copyButton);
      expect(copyButton).toBeInTheDocument();
    });

    test('given user toggles earning variation then updates generated code', async () => {
      // Given
      const user = userEvent.setup();
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);
      const toggle = screen.getByRole('switch');

      // Verify initial state doesn't include axes
      expect(screen.queryByText(/axes/)).not.toBeInTheDocument();

      // When
      await user.click(toggle);

      // Then
      await waitFor(() => {
        expect(screen.getByText(/axes/)).toBeInTheDocument();
      });
    });
  });

  describe('code generation', () => {
    test('given household input then includes household data in situation', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      expect(screen.getByText(/situation =/)).toBeInTheDocument();
      expect(screen.getByText(/employment_income/)).toBeInTheDocument();
    });

    test('given year context then uses correct year in calculation', () => {
      // When
      render(<HouseholdReproducibility {...DEFAULT_HOUSEHOLD_REPRODUCIBILITY_PROPS} />);

      // Then
      // The year from the mock (2024) should appear in the output
      expect(screen.getByText(new RegExp(MOCK_REPORT_YEAR))).toBeInTheDocument();
    });
  });
});
