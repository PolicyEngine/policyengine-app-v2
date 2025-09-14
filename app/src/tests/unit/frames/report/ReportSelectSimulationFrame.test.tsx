import { render, screen, userEvent } from '@test-utils';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import ReportSelectSimulationFrame from '@/frames/report/ReportSelectSimulationFrame';
import {
  CREATE_NEW_ACTION,
  CREATE_NEW_SIMULATION_DESCRIPTION,
  CREATE_NEW_SIMULATION_TITLE,
  LOAD_EXISTING_ACTION,
  LOAD_EXISTING_SIMULATION_DESCRIPTION,
  LOAD_EXISTING_SIMULATION_TITLE,
  NEXT_BUTTON_LABEL,
  SELECT_SIMULATION_FRAME_TITLE,
} from '@/tests/fixtures/frames/ReportSelectSimulationFrame';

describe('ReportSelectSimulationFrame', () => {
  let mockOnNavigate: ReturnType<typeof vi.fn>;
  let mockOnReturn: ReturnType<typeof vi.fn>;
  let defaultFlowProps: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockOnNavigate = vi.fn();
    mockOnReturn = vi.fn();

    // Default flow props to satisfy FlowComponentProps interface
    defaultFlowProps = {
      onNavigate: mockOnNavigate,
      onReturn: mockOnReturn,
      flowConfig: {
        component: 'ReportSelectSimulationFrame',
        on: {
          createNew: {
            flow: 'SimulationCreationFlow',
            returnTo: 'ReportSetupFrame',
          },
          loadExisting: 'ReportSelectExistingSimulationFrame',
        },
      },
      isInSubflow: false,
      flowDepth: 0,
    };
  });

  test('given component renders then displays title and both options', () => {
    // Given/When
    render(<ReportSelectSimulationFrame {...defaultFlowProps} />);

    // Then
    expect(screen.getByRole('heading', { name: SELECT_SIMULATION_FRAME_TITLE })).toBeInTheDocument();
    expect(screen.getByText(LOAD_EXISTING_SIMULATION_TITLE)).toBeInTheDocument();
    expect(screen.getByText(LOAD_EXISTING_SIMULATION_DESCRIPTION)).toBeInTheDocument();
    expect(screen.getByText(CREATE_NEW_SIMULATION_TITLE)).toBeInTheDocument();
    expect(screen.getByText(CREATE_NEW_SIMULATION_DESCRIPTION)).toBeInTheDocument();
  });

  test('given no selection then Next button is disabled', () => {
    // Given/When
    render(<ReportSelectSimulationFrame {...defaultFlowProps} />);

    // Then
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).toBeDisabled();
  });

  test('given user clicks load existing option then option is selected', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportSelectSimulationFrame {...defaultFlowProps} />);

    // When
    const loadExistingCard = screen.getByText(LOAD_EXISTING_SIMULATION_TITLE).closest('button');
    await user.click(loadExistingCard!);

    // Then - Next button should be enabled
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).not.toBeDisabled();
  });

  test('given user clicks create new option then option is selected', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportSelectSimulationFrame {...defaultFlowProps} />);

    // When
    const createNewCard = screen.getByText(CREATE_NEW_SIMULATION_TITLE).closest('button');
    await user.click(createNewCard!);

    // Then - Next button should be enabled
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    expect(nextButton).not.toBeDisabled();
  });

  test('given load existing selected and Next clicked then navigates to loadExisting', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportSelectSimulationFrame {...defaultFlowProps} />);

    // When
    const loadExistingCard = screen.getByText(LOAD_EXISTING_SIMULATION_TITLE).closest('button');
    await user.click(loadExistingCard!);

    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    await user.click(nextButton);

    // Then
    expect(mockOnNavigate).toHaveBeenCalledWith(LOAD_EXISTING_ACTION);
  });

  test('given create new selected and Next clicked then navigates to createNew', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportSelectSimulationFrame {...defaultFlowProps} />);

    // When
    const createNewCard = screen.getByText(CREATE_NEW_SIMULATION_TITLE).closest('button');
    await user.click(createNewCard!);

    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    await user.click(nextButton);

    // Then
    expect(mockOnNavigate).toHaveBeenCalledWith(CREATE_NEW_ACTION);
  });

  test('given user switches selection then updates selected option', async () => {
    // Given
    const user = userEvent.setup();
    render(<ReportSelectSimulationFrame {...defaultFlowProps} />);

    // When - first select load existing
    const loadExistingCard = screen.getByText(LOAD_EXISTING_SIMULATION_TITLE).closest('button');
    await user.click(loadExistingCard!);

    // Then switch to create new
    const createNewCard = screen.getByText(CREATE_NEW_SIMULATION_TITLE).closest('button');
    await user.click(createNewCard!);

    // When clicking Next
    const nextButton = screen.getByRole('button', { name: NEXT_BUTTON_LABEL });
    await user.click(nextButton);

    // Then - should navigate to the last selected option
    expect(mockOnNavigate).toHaveBeenCalledWith(CREATE_NEW_ACTION);
    expect(mockOnNavigate).not.toHaveBeenCalledWith(LOAD_EXISTING_ACTION);
  });
});