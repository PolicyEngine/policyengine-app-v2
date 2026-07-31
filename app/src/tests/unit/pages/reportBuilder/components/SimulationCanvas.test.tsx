import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { SimulationCanvas } from '@/pages/reportBuilder/components/SimulationCanvas';
import type { ReportBuilderState } from '@/pages/reportBuilder/types';
import { initializeSimulationState } from '@/utils/pathwayState/initializeSimulationState';

const { mockRetryCatalogs, mockUseSimulationCanvas } = vi.hoisted(() => ({
  mockRetryCatalogs: vi.fn(),
  mockUseSimulationCanvas: vi.fn(),
}));

vi.mock('@/pages/reportBuilder/hooks/useSimulationCanvas', () => ({
  useSimulationCanvas: (...args: unknown[]) => mockUseSimulationCanvas(...args),
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
});
