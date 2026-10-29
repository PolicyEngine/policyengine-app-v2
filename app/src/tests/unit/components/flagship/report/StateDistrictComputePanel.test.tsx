import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import StateDistrictComputePanel from '@/components/flagship/report/StateDistrictComputePanel';
import {
  ALL_FAILED_RUNS,
  CHECKING_DISTRICTS_LABEL,
  CHECKING_RUNS,
  COMPLETE_RUNS,
  COMPUTE_DISTRICTS_LABEL,
  COMPUTING_DISTRICTS_MESSAGE,
  DISTRICTS_ERROR_MESSAGE,
  FAILED_STATES_RUNS,
  MANY_FAILED_RUNS,
  NO_DISTRICTS_RUNS,
  NONE_COMPUTED_INTRO,
  NONE_COMPUTED_RUNS,
  NOT_READY_RUNS,
  RUN_FAILURE,
  RUNNING_RUNS,
  SOME_SAVED_RUNS,
} from '@/tests/fixtures/components/flagship/report/stateDistrictComputePanelMocks';

describe('StateDistrictComputePanel', () => {
  test('given the saved results still being checked then it shows a spinner and no button', () => {
    // When
    render(<StateDistrictComputePanel runs={CHECKING_RUNS()} />);

    // Then
    expect(screen.getByRole('status', { name: CHECKING_DISTRICTS_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_DISTRICTS_LABEL })).not.toBeInTheDocument();
  });

  test('given no state computed then it explains the runs and Compute starts them', async () => {
    // Given
    const user = userEvent.setup();
    const runs = NONE_COMPUTED_RUNS();
    render(<StateDistrictComputePanel runs={runs} />);

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_DISTRICTS_LABEL }));

    // Then
    expect(screen.getByText(NONE_COMPUTED_INTRO)).toBeInTheDocument();
    expect(runs.start).toHaveBeenCalledTimes(1);
  });

  test('given some states saved then it says how many and offers Compute for the rest', () => {
    // When
    render(<StateDistrictComputePanel runs={SOME_SAVED_RUNS()} />);

    // Then
    expect(
      screen.getByText(
        '12 of 51 states are saved. Compute the other 39 to fill in the map; they take a few minutes.'
      )
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: COMPUTE_DISTRICTS_LABEL })).toBeEnabled();
  });

  test('given the report’s policies not known yet then Compute is disabled', () => {
    // When
    render(<StateDistrictComputePanel runs={NOT_READY_RUNS()} />);

    // Then
    expect(screen.getByRole('button', { name: COMPUTE_DISTRICTS_LABEL })).toBeDisabled();
  });

  test('given states running then it shows the bar and how many states are in', () => {
    // When
    render(<StateDistrictComputePanel runs={RUNNING_RUNS()} />);

    // Then
    expect(screen.getByText(COMPUTING_DISTRICTS_MESSAGE)).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: 'Computing district impacts, about 40%' })
    ).toBeInTheDocument();
    expect(screen.getByText('12 of 51 states')).toBeInTheDocument();
  });

  test('given failed states then it names them, gives the reason and offers Retry', async () => {
    // Given
    const user = userEvent.setup();
    const runs = FAILED_STATES_RUNS();
    render(<StateDistrictComputePanel runs={runs} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    // Then
    expect(screen.getByText('49 of 51 states are in.')).toBeInTheDocument();
    expect(
      screen.getByText(`Texas and Utah could not be calculated: ${RUN_FAILURE}`)
    ).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(runs.retry).toHaveBeenCalledTimes(1);
  });

  test('given only a state whose result has no districts then it names it with no Retry', () => {
    // When
    render(<StateDistrictComputePanel runs={NO_DISTRICTS_RUNS()} />);

    // Then
    expect(screen.getByText(/^Ohio could not be calculated/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  test('given many failed states then it names a few and counts the others', () => {
    // When
    render(<StateDistrictComputePanel runs={MANY_FAILED_RUNS()} />);

    // Then
    expect(
      screen.getByText(
        `Alabama, Alaska, Arizona, Arkansas, Colorado and 2 other states could not be calculated: ${RUN_FAILURE}`
      )
    ).toBeInTheDocument();
  });

  test('given every state failed then it says so with the reason and Retry', () => {
    // When
    render(<StateDistrictComputePanel runs={ALL_FAILED_RUNS()} />);

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent(DISTRICTS_ERROR_MESSAGE);
    expect(screen.getByText(RUN_FAILURE)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });

  test('given every state in then the panel shows nothing', () => {
    // When
    const { container } = render(<StateDistrictComputePanel runs={COMPLETE_RUNS()} />);

    // Then
    expect(container).toBeEmptyDOMElement();
  });
});
