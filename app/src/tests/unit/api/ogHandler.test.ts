import type { VercelRequest, VercelResponse } from '@vercel/node';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import handler, { findPostBySlug } from '../../../../api/og';

// Mock posts data
const mockPosts = [
  {
    title: 'Analysing alternative income tax and National Insurance reform options for the UK',
    description: 'PolicyEngine analysis of alternative tax reform options.',
    filename: 'uk-income-tax-ni-reforms-2025.md',
    image: 'uk-income-tax-ni-reforms-2025.jpg',
  },
  {
    title: 'PolicyEngine London event 2025',
    description: 'PolicyEngine hosted an event in London.',
    filename: 'policyengine-2-event-report.md',
    image: 'policyengine-2-event-report.jpeg',
  },
];

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock response object
function createMockResponse() {
  const res = {
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    setHeader: vi.fn().mockReturnThis(),
  } as unknown as VercelResponse;
  return res;
}

// Mock request object
function createMockRequest(query: Record<string, string | string[]>): VercelRequest {
  return {
    query,
  } as unknown as VercelRequest;
}

describe('og handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockPosts),
    });
  });

  describe('findPostBySlug', () => {
    test('given valid slug then returns matching post', async () => {
      // When
      const post = await findPostBySlug('uk-income-tax-ni-reforms-2025');

      // Then
      expect(post).toBeDefined();
      expect(post?.title).toContain('income tax');
    });

    test('given non-existent slug then returns undefined', async () => {
      // When
      const post = await findPostBySlug('non-existent-post-slug');

      // Then
      expect(post).toBeUndefined();
    });
  });

  describe('handler', () => {
    test('given homepage path then returns default OG tags', async () => {
      // Given
      const req = createMockRequest({ path: '' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      expect(res.send).toHaveBeenCalled();
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="PolicyEngine"');
    });

    test('given country homepage path then returns country OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'uk' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      expect(res.status).toHaveBeenCalledWith(200);
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="PolicyEngine UK"');
    });

    test('given US country path then returns US OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'us' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="PolicyEngine US"');
    });

    test('given research page path then returns research OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'uk/research' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="Research"');
    });

    test('given team page path then returns team OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'us/team' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="Our Team"');
    });

    test('given donate page path then returns donate OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'uk/donate' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="Donate"');
    });

    test('given supporters page path then returns supporters OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'us/supporters' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="Our Supporters"');
    });

    test('given valid blog post path then returns post OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'uk/research/uk-income-tax-ni-reforms-2025' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('income tax');
      expect(html).toContain('og:type" content="article"');
    });

    test('given blog post path then includes post image', async () => {
      // Given
      const req = createMockRequest({ path: 'uk/research/uk-income-tax-ni-reforms-2025' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('/assets/posts/');
    });

    test('given non-existent blog post then returns default OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'uk/research/non-existent-post' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="PolicyEngine"');
    });

    test('given unknown page path then returns default OG tags', async () => {
      // Given
      const req = createMockRequest({ path: 'us/unknown-section/something' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="PolicyEngine"');
    });

    test('given path array then joins correctly', async () => {
      // Given
      const req = createMockRequest({ path: ['uk', 'research'] });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="Research"');
    });

    test('given valid request then sets cache headers', async () => {
      // Given
      const req = createMockRequest({ path: 'uk' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'public, max-age=3600');
    });

    test('given blog post then includes correct URL in og:url', async () => {
      // Given
      const req = createMockRequest({ path: 'uk/research/uk-income-tax-ni-reforms-2025' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain(
        'og:url" content="https://policyengine.org/uk/research/uk-income-tax-ni-reforms-2025"'
      );
    });

    test('given fetch failure then still returns default OG for blog post', async () => {
      // Given
      mockFetch.mockRejectedValueOnce(new Error('Network error'));
      const req = createMockRequest({ path: 'uk/research/some-post' });
      const res = createMockResponse();

      // When
      await handler(req, res);

      // Then
      const html = (res.send as ReturnType<typeof vi.fn>).mock.calls[0][0];
      expect(html).toContain('og:title" content="PolicyEngine"');
    });
  });
});
