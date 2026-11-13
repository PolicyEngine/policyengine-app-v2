import { beforeAll, beforeEach, describe, expect, test, vi } from 'vitest';
import { journeyProfiler } from '@/utils/journeyProfiler';

const pageFetch = vi.fn(async () => Response.json({ status: 'ok', message: null, result: {} }));

function recordedPublicApiCalls(): string[] {
  return journeyProfiler
    .getSummary()
    .filter((entry) => entry.category === 'api-call')
    .map((entry) => entry.name);
}

beforeAll(() => {
  // The profiler wraps whatever fetch the page has when it starts.
  window.fetch = pageFetch as typeof window.fetch;
  journeyProfiler.init();
});

beforeEach(() => {
  pageFetch.mockClear();
  journeyProfiler.reset();
});

describe('journeyProfiler', () => {
  test("given a request to the calculator's Public API route by path then it records the call and sends it", async () => {
    // When
    const response = await window.fetch('/api/policyengine/us/metadata');

    // Then
    expect(response.ok).toBe(true);
    expect(pageFetch).toHaveBeenCalledTimes(1);
    expect(recordedPublicApiCalls()).toEqual(['GET /api/policyengine/us/metadata']);
  });

  test("given a Request for the route on the page's origin then it records the call", async () => {
    // When
    await window.fetch(
      new Request(`${window.location.origin}/api/policyengine/v2/model-catalog?country_id=us`)
    );

    // Then
    expect(pageFetch).toHaveBeenCalledTimes(1);
    expect(recordedPublicApiCalls()).toEqual(['GET /api/policyengine/v2/model-catalog']);
  });

  test("given a request to another of the calculator's routes then it sends it without recording it", async () => {
    // When
    await window.fetch('/api/calibration-targets', { method: 'POST' });

    // Then
    expect(pageFetch).toHaveBeenCalledTimes(1);
    expect(recordedPublicApiCalls()).toEqual([]);
  });
});
