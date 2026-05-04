import { fireEvent, render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { PolicyCreationModal } from '@/pages/reportBuilder/modals/PolicyCreationModal';
import type { PolicyStateProps } from '@/types/pathwayState';

const mockCreatePolicyWithLabel = vi.hoisted(() => vi.fn());
const MODAL_TEST_TIMEOUT_MS = 20_000;

const mockReduxState = {
  metadata: {
    parameterTree: null,
    parameters: {},
    loading: false,
    economyOptions: {
      time_period: [{ name: '2024', label: '2024' }],
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

vi.mock('@/hooks/useCurrentCountry', () => ({
  useCurrentCountry: () => 'us',
}));

vi.mock('@/hooks/useCreatePolicy', () => ({
  useCreatePolicy: () => ({
    createPolicyWithLabel: mockCreatePolicyWithLabel,
    isPending: false,
  }),
}));

vi.mock('@/hooks/useUserPolicy', () => ({
  useUpdatePolicyAssociation: () => ({
    mutateAsync: vi.fn(),
  }),
}));

vi.mock('@/pages/reportBuilder/modals/policyCreation', () => ({
  ChangesCard: () => <div data-testid="changes-card" />,
  EmptyParameterState: () => <div data-testid="empty-parameter-state" />,
  HistoricalValuesCard: () => <div data-testid="historical-values-card" />,
  ParameterHeaderCard: () => <div data-testid="parameter-header-card" />,
  ParameterSidebar: () => <div data-testid="parameter-sidebar" />,
  PolicyOverviewContent: () => <div data-testid="policy-overview-content" />,
  ValueSetterCard: () => <div data-testid="value-setter-card" />,
}));

const initialPolicy: PolicyStateProps = {
  id: 'pol-123',
  label: 'Test policy',
  parameters: [],
};

const modifiedPolicy: PolicyStateProps = {
  id: 'pol-123',
  label: 'Test policy',
  parameters: [
    {
      name: 'gov.test.parameter',
      values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: 1 }],
    },
  ],
};

describe('PolicyCreationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCreatePolicyWithLabel.mockResolvedValue({ result: { policy_id: 'pol-new' } });
  });

  test(
    'given forceReadOnly then does not render edit transition actions',
    () => {
      render(
        <PolicyCreationModal
          isOpen
          onClose={vi.fn()}
          onPolicyCreated={vi.fn()}
          reportYear="2024"
          simulationIndex={0}
          initialPolicy={initialPolicy}
          initialEditorMode="display"
          forceReadOnly
        />
      );

      expect(screen.queryByRole('button', { name: /edit this policy/i })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /update existing policy/i })
      ).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /save as new policy/i })).not.toBeInTheDocument();
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given display mode without forceReadOnly then renders edit transition action',
    () => {
      render(
        <PolicyCreationModal
          isOpen
          onClose={vi.fn()}
          onPolicyCreated={vi.fn()}
          reportYear="2024"
          simulationIndex={0}
          initialPolicy={initialPolicy}
          initialEditorMode="display"
        />
      );

      expect(screen.getByRole('button', { name: /edit this policy/i })).toBeInTheDocument();
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given save as new policy then asks for a new name before creating',
    async () => {
      const onPolicyCreated = vi.fn();

      render(
        <PolicyCreationModal
          isOpen
          onClose={vi.fn()}
          onPolicyCreated={onPolicyCreated}
          reportYear="2024"
          simulationIndex={0}
          initialPolicy={modifiedPolicy}
          initialEditorMode="edit"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save as new policy/i }));

      expect(screen.getByRole('heading', { name: /save as new policy/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /keep same name/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();

      const nameInput = screen.getByRole('textbox', { name: /new policy name/i });
      fireEvent.change(nameInput, { target: { value: 'Renamed policy' } });
      fireEvent.click(screen.getByRole('button', { name: /save with new name/i }));

      await waitFor(() => {
        expect(mockCreatePolicyWithLabel).toHaveBeenCalledWith(
          expect.any(Object),
          'Renamed policy'
        );
      });
      expect(onPolicyCreated).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'pol-new', label: 'Renamed policy' })
      );
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given keep same name from save as new policy then creates with current name',
    async () => {
      render(
        <PolicyCreationModal
          isOpen
          onClose={vi.fn()}
          onPolicyCreated={vi.fn()}
          reportYear="2024"
          simulationIndex={0}
          initialPolicy={modifiedPolicy}
          initialEditorMode="edit"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /save as new policy/i }));
      fireEvent.click(screen.getByRole('button', { name: /keep same name/i }));

      await waitFor(() => {
        expect(mockCreatePolicyWithLabel).toHaveBeenCalledWith(expect.any(Object), 'Test policy');
      });
    },
    MODAL_TEST_TIMEOUT_MS
  );
});
