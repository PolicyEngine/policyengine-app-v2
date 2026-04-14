import { render, screen } from '@test-utils';
import { describe, expect, test, vi } from 'vitest';
import { PolicyCreationModal } from '@/pages/reportBuilder/modals/PolicyCreationModal';
import type { PolicyStateProps } from '@/types/pathwayState';

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
    createPolicy: vi.fn(),
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

describe('PolicyCreationModal', () => {
  test('given forceReadOnly then does not render edit transition actions', () => {
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
  });

  test('given display mode without forceReadOnly then renders edit transition action', () => {
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
  });
});
