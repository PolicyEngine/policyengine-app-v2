/**
 * Tests for PolicySubmitView
 *
 * Issue #605: Warn or block when creating a policy with no parameter changes
 */

import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicySubmitView from '@/pathways/report/views/policy/PolicySubmitView';
import { PolicyStateProps } from '@/types/pathwayState';

// Mock the useCreatePolicy hook
vi.mock('@/hooks/useCreatePolicy', () => ({
  useCreatePolicy: vi.fn(() => ({
    createPolicy: vi.fn(),
    isPending: false,
  })),
}));

// Test fixtures
const POLICY_WITH_PARAMS: PolicyStateProps = {
  id: undefined,
  label: 'Test Policy',
  parameters: [
    {
      name: 'gov.irs.deductions.itemized.charity.floor.applies',
      values: [{ startDate: '2025-01-01', endDate: '2099-12-31', value: false }],
    },
  ],
};

const POLICY_WITHOUT_PARAMS: PolicyStateProps = {
  id: undefined,
  label: 'Empty Policy',
  parameters: [],
};

const mockOnSubmitSuccess = vi.fn();
const mockOnBack = vi.fn();
const mockOnCancel = vi.fn();

describe('PolicySubmitView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Issue #605: Block empty policy creation', () => {
    test('given policy with parameters then submit button is enabled', () => {
      // When
      render(
        <PolicySubmitView
          policy={POLICY_WITH_PARAMS}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      // Then
      const submitButton = screen.getByRole('button', { name: /create policy/i });
      expect(submitButton).not.toBeDisabled();
    });

    test('given policy without parameters then submit button is disabled', () => {
      // When
      render(
        <PolicySubmitView
          policy={POLICY_WITHOUT_PARAMS}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      // Then
      const submitButton = screen.getByRole('button', { name: /create policy/i });
      expect(submitButton).toBeDisabled();
    });

    test('given policy without parameters then shows warning message', () => {
      // When
      render(
        <PolicySubmitView
          policy={POLICY_WITHOUT_PARAMS}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.getByText(/add at least one parameter change/i)).toBeInTheDocument();
    });

    test('given policy with parameters then does not show warning message', () => {
      // When
      render(
        <PolicySubmitView
          policy={POLICY_WITH_PARAMS}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
          onBack={mockOnBack}
          onCancel={mockOnCancel}
        />
      );

      // Then
      expect(screen.queryByText(/add at least one parameter change/i)).not.toBeInTheDocument();
    });
  });

  describe('Rendering', () => {
    test('given policy then displays review title', () => {
      // When
      render(
        <PolicySubmitView
          policy={POLICY_WITH_PARAMS}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // Then
      expect(screen.getByRole('heading', { name: /review policy/i })).toBeInTheDocument();
    });

    test('given policy with parameters then displays parameter names', () => {
      // When
      render(
        <PolicySubmitView
          policy={POLICY_WITH_PARAMS}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      // Then
      expect(
        screen.getByText('gov.irs.deductions.itemized.charity.floor.applies')
      ).toBeInTheDocument();
    });
  });
});
