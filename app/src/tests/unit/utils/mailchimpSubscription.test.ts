import jsonp from 'jsonp';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { submitToMailchimp } from '@/utils/mailchimpSubscription';

// Mock jsonp module
vi.mock('jsonp', () => ({
  default: vi.fn(),
}));

describe('submitToMailchimp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given valid email then resolves with success response', async () => {
    // Given
    const email = 'test@example.com';
    const mockData = {
      result: 'success',
      msg: 'Thank you for subscribing!',
    };

    vi.mocked(jsonp).mockImplementation(((_url: string, _options: any, callback: any) => {
      callback(null, mockData);
      return () => {}; // Return cancel function
    }) as any);

    // When
    const result = await submitToMailchimp(email);

    // Then
    expect(result.isSuccessful).toBe(true);
    expect(result.message).toBe('Thank you for subscribing!');
    expect(jsonp).toHaveBeenCalledWith(
      expect.stringContaining('EMAIL=test%40example.com'),
      { param: 'c' },
      expect.any(Function)
    );
  });

  test('given email already subscribed then resolves with error response', async () => {
    // Given
    const email = 'existing@example.com';
    const mockData = {
      result: 'error',
      msg: 'This email is already subscribed.',
    };

    vi.mocked(jsonp).mockImplementation(((_url: string, _options: any, callback: any) => {
      callback(null, mockData);
      return () => {};
    }) as any);

    // When
    const result = await submitToMailchimp(email);

    // Then
    expect(result.isSuccessful).toBe(false);
    expect(result.message).toBe('This email is already subscribed.');
  });

  test('given network error then rejects with error message', async () => {
    // Given
    const email = 'test@example.com';
    const mockError = new Error('Network error');

    vi.mocked(jsonp).mockImplementation(((_url: string, _options: any, callback: any) => {
      callback(mockError, null);
      return () => {};
    }) as any);

    // When/Then
    await expect(submitToMailchimp(email)).rejects.toThrow(
      'There was an issue processing your subscription; please try again later.'
    );
  });

  test('given email with special characters then encodes URL correctly', async () => {
    // Given
    const email = 'test+tag@example.com';
    const mockData = {
      result: 'success',
      msg: 'Thank you for subscribing!',
    };

    vi.mocked(jsonp).mockImplementation(((_url: string, _options: any, callback: any) => {
      callback(null, mockData);
      return () => {};
    }) as any);

    // When
    await submitToMailchimp(email);

    // Then
    expect(jsonp).toHaveBeenCalledWith(
      expect.stringContaining('EMAIL=test%2Btag%40example.com'),
      { param: 'c' },
      expect.any(Function)
    );
  });
});
