import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCurrentCountry } from '@/hooks/useCurrentCountry';
import ReportLabelView from '@/pathways/report/views/ReportLabelView';
import {
  mockOnBack,
  mockOnCancel,
  mockOnNext,
  mockOnUpdateLabel,
  mockOnUpdateYear,
  resetAllMocks,
  TEST_COUNTRY_ID,
  TEST_REPORT_LABEL,
} from '@/tests/fixtures/pathways/report/views/ReportViewMocks';

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: vi.fn(),
}));

describe('ReportLabelView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
    vi.mocked(useCurrentCountry).mockReturnValue(TEST_COUNTRY_ID);
  });

  describe('Basic rendering', () => {
    test('given component renders then displays title', () => {
      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /create report/i })).toBeInTheDocument();
    });

    test('given component renders then displays report name input', () => {
      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/report name/i)).toBeInTheDocument();
    });

    test('given component renders then displays year select', () => {
      // When
      const { container } = render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then - Year select exists as a searchable input
      const yearInput = container.querySelector('input[aria-haspopup="listbox"]');
      expect(yearInput).toBeInTheDocument();
    });
  });

  describe('US country specific', () => {
    test('given US country then displays Initialize button', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('us');

      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialize report/i })).toBeInTheDocument();
    });
  });

  describe('UK country specific', () => {
    test('given UK country then displays Initialise button with British spelling', () => {
      // Given
      vi.mocked(useCurrentCountry).mockReturnValue('uk');

      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /initialise report/i })).toBeInTheDocument();
    });
  });

  describe('Pre-populated label', () => {
    test('given existing label then input shows label value', () => {
      // When
      render(
        <ReportLabelView
          label={TEST_REPORT_LABEL}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/report name/i)).toHaveValue(TEST_REPORT_LABEL);
    });

    test('given null label then input is empty', () => {
      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.getByLabelText(/report name/i)).toHaveValue('');
    });
  });

  describe('User interactions', () => {
    test('given user types in label then input value updates', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByLabelText(/report name/i);

      // When
      await user.type(input, 'New Report Name');

      // Then
      expect(input).toHaveValue('New Report Name');
    });

    test('given user clicks submit then calls onUpdateLabel with entered value', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );
      const input = screen.getByLabelText(/report name/i);
      const submitButton = screen.getByRole('button', { name: /initialize report/i });

      // When
      await user.type(input, 'Test Report');
      await user.click(submitButton);

      // Then
      expect(mockOnUpdateLabel).toHaveBeenCalledWith('Test Report');
    });

    test('given user clicks submit then calls onUpdateYear with year value', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );
      const submitButton = screen.getByRole('button', { name: /initialize report/i });

      // When
      await user.click(submitButton);

      // Then
      expect(mockOnUpdateYear).toHaveBeenCalledWith('2025');
    });

    test('given user clicks submit then calls onNext', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );
      const submitButton = screen.getByRole('button', { name: /initialize report/i });

      // When
      await user.click(submitButton);

      // Then
      expect(mockOnNext).toHaveBeenCalled();
    });

    test('given user clicks submit with empty label then still submits empty string', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );
      const submitButton = screen.getByRole('button', { name: /initialize report/i });

      // When
      await user.click(submitButton);

      // Then
      expect(mockOnUpdateLabel).toHaveBeenCalledWith('');
      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onBack not provided then no back button', () => {
      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
        />
      );

      // Then
      expect(screen.queryByRole('button', { name: /back/i })).not.toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // When
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });

    test('given user clicks back then calls onBack', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
          onBack={mockOnBack}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: /back/i }));

      // Then
      expect(mockOnBack).toHaveBeenCalled();
    });

    test('given user clicks cancel then calls onCancel', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportLabelView
          label={null}
          year="2025"
          onUpdateLabel={mockOnUpdateLabel}
          onUpdateYear={mockOnUpdateYear}
          onNext={mockOnNext}
          onCancel={mockOnCancel}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: /cancel/i }));

      // Then
      expect(mockOnCancel).toHaveBeenCalled();
    });
  });
});
