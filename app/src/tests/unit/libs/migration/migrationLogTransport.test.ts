import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { sendMigrationLog } from '@/libs/migration/migrationLogTransport';
import type { MigrationRemoteLogPayload } from '@/libs/migration/migrationLogTypes';

const TEST_PAYLOAD: MigrationRemoteLogPayload = {
  kind: 'comparison',
  prefix: 'PolicyMigration',
  operation: 'CREATE',
  status: 'MATCH',
  compared: 1,
  matches: 1,
  mismatches: 0,
  skipped: 0,
  detailCount: 1,
  details: [
    {
      field: 'label',
      status: 'MATCH',
      v1: '"My reform"',
      v2: '"My reform"',
    },
  ],
  ts: '2026-04-08T12:00:00.000Z',
};

describe('migrationLogTransport', () => {
  const originalSendBeacon = navigator.sendBeacon;
  let fetchMock: ReturnType<typeof vi.fn>;
  let sendBeaconMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_ENABLE_VERCEL_MIGRATION_LOGS', 'true');
    fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    sendBeaconMock = vi.fn().mockReturnValue(true);
    vi.stubGlobal('fetch', fetchMock);
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: sendBeaconMock,
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    Object.defineProperty(navigator, 'sendBeacon', {
      configurable: true,
      value: originalSendBeacon,
    });
  });

  test('given remote logging disabled then does not ship payload', () => {
    vi.stubEnv('VITE_ENABLE_VERCEL_MIGRATION_LOGS', 'false');

    sendMigrationLog(TEST_PAYLOAD);

    expect(sendBeaconMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('given sendBeacon support then ships payload with browser context', async () => {
    sendMigrationLog(TEST_PAYLOAD);

    expect(sendBeaconMock).toHaveBeenCalledWith('/api/migration-log', expect.any(String));
    expect(fetchMock).not.toHaveBeenCalled();

    const body = JSON.parse(sendBeaconMock.mock.calls[0][1] as string);

    expect(body).toEqual(
      expect.objectContaining({
        kind: 'comparison',
        prefix: 'PolicyMigration',
        pathname: window.location.pathname,
        href: window.location.href,
      })
    );
  });

  test('given sendBeacon rejection then falls back to fetch keepalive', async () => {
    sendBeaconMock.mockReturnValue(false);

    sendMigrationLog(TEST_PAYLOAD);

    expect(fetchMock).toHaveBeenCalledWith('/api/migration-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: expect.any(String),
      keepalive: true,
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);
    expect(body).toEqual(expect.objectContaining({ kind: 'comparison' }));
  });

  test('given oversized comparison details then truncates payload before sending', async () => {
    sendBeaconMock.mockReturnValue(false);

    sendMigrationLog({
      ...TEST_PAYLOAD,
      detailCount: 100,
      details: Array.from({ length: 100 }, (_, index) => ({
        field: `field-${index}`,
        status: 'MISMATCH' as const,
        v1: 'x'.repeat(1000),
        v2: 'y'.repeat(1000),
      })),
    });

    const body = JSON.parse(fetchMock.mock.calls[0][1].body as string);

    expect(body.details.length).toBeLessThan(100);
    expect(body.truncatedDetailCount).toBeGreaterThan(0);
    expect(body.details[0].v1.length).toBeLessThanOrEqual(500);
    expect(body.details[0].v2.length).toBeLessThanOrEqual(500);
  });
});
