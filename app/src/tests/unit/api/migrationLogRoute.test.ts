import { beforeEach, describe, expect, test, vi } from 'vitest';
import type { MigrationRemoteLogPayload } from '@/libs/migration/migrationLogTypes';
import handler from '../../../../../api/migration-log';

const TEST_PAYLOAD: MigrationRemoteLogPayload = {
  kind: 'event',
  prefix: 'PolicyMigration',
  operation: 'CREATE',
  status: 'FAILED',
  message: 'Shadow v2 policy create failed (non-blocking)',
  metadata: {
    policyId: 'policy-123',
    countryId: 'us',
  },
  ts: '2026-04-08T12:00:00.000Z',
};

describe('migration log route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given valid post payload then logs and returns no content', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    const response = await handler(
      new Request('https://policyengine.org/api/migration-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(TEST_PAYLOAD),
      })
    );

    expect(response.status).toBe(204);
    expect(logSpy).toHaveBeenCalledWith(expect.stringContaining('[MigrationRemoteLog]'));
  });

  test('given non-post request then returns method not allowed', async () => {
    const response = await handler(
      new Request('https://policyengine.org/api/migration-log', {
        method: 'GET',
      })
    );

    expect(response.status).toBe(405);
    expect(response.headers.get('Allow')).toBe('POST');
  });

  test('given invalid payload then returns bad request', async () => {
    const response = await handler(
      new Request('https://policyengine.org/api/migration-log', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invalid: true }),
      })
    );

    expect(response.status).toBe(400);
  });
});
