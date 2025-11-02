export const CACHED_COUNTRY_KEY = 'detectedCountry';

export const MOCK_CACHED_US = JSON.stringify({
  country: 'us',
  timestamp: Date.now(),
});

export const MOCK_CACHED_UK = JSON.stringify({
  country: 'uk',
  timestamp: Date.now(),
});

export const MOCK_EXPIRED_CACHE = JSON.stringify({
  country: 'us',
  timestamp: Date.now() - 5 * 60 * 60 * 1000, // 5 hours ago (expired)
});

export const MOCK_INVALID_CACHE = 'invalid json';

export function mockLocalStorage() {
  const store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach((key) => delete store[key]);
    },
  };
}
