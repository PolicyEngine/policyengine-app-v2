import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import BreakdownComputePanel, {
  BreakdownComputeButton,
} from '@/components/flagship/report/BreakdownComputePanel';
import {
  COMPUTING_DETAIL,
  FAILURE_REASON,
  panelProps,
  PARTIAL_SUMMARY,
  TEST_COPY,
} from '@/tests/fixtures/components/flagship/report/breakdownComputePanelMocks';

describe('BreakdownComputePanel', () => {
  test('given an idle run then it gives the intro and offers to compute', async () => {
    // Given
    const user = userEvent.setup();
    const props = panelProps();
    render(<BreakdownComputePanel {...props} />);

    // When
    await user.click(screen.getByRole('button', { name: TEST_COPY.computeLabel }));

    // Then
    expect(screen.getByText(TEST_COPY.intro)).toBeInTheDocument();
    expect(props.onStart).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  test('given a run that cannot start yet then the button is disabled', () => {
    // When
    render(<BreakdownComputePanel {...panelProps({ canStart: false })} />);

    // Then
    expect(screen.getByRole('button', { name: TEST_COPY.computeLabel })).toBeDisabled();
  });

  test('given the start button placed elsewhere then the idle panel has no button', () => {
    // When
    render(<BreakdownComputePanel {...panelProps({ showStartButton: false })} />);

    // Then
    expect(screen.queryByRole('button', { name: TEST_COPY.computeLabel })).not.toBeInTheDocument();
  });

  test('given a computing run then it shows the message, the bar and the detail', () => {
    // When
    render(
      <BreakdownComputePanel
        {...panelProps({ status: 'computing', progress: 42.4, detail: COMPUTING_DETAIL })}
      />
    );

    // Then
    expect(screen.getByText(TEST_COPY.computingMessage)).toBeInTheDocument();
    expect(
      screen.getByRole('progressbar', { name: `${TEST_COPY.progressLabel}, about 42%` })
    ).toBeInTheDocument();
    expect(screen.getByText(COMPUTING_DETAIL)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: TEST_COPY.computeLabel })).not.toBeInTheDocument();
  });

  test('given a run that is partly in then it gives the summary and the reason, with Retry and no bar', async () => {
    // Given
    const user = userEvent.setup();
    const props = panelProps({
      status: 'partial',
      summary: PARTIAL_SUMMARY,
      reason: FAILURE_REASON,
    });
    render(<BreakdownComputePanel {...props} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    // Then
    expect(screen.getByText(PARTIAL_SUMMARY)).toBeInTheDocument();
    expect(screen.getByText(FAILURE_REASON)).toBeInTheDocument();
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  test('given a run that is partly in and cannot be retried then it offers no Retry', () => {
    // When
    render(
      <BreakdownComputePanel
        {...panelProps({
          status: 'partial',
          summary: PARTIAL_SUMMARY,
          reason: FAILURE_REASON,
          onRetry: undefined,
        })}
      />
    );

    // Then
    expect(screen.getByText(PARTIAL_SUMMARY)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
  });

  test('given a failed run then it says so, gives the reason and offers Retry', async () => {
    // Given
    const user = userEvent.setup();
    const props = panelProps({ status: 'error', reason: FAILURE_REASON });
    render(<BreakdownComputePanel {...props} />);

    // When
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent(TEST_COPY.errorMessage);
    expect(screen.getByText(FAILURE_REASON)).toBeInTheDocument();
    expect(props.onRetry).toHaveBeenCalledTimes(1);
  });

  test('given a complete run then the panel shows nothing', () => {
    // When
    const { container } = render(<BreakdownComputePanel {...panelProps({ status: 'complete' })} />);

    // Then
    expect(container).toBeEmptyDOMElement();
  });
});

describe('BreakdownComputeButton', () => {
  test.each(['computing', 'partial', 'error', 'complete'] as const)(
    'given a %s run then there is no button',
    (status) => {
      // When
      render(<BreakdownComputeButton {...panelProps({ status })} />);

      // Then
      expect(
        screen.queryByRole('button', { name: TEST_COPY.computeLabel })
      ).not.toBeInTheDocument();
    }
  );
});
