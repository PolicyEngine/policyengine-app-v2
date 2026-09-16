import { afterEach, describe, expect, test, vi } from 'vitest';
import { fetchHouseholdCalculationWithBundle } from '@/api/householdCalculation';
import { householdAPIError } from '@/api/householdError';
import { fetchHouseholdVariationWithProvenance } from '@/api/householdVariation';
import { householdErrorResponse } from '@/tests/fixtures/api/householdErrorMocks';
import {
  CORRECTIVE_SPM_ERRORS,
  OTHER_CALCULATION_ERROR,
} from '@/tests/fixtures/spm/reportErrorMocks';
import { NATIONAL_SPM, stateOnlyHousehold } from '@/tests/fixtures/spm/spmMocks';

afterEach(() => vi.unstubAllGlobals());

describe('household API error fallback', () => {
  test.each(['{', 'Service unavailable', 'null'])(
    'given an unusable response body %s then returns the caller fallback as retryable',
    async (body) => {
      const error = await householdAPIError(
        new Response(body, { status: 500 }),
        OTHER_CALCULATION_ERROR
      );

      expect(error).toMatchObject({ message: OTHER_CALCULATION_ERROR, retryable: true });
      expect(error.code).toBeUndefined();
    }
  );
});

describe.each([
  ['point', () => fetchHouseholdCalculationWithBundle('us', 'saved-household', 'policy')],
  [
    'variation',
    () =>
      fetchHouseholdVariationWithProvenance(
        'us',
        stateOnlyHousehold().toV1CreationPayload().data,
        {},
        NATIONAL_SPM
      ),
  ],
] as const)('%s calculation errors', (_name, calculate) => {
  describe.each([400, 200])('HTTP %s', (status) => {
    test.each(CORRECTIVE_SPM_ERRORS)(
      'given $code in the API envelope then preserves its code and message without retrying',
      async (detail) => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue(householdErrorResponse(detail, status)));

        await expect(calculate()).rejects.toMatchObject({ ...detail, retryable: false });
      }
    );
  });

  test.each(['message', 'error'])(
    'given HTTP 200 status:error with a legacy %s then retains its message as retryable',
    async (field) => {
      vi.stubGlobal(
        'fetch',
        vi
          .fn()
          .mockResolvedValue(
            new Response(
              JSON.stringify({ status: 'error', result: null, [field]: OTHER_CALCULATION_ERROR })
            )
          )
      );

      await expect(calculate()).rejects.toMatchObject({
        message: OTHER_CALCULATION_ERROR,
        retryable: true,
      });
    }
  );
});
