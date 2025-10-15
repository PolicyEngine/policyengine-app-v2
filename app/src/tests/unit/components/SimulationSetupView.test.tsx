import { render, screen, userEvent } from '@test-utils';
import { Provider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import SimulationSetupView from '@/components/SimulationSetupView';
import {
  SIMULATION_SETUP_STRINGS,
  createMockStore,
  mockPolicyState,
  mockPopulationState,
} from '@/tests/fixtures/components/SimulationSetupViewMocks';

// Mock useBackButton hook
const mockHandleBack = vi.fn();
vi.mock('@/hooks/useBackButton', () => ({
  useBackButton: vi.fn(() => ({ handleBack: mockHandleBack, canGoBack: false })),
}));

// Mock useCancelFlow hook
const mockHandleCancel = vi.fn();
vi.mock('@/hooks/useCancelFlow', () => ({
  useCancelFlow: vi.fn(() => ({ handleCancel: mockHandleCancel })),
}));

// Import after mocks to get mocked versions
import { useBackButton } from '@/hooks/useBackButton';
import { useCancelFlow } from '@/hooks/useCancelFlow';

describe('SimulationSetupView', () => {
  const mockOnPolicySelect = vi.fn();
  const mockOnPopulationSelect = vi.fn();
  const mockOnNext = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockHandleBack.mockClear();
  });

  const renderWithStore = (component: React.ReactElement, storeState?: any) => {
    const store = createMockStore(storeState?.policy, storeState?.population);
    return render(<Provider store={store as any}>{component}</Provider>);
  };

  test('given no policy or population then renders setup cards', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />
    );

    // Then - Should show both setup cards (buttons)
    const buttons = screen.getAllByRole('button');
    // Filter out Cancel and Next buttons to count only setup cards
    const setupCards = buttons.filter(
      (btn) => !btn.textContent?.includes('Cancel') && !btn.textContent?.includes('Next')
    );
    expect(setupCards.length).toBeGreaterThan(0);
  });

  test('given canProceed false then next button is disabled', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />
    );

    // Then
    const nextButton = screen.getByRole('button', { name: SIMULATION_SETUP_STRINGS.NEXT_BUTTON });
    expect(nextButton).toHaveAttribute('data-variant', 'disabled');
  });

  test('given canProceed true then next button is enabled', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={true}
      />
    );

    // Then
    const nextButton = screen.getByRole('button', { name: SIMULATION_SETUP_STRINGS.NEXT_BUTTON });
    expect(nextButton).toHaveAttribute('data-variant', 'filled');
  });

  test('given user clicks next button when canProceed true then calls onNext', async () => {
    // Given
    const user = userEvent.setup();

    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={true}
      />
    );

    // When
    const nextButton = screen.getByRole('button', { name: SIMULATION_SETUP_STRINGS.NEXT_BUTTON });
    await user.click(nextButton);

    // Then
    expect(mockOnNext).toHaveBeenCalledTimes(1);
  });

  test('given user clicks cancel button then calls useCancelFlow hook', async () => {
    // Given
    const user = userEvent.setup();

    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />
    );

    // When
    const cancelButton = screen.getByRole('button', { name: SIMULATION_SETUP_STRINGS.CANCEL_BUTTON });
    await user.click(cancelButton);

    // Then
    expect(mockHandleCancel).toHaveBeenCalledTimes(1);
  });

  test('given component renders then useCancelFlow called with simulation', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />
    );

    // Then
    expect(useCancelFlow).toHaveBeenCalledWith('simulation');
  });

  test('given created policy then shows selected policy card', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />,
      { policy: mockPolicyState }
    );

    // Then
    expect(screen.getAllByText(SIMULATION_SETUP_STRINGS.TEST_POLICY_LABEL).length).toBeGreaterThan(0);
  });

  test('given created population then shows selected population card', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />,
      { population: mockPopulationState }
    );

    // Then
    expect(screen.getAllByText(SIMULATION_SETUP_STRINGS.TEST_POPULATION_LABEL).length).toBeGreaterThan(0);
  });

  test('given component renders then displays cancel button', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />
    );

    // Then
    expect(screen.getByRole('button', { name: SIMULATION_SETUP_STRINGS.CANCEL_BUTTON })).toBeInTheDocument();
  });

  test('given component renders then displays next button', () => {
    // Given/When
    renderWithStore(
      <SimulationSetupView
        onPolicySelect={mockOnPolicySelect}
        onPopulationSelect={mockOnPopulationSelect}
        onNext={mockOnNext}
        canProceed={false}
      />
    );

    // Then
    expect(screen.getByRole('button', { name: SIMULATION_SETUP_STRINGS.NEXT_BUTTON })).toBeInTheDocument();
  });
});
