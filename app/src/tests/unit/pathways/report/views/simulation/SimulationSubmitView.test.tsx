import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { useCreateSimulation } from '@/hooks/useCreateSimulation';
import SimulationSubmitView from '@/pathways/report/views/simulation/SimulationSubmitView';
import { mockSimulationStateConfigured } from '@/tests/fixtures/pathways/report/views/SimulationViewMocks';

vi.mock('@/hooks/useCreateSimulation', () => ({
  useCreateSimulation: vi.fn(),
}));

describe('SimulationSubmitView', () => {
  const createSimulation = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useCreateSimulation).mockReturnValue({
      createSimulation,
      isPending: false,
      error: null,
    });
  });

  test('given a selected household later errors then disables and guards submission', async () => {
    const user = userEvent.setup();
    render(
      <SimulationSubmitView
        simulation={mockSimulationStateConfigured}
        onSubmitSuccess={vi.fn()}
        isPopulationUnavailable
        populationErrorMessage="Error loading this population"
      />
    );

    expect(screen.getByLabelText('Error loading this population')).toBeInTheDocument();
    expect(screen.getByText('Failed to load')).toBeInTheDocument();

    const submitButton = screen.getByRole('button', { name: /create simulation/i });
    expect(submitButton).toBeDisabled();
    await user.click(submitButton);
    expect(createSimulation).not.toHaveBeenCalled();
  });
});
