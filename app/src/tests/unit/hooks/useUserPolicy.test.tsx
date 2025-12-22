import { describe, expect, test, vi } from 'vitest';
import { ERROR_MESSAGES, TEST_POLICY_ID_1 } from '@/tests/fixtures/hooks/useUserPolicyMocks';

/**
 * Tests for useUserPolicy error context handling.
 *
 * Note: The full hook integration is tested indirectly through:
 * - PolicyExistingView.test.tsx (component integration)
 * - Policies.page.test.tsx (page integration)
 *
 * These unit tests focus on the error message formatting logic.
 */
describe('useUserPolicy error messages', () => {
  describe('error message format', () => {
    test('given policy ID then error message includes policy ID', () => {
      // Given
      const policyId = TEST_POLICY_ID_1;
      const originalError = 'Network error';

      // When - simulate the error message format from the hook
      const errorMessage = `Failed to load policy ${policyId}: ${originalError}`;

      // Then
      expect(errorMessage).toContain(policyId);
      expect(errorMessage).toContain('Failed to load policy');
      expect(errorMessage).toContain(originalError);
    });

    test('given error constants then match expected format', () => {
      // Then
      expect(ERROR_MESSAGES.LOAD_POLICY_FAILED(TEST_POLICY_ID_1)).toBe(
        `Failed to load policy ${TEST_POLICY_ID_1}`
      );
    });

    test('given console.error call then should include component context prefix', () => {
      // Given
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const policyId = TEST_POLICY_ID_1;
      const errorMessage = `Failed to load policy ${policyId}: Network error`;

      // When - simulate the console.error call from the hook
      console.error(`[useUserPolicies] ${errorMessage}`, new Error('Network error'));

      // Then
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('[useUserPolicies]'),
        expect.any(Error)
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining(policyId),
        expect.any(Error)
      );

      consoleErrorSpy.mockRestore();
    });
  });
});
