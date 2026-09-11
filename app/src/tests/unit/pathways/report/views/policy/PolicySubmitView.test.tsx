/**
 * Tests for PolicySubmitView
 *
 * Issue #605: Warn or block when creating a policy with no parameter changes
 */

import { render, screen, userEvent, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import PolicySubmitView from '@/pathways/report/views/policy/PolicySubmitView';
import { PolicyStateProps } from '@/types/pathwayState';

const mockCreatePolicy = vi.hoisted(() => vi.fn());

const mockReduxState = {
  metadata: {
    parameters: {
      'gov.test.amount': {
        label: 'Test amount',
        type: 'parameter',
        parameter: 'gov.test.amount',
        unit: 'currency-USD',
        values: {
          '2025-01-01': 100,
          '2026-07-01': 200,
        },
      },
      'gov.test.boolean': {
        label: 'Test Boolean',
        type: 'parameter',
        parameter: 'gov.test.boolean',
        unit: 'bool',
        values: { '2020-01-01': false },
      },
      'gov.test.zero': {
        label: 'Test zero',
        type: 'parameter',
        parameter: 'gov.test.zero',
        unit: 'currency-USD',
        values: { '2020-01-01': 0 },
      },
    },
  },
};

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
  label: 'No-op policy',
  parameters: [
    {
      name: 'gov.test.amount',
      values: [{ startDate: '2025-01-01', endDate: '2025-12-31', value: 100 }],
    },
  ],
};

const POLICY_SPANNING_CURRENT_LAW_CHANGE: PolicyStateProps = {
  label: 'Freeze amount',
  parameters: [
    {
      name: 'gov.test.amount',
      values: [{ startDate: '2025-01-01', endDate: '2026-12-31', value: 100 }],
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

    test('given policy values match current law then disables submission and explains why', () => {
      render(
        <PolicySubmitView
          policy={POLICY_MATCHING_CURRENT_LAW}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      expect(screen.getByRole('button', { name: /create policy/i })).toBeDisabled();
      expect(screen.getByText(/selected values match current law/i)).toBeInTheDocument();
    });

    test('given false and zero match current law then treats both as no effective changes', () => {
      const policy: PolicyStateProps = {
        label: 'Falsy values',
        parameters: [
          {
            name: 'gov.test.boolean',
            values: [{ startDate: '2025-01-01', endDate: '2025-12-31', value: false }],
          },
          {
            name: 'gov.test.zero',
            values: [{ startDate: '2025-01-01', endDate: '2025-12-31', value: 0 }],
          },
        ],
      };

      render(
        <PolicySubmitView policy={policy} countryId="us" onSubmitSuccess={mockOnSubmitSuccess} />
      );

      expect(screen.getByRole('button', { name: /create policy/i })).toBeDisabled();
    });

    test('given current law changes inside the proposal then submits only the effective segment', async () => {
      const user = userEvent.setup();
      render(
        <PolicySubmitView
          policy={POLICY_SPANNING_CURRENT_LAW_CHANGE}
          countryId="us"
          onSubmitSuccess={mockOnSubmitSuccess}
        />
      );

      await user.click(screen.getByRole('button', { name: /create policy/i }));

      await waitFor(() =>
        expect(mockCreatePolicy).toHaveBeenCalledWith(
          {
            data: {
              'gov.test.amount': { '2026-07-01.2026-12-31': 100 },
            },
          },
          expect.any(Object)
        )
      );
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
