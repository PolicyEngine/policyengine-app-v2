import { redirect } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { validateCountryLoader } from '@/routing/loaders/countryLoader';
import {
  createMockRedirectResponse,
  EXPECTED_REDIRECTS,
  MOCK_PARAMS,
  TEST_PATHS,
} from '@/tests/fixtures/routing/loaders/countryLoaderMocks';

// Mock react-router-dom's redirect
vi.mock('react-router-dom', () => ({
  redirect: vi.fn((path: string) => createMockRedirectResponse(path)),
}));

// Mock window.location
const mockLocation = {
  pathname: TEST_PATHS.CONFIGURATIONS as string,
};

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true,
});

describe('validateCountryLoader', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('given valid US country then returns null to proceed', async () => {
    // Given
    const params = MOCK_PARAMS.VALID_US;

    // When
    const result = await validateCountryLoader({ params });

    // Then
    expect(result).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  test('given valid UK country then returns null to proceed', async () => {
    // Given
    const params = MOCK_PARAMS.VALID_UK;

    // When
    const result = await validateCountryLoader({ params });

    // Then
    expect(result).toBeNull();
    expect(redirect).not.toHaveBeenCalled();
  });

  test('given invalid country then redirects to default country', async () => {
    // Given
    mockLocation.pathname = TEST_PATHS.INVALID_POLICIES;

    // When
    const result = await validateCountryLoader({ params: MOCK_PARAMS.INVALID });

    // Then
    expect(redirect).toHaveBeenCalledWith(EXPECTED_REDIRECTS.US_POLICIES);
    expect(result).toEqual(createMockRedirectResponse(EXPECTED_REDIRECTS.US_POLICIES));
  });

  test('given no country param then redirects to default', async () => {
    // Given
    mockLocation.pathname = TEST_PATHS.ROOT;

    // When
    const result = await validateCountryLoader({ params: MOCK_PARAMS.EMPTY });

    // Then
    expect(redirect).toHaveBeenCalledWith(EXPECTED_REDIRECTS.US_WITH_SLASH);
    expect(result).toEqual(createMockRedirectResponse(EXPECTED_REDIRECTS.US_WITH_SLASH));
  });

  test('given configurations as country then redirects to us', async () => {
    // Given
    mockLocation.pathname = TEST_PATHS.CONFIGURATIONS;

    // When
    const result = await validateCountryLoader({ params: MOCK_PARAMS.CONFIGURATIONS });

    // Then
    expect(redirect).toHaveBeenCalledWith(EXPECTED_REDIRECTS.US_ROOT);
    expect(result).toEqual(createMockRedirectResponse(EXPECTED_REDIRECTS.US_ROOT));
  });

  test('given invalid country with nested path then preserves path in redirect', async () => {
    // Given
    mockLocation.pathname = TEST_PATHS.INVALID_REPORTS;

    // When
    await validateCountryLoader({ params: MOCK_PARAMS.INVALID });

    // Then
    expect(redirect).toHaveBeenCalledWith(EXPECTED_REDIRECTS.US_REPORTS);
  });
});
