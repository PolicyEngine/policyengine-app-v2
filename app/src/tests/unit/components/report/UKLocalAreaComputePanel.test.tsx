import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import UKLocalAreaComputePanel, {
  UKLocalAreaComputeButton,
} from '@/components/report/UKLocalAreaComputePanel';
import {
  COMPLETE_STATE,
  COMPUTE_BUTTON_LABEL,
  COMPUTING_MESSAGE,
  ERROR_MESSAGE,
  ERROR_STATE,
  IDLE_STATE,
  LOADING_DATA_STATE,
  QUEUED_STATE,
} from '@/tests/fixtures/components/report/UKLocalAreaComputePanelMocks';

describe('UKLocalAreaComputePanel', () => {
  test('given an idle breakdown then it offers to compute the local-area impacts', () => {
    // When
    render(<UKLocalAreaComputePanel breakdown={IDLE_STATE()} />, 'uk');

    // Then
    expect(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL })).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('given the compute button clicked then it starts the breakdown', async () => {
    // Given
    const user = userEvent.setup();
    const breakdown = IDLE_STATE();
    render(<UKLocalAreaComputePanel breakdown={breakdown} />, 'uk');

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    expect(breakdown.start).toHaveBeenCalledTimes(1);
  });

  test('given the start button placed elsewhere then the idle panel has no button', () => {
    // When
    render(<UKLocalAreaComputePanel breakdown={IDLE_STATE()} showStartButton={false} />, 'uk');

    // Then
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
  });

  test('given a queued breakdown then it shows the message, a progress bar and the queue position', () => {
    // When
    render(<UKLocalAreaComputePanel breakdown={QUEUED_STATE()} />, 'uk');

    // Then
    expect(screen.getByText(COMPUTING_MESSAGE)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByText('In queue (position 4)')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
  });

  test('given a breakdown loading its data then it names the stage', () => {
    // When
    render(<UKLocalAreaComputePanel breakdown={LOADING_DATA_STATE()} />, 'uk');

    // Then
    expect(screen.getByText(COMPUTING_MESSAGE)).toBeInTheDocument();
    expect(screen.getByText('Loading the data')).toBeInTheDocument();
  });

  test('given a failed breakdown then it says so and offers retry', async () => {
    // Given
    const user = userEvent.setup();
    const breakdown = ERROR_STATE();
    render(<UKLocalAreaComputePanel breakdown={breakdown} />, 'uk');

    // When
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    // Then
    expect(screen.getByText(ERROR_MESSAGE)).toBeInTheDocument();
    expect(breakdown.retry).toHaveBeenCalledTimes(1);
  });

  test('given a failed breakdown with a reason then it gives the reason', () => {
    // When
    render(<UKLocalAreaComputePanel breakdown={ERROR_STATE()} />, 'uk');

    // Then
    expect(screen.getByText(ERROR_STATE().error!)).toBeInTheDocument();
  });

  test('given a complete breakdown then the panel shows nothing', () => {
    // When
    const { container } = render(<UKLocalAreaComputePanel breakdown={COMPLETE_STATE()} />, 'uk');

    // Then
    expect(container).toBeEmptyDOMElement();
  });
});

describe('UKLocalAreaComputeButton', () => {
  test('given an idle breakdown then the button starts it', async () => {
    // Given
    const user = userEvent.setup();
    const breakdown = IDLE_STATE();
    render(<UKLocalAreaComputeButton breakdown={breakdown} />, 'uk');

    // When
    await user.click(screen.getByRole('button', { name: COMPUTE_BUTTON_LABEL }));

    // Then
    expect(breakdown.start).toHaveBeenCalledTimes(1);
  });

  test.each([
    ['computing', QUEUED_STATE],
    ['failed', ERROR_STATE],
    ['complete', COMPLETE_STATE],
  ])('given a %s breakdown then there is no button', (_label, state) => {
    // When
    render(<UKLocalAreaComputeButton breakdown={state()} />, 'uk');

    // Then
    expect(screen.queryByRole('button', { name: COMPUTE_BUTTON_LABEL })).not.toBeInTheDocument();
  });
});
