import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useUserPolicies } from '@/hooks/useUserPolicy';
import PolicyExistingView from '@/pathways/report/views/policy/PolicyExistingView';
import {
  mockOnBack,
  mockOnCancel,
  mockOnSelectPolicy,
  mockUseUserPoliciesEmpty,
  mockUseUserPoliciesError,
  mockUseUserPoliciesErrorNoMessage,
  mockUseUserPoliciesLoading,
  mockUseUserPoliciesWithData,
  mockUseUserPoliciesWithMissingId,
  resetAllMocks,
} from '@/tests/fixtures/pathways/report/views/PolicyViewMocks';

vi.mock('@/hooks/useUserPolicy', () => ({
  useUserPolicies: vi.fn(),
  isPolicyWithAssociation: vi.fn(
    (value: unknown) =>
      !!value && typeof value === 'object' && 'association' in value && 'policy' in value
  ),
}));

describe('PolicyExistingView', () => {
  beforeEach(() => {
    resetAllMocks();
    vi.clearAllMocks();
  });

  describe('Loading state', () => {
    test('given loading then displays loading message', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesLoading as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByText(/loading policies/i)).toBeInTheDocument();
    });
  });

  describe('Error state', () => {
    test('given error then displays error message', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesError as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      expect(screen.getByText(/failed to load policies/i)).toBeInTheDocument();
    });

    test('given error without message then displays fallback error message', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesErrorNoMessage as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByText(/error/i)).toBeInTheDocument();
      // The fallback message may be split across elements, so use a flexible matcher
      expect(screen.getByText(/failed to load policies/i)).toBeInTheDocument();
      expect(screen.getByText(/please refresh and try again/i)).toBeInTheDocument();
    });
  });

  describe('Empty state', () => {
    test('given no policies then displays no policies message', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesEmpty as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByText(/no policies available/i)).toBeInTheDocument();
    });

    test('given no policies then next button is disabled', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesEmpty as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });
  });

  describe('With policies', () => {
    test('given policies available then displays policy cards', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesWithData as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByText(/my policy/i)).toBeInTheDocument();
    });

    test('given policies available then next button initially disabled', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesWithData as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    test('given policy with missing ID then handles gracefully with unknown fallback', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesWithMissingId as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then - should display policy with fallback ID text
      expect(screen.getByText(/policy without id/i)).toBeInTheDocument();
      // The subtitle should show "Policy #unknown" when ID is missing
      expect(screen.getByText(/policy #unknown/i)).toBeInTheDocument();
    });

    test('given a policy detail error then displays an unselectable card with a warning icon', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserPolicies).mockReturnValue({
        data: [
          {
            association: {
              id: 'broken-association',
              userId: '1',
              policyId: 'broken-policy',
              label: 'Broken policy',
              countryId: 'us',
            },
            policy: undefined,
            isLoading: false,
            isError: true,
            error: new Error('Policy request failed'),
          },
        ],
        isLoading: false,
        isError: false,
        error: null,
      } as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);
      const policyCard = screen.getByText('Broken policy').closest('button');

      // Then
      expect(policyCard).toHaveAttribute('aria-disabled', 'true');
      expect(screen.getByText('Failed to load')).toBeInTheDocument();
      expect(screen.getByLabelText('Error loading this policy')).toBeInTheDocument();

      await user.click(policyCard!);
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      expect(mockOnSelectPolicy).not.toHaveBeenCalled();
    });
  });

  describe('User interactions', () => {
    test('given user selects policy then next button is enabled', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesWithData as any);
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);
      const policyCard = screen.getByText(/my policy/i).closest('button');

      // When
      await user.click(policyCard!);

      // Then
      expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled();
    });

    test('given user selects and submits then calls onSelectPolicy', async () => {
      // Given
      const user = userEvent.setup();
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesWithData as any);
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);
      const policyCard = screen.getByText(/my policy/i).closest('button');

      // When
      await user.click(policyCard!);
      await user.click(screen.getByRole('button', { name: /next/i }));

      // Then
      expect(mockOnSelectPolicy).toHaveBeenCalled();
    });

    test('given a selected policy later errors then disables submission', async () => {
      // Given
      const user = userEvent.setup();
      let queryResult = mockUseUserPoliciesWithData as any;
      vi.mocked(useUserPolicies).mockImplementation(() => queryResult);
      const { rerender } = render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      await user.click(screen.getByText(/my policy/i).closest('button')!);
      expect(screen.getByRole('button', { name: /next/i })).toBeEnabled();

      // When
      queryResult = {
        ...queryResult,
        data: queryResult.data.map((item: any, index: number) =>
          index === 0
            ? {
                ...item,
                policy: undefined,
                isError: true,
                error: new Error('Policy request failed'),
              }
            : item
        ),
      };
      rerender(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} />);

      // Then
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled();
      await user.click(screen.getByRole('button', { name: /next/i }));
      expect(mockOnSelectPolicy).not.toHaveBeenCalled();
    });
  });

  describe('Navigation actions', () => {
    test('given onBack provided then renders back button', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesEmpty as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} onBack={mockOnBack} />);

      // Then
      expect(screen.getByRole('button', { name: /back/i })).toBeInTheDocument();
    });

    test('given onCancel provided then renders cancel button', () => {
      // Given
      vi.mocked(useUserPolicies).mockReturnValue(mockUseUserPoliciesEmpty as any);

      // When
      render(<PolicyExistingView onSelectPolicy={mockOnSelectPolicy} onCancel={mockOnCancel} />);

      // Then
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    });
  });
});
