import { describe, expect, it } from 'vitest';
import { mockCalcError } from '@/tests/fixtures/types/calculationFixtures';
import { CalcError } from '@/types/calculation';

describe('CalcError types', () => {
  it('should include error code', () => {
    const error: CalcError = mockCalcError({ code: 'TIMEOUT' });

    expect(error.code).toBe('TIMEOUT');
  });

  it('should include error message', () => {
    const error = mockCalcError({ message: 'Network request timed out' });

    expect(error.message).toBe('Network request timed out');
  });

  it('should indicate if error is retryable', () => {
    const retryable = mockCalcError({ retryable: true });
    const notRetryable = mockCalcError({ retryable: false });

    expect(retryable.retryable).toBe(true);
    expect(notRetryable.retryable).toBe(false);
  });

  describe('common error scenarios', () => {
    it('should handle timeout errors', () => {
      const error = mockCalcError({
        code: 'TIMEOUT',
        message: 'Calculation timed out after 5 minutes',
        retryable: true,
      });

      expect(error.code).toBe('TIMEOUT');
      expect(error.retryable).toBe(true);
    });

    it('should handle API errors', () => {
      const error = mockCalcError({
        code: 'API_ERROR',
        message: 'API returned 500 Internal Server Error',
        retryable: true,
      });

      expect(error.code).toBe('API_ERROR');
      expect(error.retryable).toBe(true);
    });

    it('should handle validation errors', () => {
      const error = mockCalcError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid policy parameters',
        retryable: false,
      });

      expect(error.code).toBe('VALIDATION_ERROR');
      expect(error.retryable).toBe(false);
    });

    it('should handle network errors', () => {
      const error = mockCalcError({
        code: 'NETWORK_ERROR',
        message: 'Failed to fetch',
        retryable: true,
      });

      expect(error.code).toBe('NETWORK_ERROR');
      expect(error.retryable).toBe(true);
    });
  });
});
