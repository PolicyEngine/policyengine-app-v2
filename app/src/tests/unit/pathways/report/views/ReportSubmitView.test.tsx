import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent } from '@test-utils';
import ReportSubmitView from '@/pathways/report/views/ReportSubmitView';
import {
  mockReportState,
  mockReportStateWithConfiguredBaseline,
  mockReportStateWithBothConfigured,
  mockOnSubmit,
  mockOnBack,
  mockOnCancel,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/ReportViewMocks';

describe('ReportSubmitView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Basic rendering', () => {
    test('given component renders then displays title', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /review report configuration/i })).toBeInTheDocument();
    });

    test('given component renders then displays subtitle', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getByText(/review your selected simulations/i)).toBeInTheDocument();
    });

    test('given component renders then displays baseline simulation box', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getByText(/baseline simulation/i)).toBeInTheDocument();
    });

    test('given component renders then displays comparison simulation box', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getByText(/comparison simulation/i)).toBeInTheDocument();
    });

    test('given component renders then displays create report button', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /create report/i })).toBeInTheDocument();
    });
  });

  describe('Configured baseline simulation', () => {
    test('given baseline configured then shows simulation label', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportStateWithConfiguredBaseline}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getAllByText(/baseline simulation/i).length).toBeGreaterThan(0);
    });

    test('given baseline configured then shows policy and population info', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportStateWithConfiguredBaseline}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getByText(/current law/i)).toBeInTheDocument();
      expect(screen.getByText(/my household/i)).toBeInTheDocument();
    });
  });

  describe('Both simulations configured', () => {
    test('given both configured then shows both simulation labels', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportStateWithBothConfigured}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getAllByText(/baseline simulation/i).length).toBeGreaterThan(0);
      expect(screen.getByText(/reform simulation/i)).toBeInTheDocument();
    });
  });

  describe('Unconfigured simulations', () => {
    test('given no simulations configured then shows no simulation placeholders', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      const noSimulationTexts = screen.getAllByText(/no simulation/i);
      expect(noSimulationTexts).toHaveLength(2);
    });
  });

  describe('User interactions', () => {
    test('given user clicks submit then calls onSubmit', async () => {
      // Given
      const user = userEvent.setup();
      render(
        <ReportSubmitView
          reportState={mockReportStateWithBothConfigured}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // When
      await user.click(screen.getByRole('button', { name: /create report/i }));

      // Then
      expect(mockOnSubmit).toHaveBeenCalled();
    });

    test('given isSubmitting true then button shows loading state', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportStateWithBothConfigured}
          onSubmit={mockOnSubmit}
          isSubmitting={true}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /create report/i })).toBeDisabled();
    });

    test('given isSubmitting false then button is enabled', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportStateWithBothConfigured}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /create report/i })).not.toBeDisabled();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
          onBack={mockOnBack}
        />
      );

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // When
      render(
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
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
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
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
        <ReportSubmitView
          reportState={mockReportState}
          onSubmit={mockOnSubmit}
          isSubmitting={false}
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
