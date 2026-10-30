import { describe, expect, test } from 'vitest';
import { UPGRADE_FAILURE_MESSAGE, UPGRADE_SUCCESS_MESSAGE } from '@/libs/auth/accountUpgrade';

describe('account upgrade notices', () => {
  // A browser's saved work moves to the account however it was saved, and a
  // browser can have saved only the households it calculated.
  test('given a browser that saved only households then the sign-in notices name no reforms or reports', () => {
    expect([UPGRADE_SUCCESS_MESSAGE, UPGRADE_FAILURE_MESSAGE]).toEqual([
      expect.not.stringMatching(/reform|report/i),
      expect.not.stringMatching(/reform|report/i),
    ]);
  });
});
