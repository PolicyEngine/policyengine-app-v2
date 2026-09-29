// @vitest-environment node
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { CTC_PATH, scorecardClaim } from '@/tests/fixtures/libs/flagship/scorecardComparisonMocks';

beforeEach(() => {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL', 'true');
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
const request = (body: unknown) =>
  new Request('http://localhost/api/scorecard-comparisons', {
    method: 'POST',
    body: JSON.stringify(body),
  });

describe('published scorecard route', () => {
  test('given published claims then matches the source line item, strips history and preserves caveats', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        Response.json({
          built: '2026-08-29',
          rows: [
            scorecardClaim(),
            scorecardClaim({ claim_id: 'tips', name: 'No tax on tips', latest: null }),
          ],
        })
      )
    );
    const { POST } =
      await import('../../../../../calculator-app/src/app/api/scorecard-comparisons/route');
    const response = await POST(request({ country: 'us', paths: [CTC_PATH] }));
    const data = await response.json();
    expect(data.rows).toHaveLength(1);
    expect(data.rows[0].latest.annotations).toContain('Different stacking baseline');
    expect(data.rows[0].period).toBe(2026);
    expect(data.rows[0].unit_concept).toBe('usd');
    expect(data.rows[0].results).toBeUndefined();
  });
  test('given an unavailable feed then responds with an error rather than empty evidence', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));
    const { POST } =
      await import('../../../../../calculator-app/src/app/api/scorecard-comparisons/route');
    expect((await POST(request({ country: 'us', paths: [CTC_PATH] }))).status).toBe(502);
  });
  test('given the flagship is disabled then does not fetch external data', async () => {
    vi.stubEnv('NEXT_PUBLIC_FLAGSHIP_SHELL', '');
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const { POST } =
      await import('../../../../../calculator-app/src/app/api/scorecard-comparisons/route');
    expect((await POST(request({ country: 'us', paths: [CTC_PATH] }))).status).toBe(404);
    expect(fetch).not.toHaveBeenCalled();
  });
});
