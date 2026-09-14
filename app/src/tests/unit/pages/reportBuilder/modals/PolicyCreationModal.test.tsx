import { fireEvent, render, screen, waitFor } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import type {
  ChangesCardProps,
  ModifiedParam,
} from '@/pages/reportBuilder/modals/policyCreation/types';
import { PolicyCreationModal } from '@/pages/reportBuilder/modals/PolicyCreationModal';
import type { PolicyStateProps } from '@/types/pathwayState';

const mockCreatePolicyWithLabel = vi.hoisted(() => vi.fn());
const mockCreatePolicyApi = vi.hoisted(() => vi.fn());
const mockUpdatePolicyAssociation = vi.hoisted(() => vi.fn());
const mockPolicyAssociationRefetch = vi.hoisted(() => vi.fn());
const MODAL_TEST_TIMEOUT_MS = 20_000;

const mockReduxState = {
  metadata: {
    parameterTree: null,
    parameters: {
      'gov.test.no_op': {
        label: 'No-op parameter',
        type: 'parameter',
        parameter: 'gov.test.no_op',
        values: { '2020-01-01': 1 },
      },
      'gov.test.transition': {
        label: 'Transition parameter',
        type: 'parameter',
        parameter: 'gov.test.transition',
        values: { '2025-01-01': 100, '2026-07-01': 200 },
      },
      'gov.test.parameter': {
        label: 'Test parameter',
        type: 'parameter',
        parameter: 'gov.test.parameter',
        values: { '2020-01-01': 0 },
      },
    },
    loading: false,
    error: null as string | null,
    currentCountry: 'us',
    currentLawId: 1,
    version: 'test',
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
  usePolicyAssociation: () => ({
    data: null,
    refetch: mockPolicyAssociationRefetch,
  }),
  useUpdatePolicyAssociation: () => ({
    mutateAsync: mockUpdatePolicyAssociation,
  }),
}));

vi.mock('@/api/policy', () => ({
  createPolicy: mockCreatePolicyApi,
}));

