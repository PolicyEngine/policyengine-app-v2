import { vi } from 'vitest';

/**
 * Mock IntersectionObserver for testing infinite scroll functionality.
 */
export const mockObserve = vi.fn();
export const mockDisconnect = vi.fn();
export const mockUnobserve = vi.fn();

export class MockIntersectionObserver {
  callback: IntersectionObserverCallback;

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }

  observe = mockObserve;
  disconnect = mockDisconnect;
  unobserve = mockUnobserve;
}

/**
 * Setup the IntersectionObserver mock globally.
 * Call this before tests that use IntersectionObserver.
 */
export function setupIntersectionObserverMock() {
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
}

/**
 * Clear all IntersectionObserver mock calls.
 * Call this in beforeEach to reset state between tests.
 */
export function clearIntersectionObserverMocks() {
  mockObserve.mockClear();
  mockDisconnect.mockClear();
  mockUnobserve.mockClear();
}
