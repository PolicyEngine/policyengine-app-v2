/**
 * Tests for PolicySubmitView
 *
 * Issue #605: Warn or block when creating a policy with no parameter changes
 */

import { render, screen } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicySubmitView from '@/pathways/report/views/policy/PolicySubmitView';
import { PolicyStateProps } from '@/types/pathwayState';

const mockCreatePolicy = vi.hoisted(() => vi.fn());
const mockReduxState = vi.hoisted(() => ({
  metadata: {
    loading: false,
    error: null,
    currentCountry: 'us',
    currentLawId: 1,
    version: 'test-version',
    parameters: {
      'gov.irs.deductions.itemized.charity.floor.applies': {
        label: 'Charity floor applies',
        type: 'parameter',
        parameter: 'gov.irs.deductions.itemized.charity.floor.applies',
        values: { '0000-01-01': true },
      },
    },
  },
}));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return {
    ...actual,
    useSelector: (selector: (state: typeof mockReduxState) => unknown) => selector(mockReduxState),
  };
});

// Mock the useCreatePolicy hook
vi.mock('@/hooks/useCreatePolicy', () => ({
  useCreatePolicy: vi.fn(() => ({
    createPolicy: mockCreatePolicy,
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

const POLICY_MATCHING_CURRENT_LAW: PolicyStateProps = {
  id: undefined,
  label: 'Current-law duplicate',
  parameters: [
    {
      name: 'gov.irs.deductions.itemized.charity.floor.applies',
      values: [{ startDate: '2025-01-01', endDate: '2025-12-31', value: true }],
    },
  ],
};

const POLICY_WITH_PARTIAL_CHANGE: PolicyStateProps = {
  id: undefined,
  label: 'Partly changed policy',
  parameters: [
    {
      name: 'gov.irs.deductions.itemized.charity.floor.applies',
      values: [
        { startDate: '2025-01-01', endDate: '2025-12-31', value: true },
        { startDate: '2026-01-01', endDate: '2026-12-31', value: false },
      ],
    },
  ],
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

  describe('Current-law comparison', () => {
    test('given all intervals match current law then disables creation and explains why', () => {
      render(
        <PolicySubmitView
          policy={POLICY_MATCHING_CURRENT_LAW}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      const createButton = screen.getByRole('button', { name: /create policy/i });
      expect(createButton).toBeDisabled();
      expect(screen.getByText(/selected values match current law/i)).toBeInTheDocument();
      createButton.click();
      expect(mockCreatePolicy).not.toHaveBeenCalled();
    });

    test('given matching and changed intervals then submits only the changed interval', () => {
      render(
        <PolicySubmitView
          policy={POLICY_WITH_PARTIAL_CHANGE}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      screen.getByRole('button', { name: /create policy/i }).click();

      expect(mockCreatePolicy).toHaveBeenCalledWith(
        {
          data: {
            'gov.irs.deductions.itemized.charity.floor.applies': {
              '2026-01-01.2026-12-31': false,
            },
          },
        },
        expect.any(Object)
      );
    });
  });
});