vi.mock('@/pages/reportBuilder/modals/policyCreation', () => ({
  ChangesCard: ({ modifiedParams, onRemoveChange }: ChangesCardProps) => (
    <div data-testid="changes-card">
      {modifiedParams.flatMap((parameter) =>
        parameter.changes.map((change) => (
          <button
            key={`${parameter.paramName}-${change.interval.startDate}-${change.interval.endDate}`}
            type="button"
            onClick={() => onRemoveChange?.(parameter.paramName, change.interval)}
          >
            Remove displayed change
          </button>
        ))
      )}
    </div>
  ),
  EmptyParameterState: () => <div data-testid="empty-parameter-state" />,
  HistoricalValuesCard: () => <div data-testid="historical-values-card" />,
  ParameterHeaderCard: () => <div data-testid="parameter-header-card" />,
  ParameterSidebar: () => <div data-testid="parameter-sidebar" />,
  PolicyOverviewContent: ({
    modifiedParams,
    onClickParam,
  }: {
    modifiedParams: ModifiedParam[];
    onClickParam: (paramName: string) => void;
  }) => (
    <div data-testid="policy-overview-content">
      {modifiedParams.map((parameter) => (
        <button
          key={parameter.paramName}
          type="button"
          onClick={() => onClickParam(parameter.paramName)}
        >
          Open displayed parameter
        </button>
      ))}
    </div>
  ),
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

const noOpPolicy: PolicyStateProps = {
  id: 'pol-123',
  label: 'No-op policy',
  parameters: [
    {
      name: 'gov.test.no_op',
      values: [{ startDate: '2024-01-01', endDate: '2024-12-31', value: 1 }],
    },
  ],
};

const transitionPolicy: PolicyStateProps = {
  id: 'pol-123',
  label: 'Transition policy',
  parameters: [
    {
      name: 'gov.test.transition',
      values: [{ startDate: '2025-01-01', endDate: '2026-12-31', value: 100 }],
    },
  ],
};

const policyWithHiddenNoOpBeforeEffectiveChange: PolicyStateProps = {
  id: 'pol-123',
  label: 'Mixed policy',
  parameters: [
    {
      name: 'gov.test.parameter',
      values: [
        { startDate: '2024-01-01', endDate: '2024-12-31', value: 0 },
        { startDate: '2025-01-01', endDate: '2025-12-31', value: 1 },
      ],
    },
  ],
};

describe('PolicyCreationModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockReduxState.metadata.loading = false;
    mockReduxState.metadata.error = null;
    mockReduxState.metadata.currentCountry = 'us';
    mockReduxState.metadata.currentLawId = 1;
    mockReduxState.metadata.version = 'test';
    mockCreatePolicyWithLabel.mockResolvedValue({ result: { policy_id: 'pol-new' } });
    mockCreatePolicyApi.mockResolvedValue({ result: { policy_id: 'pol-replacement' } });
    mockUpdatePolicyAssociation.mockResolvedValue({
      id: 'sup-123',
      userId: 'user-1',
      policyId: 'pol-replacement',
      countryId: 'us',
      label: 'Test policy',
    });
    mockPolicyAssociationRefetch.mockResolvedValue({
      data: {
        id: 'sup-123',
        userId: 'user-1',
        policyId: 'pol-123',
        countryId: 'us',
        label: 'Test policy',
      },
    });
  });

  test(
    'given every edited value matches current law then disables both save actions',
    () => {
      render(
        <PolicyCreationModal
          isOpen
          onClose={vi.fn()}
          onPolicyCreated={vi.fn()}
          reportYear="2024"
          simulationIndex={0}
          initialPolicy={noOpPolicy}
          initialEditorMode="edit"
        />
      );

      expect(screen.getByRole('button', { name: /update existing policy/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /save as new policy/i })).toBeDisabled();
      expect(screen.getByText(/selected values match current law/i)).toBeInTheDocument();
      expect(mockCreatePolicyApi).not.toHaveBeenCalled();
      expect(mockCreatePolicyWithLabel).not.toHaveBeenCalled();
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given model metadata is loading then disables policy creation',
    () => {
      mockReduxState.metadata.loading = true;

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

      expect(screen.getByRole('button', { name: /update existing policy/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /save as new policy/i })).toBeDisabled();
      expect(screen.getByText(/policy details are still loading/i)).toBeInTheDocument();
      expect(mockCreatePolicyApi).not.toHaveBeenCalled();
      expect(mockCreatePolicyWithLabel).not.toHaveBeenCalled();
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given metadata belongs to another country then disables policy creation',
    () => {
      mockReduxState.metadata.currentCountry = 'uk';

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

      expect(screen.getByRole('button', { name: /update existing policy/i })).toBeDisabled();
      expect(screen.getByRole('button', { name: /save as new policy/i })).toBeDisabled();
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given current law changes inside an edited range then updates with only the effective segment',
    async () => {
      const onPolicyCreated = vi.fn();

      render(
        <PolicyCreationModal
          isOpen
          onClose={vi.fn()}
          onPolicyCreated={onPolicyCreated}
          reportYear="2024"
          simulationIndex={0}
          initialPolicy={transitionPolicy}
          initialEditorMode="edit"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /update existing policy/i }));

      await waitFor(() => {
        expect(mockCreatePolicyApi).toHaveBeenCalledWith('us', {
          data: {
            'gov.test.transition': {
              '2026-07-01.2026-12-31': 100,
            },
          },
        });
      });
      expect(onPolicyCreated).toHaveBeenCalledWith({
        id: 'pol-replacement',
        label: 'Transition policy',
        parameters: [
          {
            name: 'gov.test.transition',
            values: [{ startDate: '2026-07-01', endDate: '2026-12-31', value: 100 }],
          },
        ],
      });
    },
    MODAL_TEST_TIMEOUT_MS
  );

  test(
    'given a hidden no-op precedes a displayed change then removes the displayed interval',
    async () => {
      render(
        <PolicyCreationModal
          isOpen
          onClose={vi.fn()}
          onPolicyCreated={vi.fn()}
          reportYear="2024"
          simulationIndex={0}
          initialPolicy={policyWithHiddenNoOpBeforeEffectiveChange}
          initialEditorMode="edit"
        />
      );

      fireEvent.click(screen.getByRole('button', { name: /open displayed parameter/i }));
      fireEvent.click(screen.getByRole('button', { name: /remove displayed change/i }));

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /update existing policy/i })).toBeDisabled();
      });
      expect(
        screen.queryByRole('button', { name: /remove displayed change/i })
      ).not.toBeInTheDocument();
    },
    MODAL_TEST_TIMEOUT_MS
  );

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
    'given update existing policy then resolves saved association by policy id',
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

      fireEvent.click(screen.getByRole('button', { name: /update existing policy/i }));

      await waitFor(() => {
        expect(mockPolicyAssociationRefetch).toHaveBeenCalled();
      });
      await waitFor(() => {
        expect(mockUpdatePolicyAssociation).toHaveBeenCalledWith({
          userPolicyId: 'sup-123',
          updates: { policyId: 'pol-replacement', label: 'Test policy' },
          replacementPolicyCountryId: 'us',
          replacementPolicyPayload: expect.any(Object),
        });
      });
      expect(onPolicyCreated).toHaveBeenCalledWith(
        expect.not.objectContaining({ associationId: expect.anything() })
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
