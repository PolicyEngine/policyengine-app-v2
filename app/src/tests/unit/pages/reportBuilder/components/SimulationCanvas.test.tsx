import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SimulationBlockFull } from '@/pages/reportBuilder/components/SimulationBlockFull';
import { SimulationCanvas } from '@/pages/reportBuilder/components/SimulationCanvas';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import { ownershipReportState } from '@/tests/fixtures/spm/reportBuilderOwnershipMocks';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';

const { mockRetryCatalogs, mockUseSimulationCanvas } = vi.hoisted(() => ({
  mockRetryCatalogs: vi.fn(),
  mockUseSimulationCanvas: vi.fn(),
}));

vi.mock('@/pages/reportBuilder/hooks/useSimulationCanvas', () => ({
  useSimulationCanvas: (...args: unknown[]) => mockUseSimulationCanvas(...args),
}));

vi.mock('@/pages/reportBuilder/modals', () => ({
  HouseholdCreationModal: () => null,
  PolicyCreationModal: () => null,
  PolicyBrowseModal: () => null,
  PopulationBrowseModal: () => null,
}));

describe('SimulationCanvas', () => {
  const reportState: ReportBuilderState = {
    label: null,
    year: '2026',
    simulations: [initializeSimulationState()],
  };
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSimulationCanvas.mockReturnValue({
      isInitialLoading: false,
      catalogError: new Error('Policy associations failed'),
      catalogErrorMessage: "We couldn't load your saved policies.",
      isRetryingCatalogs: false,
      retryCatalogs: mockRetryCatalogs,
      householdEditorState: { returnToBrowseOnBack: false },
      policyCreationState: { returnToBrowseOnBack: false },
      closeHouseholdEditor: vi.fn(),
      returnToPopulationBrowse: vi.fn(),
      closePolicyCreation: vi.fn(),
      returnToPolicyBrowse: vi.fn(),
    });
  });

  test('given a catalog failure then shows an actionable error instead of the loading skeleton', async () => {
    const user = userEvent.setup();

    render(
      <SimulationCanvas reportYear="2026" reportState={reportState} setReportState={vi.fn()} />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Saved ingredients unavailable');
    expect(screen.getByText("We couldn't load your saved policies.")).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(mockRetryCatalogs).toHaveBeenCalledOnce();
  });

  test.each([false, true])(
    'given population sharing is %s then the real canvas displays the corresponding household and inheritance state',
    (shared) => {
      const state = ownershipReportState();
      if (shared) {
        state.simulations[1].population = { ...state.simulations[0].population };
      }
      const getPopulationErrorMessage = vi.fn();
      mockUseSimulationCanvas.mockReturnValue({
        countryId: 'us',
        isInitialLoading: false,
        catalogError: null,
        householdEditorState: { isOpen: false },
        policyCreationState: { isOpen: false },
        populationBrowseState: { isOpen: false },
        policyBrowseState: { isOpen: false },
        getPolicyErrorMessage: vi.fn(),
        getPopulationErrorMessage,
      });

      render(
        <SimulationCanvas
          reportYear={state.year}
          reportState={state}
          setReportState={vi.fn()}
          BlockComponent={SimulationBlockFull}
          isReadOnly
        />
      );

      if (shared) {
        expect(screen.getByText('(inherited from baseline)')).toBeVisible();
        expect(screen.getAllByText('National household')).toHaveLength(2);
      } else {
        expect(screen.queryByText('(inherited from baseline)')).not.toBeInTheDocument();
        expect(screen.getByText('National household')).toBeVisible();
        expect(screen.getByText('County household')).toBeVisible();
      }
      expect(getPopulationErrorMessage).toHaveBeenLastCalledWith(
        state.simulations[1].population.household!.id
      );
    }
  );
});
