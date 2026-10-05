import { describe, expect, test } from 'vitest';
import { describeCalculationError } from '@/libs/flagship/calculationError';

const SERVER_FAILURE =
  'Society-wide calculation failed (502): {"status": "error", "message": "Simulation entrypoint execution failed: Simulation failed (correlation_id=311da50645a847c59ed077ca60f15279)", "result": null}';

describe('describeCalculationError', () => {
  test('given a server failure then it says so plainly, offers a retry, and keeps the reference', () => {
    const summary = describeCalculationError(SERVER_FAILURE);

    expect(summary.title).toBe('The simulation did not finish');
    expect(summary.body).not.toContain('{');
    expect(summary.retryable).toBe(true);
    expect(summary.reference).toBe('311da50645a847c59ed077ca60f15279');
    expect(summary.detail).toBe(SERVER_FAILURE);
  });

  test('given a rejected request then it passes on the API message and points back to the reform', () => {
    const summary = describeCalculationError(
      'Society-wide calculation failed (400): {"status": "error", "message": "Unknown parameter gov.x"}'
    );

    expect(summary.retryable).toBe(false);
    expect(summary.body).toContain('Unknown parameter gov.x');
  });

  test('given a timeout then it suggests a second try', () => {
    expect(describeCalculationError('Request timed out after 300s').title).toBe(
      'The calculation took too long'
    );
  });

  test('given no message then it still reads as a sentence', () => {
    const summary = describeCalculationError(undefined);

    expect(summary.title).toBe('Something went wrong with this report');
    expect(summary.reference).toBeNull();
  });
});
