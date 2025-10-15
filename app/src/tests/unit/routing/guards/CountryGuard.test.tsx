import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
  renderCountryGuardAtRoot,
  renderCountryGuardWithStore,
} from '@/tests/fixtures/routing/guards/countryGuardHelpers';
import {
  EXPECTED_REDIRECTS,
  TEST_IDS,
  TEST_PATHS,
  VALID_COUNTRIES,
} from '@/tests/fixtures/routing/guards/countryGuardMocks';

// Mock Navigate to track redirects
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to, replace }: { to: string; replace?: boolean }) => {
      mockNavigate(to, replace);
      return null;
    },
  };
});

describe('CountryGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Valid Countries - Rendering', () => {
    test('given US country then renders children', () => {
      // Given
      const initialPath = TEST_PATHS.US_POLICIES;

      // When
      const { getByTestId } = renderCountryGuardWithStore(initialPath);

      // Then
      expect(getByTestId(TEST_IDS.PROTECTED_CONTENT)).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given UK country then renders children', () => {
      // Given
      const initialPath = TEST_PATHS.UK_HOUSEHOLD;

      // When
      const { getByTestId } = renderCountryGuardWithStore(initialPath);

      // Then
      expect(getByTestId(TEST_IDS.PROTECTED_CONTENT)).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given CA country then renders children', () => {
      // Given
      const initialPath = TEST_PATHS.CA_REPORTS;

      // When
      const { getByTestId } = renderCountryGuardWithStore(initialPath);

      // Then
      expect(getByTestId(TEST_IDS.PROTECTED_CONTENT)).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given NG country then renders children', () => {
      // Given
      const initialPath = '/ng/policies';

      // When
      const { getByTestId } = renderCountryGuardWithStore(initialPath);

      // Then
      expect(getByTestId(TEST_IDS.PROTECTED_CONTENT)).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given IL country then renders children', () => {
      // Given
      const initialPath = '/il/reports';

      // When
      const { getByTestId } = renderCountryGuardWithStore(initialPath);

      // Then
      expect(getByTestId(TEST_IDS.PROTECTED_CONTENT)).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Optional Redux State Synchronization', () => {
    test('given US country then optionally syncs to Redux state', () => {
      // Given
      const initialPath = TEST_PATHS.US_POLICIES;

      // When
      const { store } = renderCountryGuardWithStore(initialPath);

      // Then - State may be set for Redux-only use cases (optional behavior)
      const state = store.getState();
      expect(state.metadata.currentCountry).toBe(VALID_COUNTRIES.US);
    });

    test('given UK country then optionally syncs to Redux state', () => {
      // Given
      const initialPath = TEST_PATHS.UK_HOUSEHOLD;

      // When
      const { store } = renderCountryGuardWithStore(initialPath);

      // Then
      const state = store.getState();
      expect(state.metadata.currentCountry).toBe(VALID_COUNTRIES.UK);
    });
  });

  describe('Invalid Countries', () => {
    test('given simple invalid country then redirects to default', () => {
      // Given
      const initialPath = TEST_PATHS.INVALID_SIMPLE;

      // When
      renderCountryGuardWithStore(initialPath);

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_REDIRECTS.POLICIES, true);
    });

    test('given no country (root path) then redirects', () => {
      // Given & When
      renderCountryGuardAtRoot(TEST_PATHS.ROOT);

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_REDIRECTS.ROOT_REDIRECT, true);
    });

    test('given invalid country then does not set Redux state', () => {
      // Given
      const initialPath = TEST_PATHS.INVALID_SIMPLE;

      // When
      const { store } = renderCountryGuardWithStore(initialPath);

      // Then
      const state = store.getState();
      // State should still be null (not set to invalid value)
      expect(state.metadata.currentCountry).toBeNull();
    });
  });

  describe('Security - Malicious Inputs', () => {
    test('given SQL injection attempt then safely redirects', () => {
      // Given
      const initialPath = TEST_PATHS.SQL_PATH;

      // When
      renderCountryGuardWithStore(initialPath);

      // Then - Should safely redirect without executing SQL
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given XSS script injection then safely redirects', () => {
      // Given
      const initialPath = TEST_PATHS.XSS_PATH;

      // When
      renderCountryGuardWithStore(initialPath);

      // Then - Should safely redirect to root
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given path traversal attempt then safely redirects', () => {
      // Given
      const initialPath = TEST_PATHS.TRAVERSAL_PATH;

      // When
      renderCountryGuardWithStore(initialPath);

      // Then - Should safely redirect to root
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given special characters garbage then safely redirects', () => {
      // Given
      const initialPath = TEST_PATHS.GARBAGE_PATH;

      // When
      renderCountryGuardWithStore(initialPath);

      // Then - Should safely redirect to root
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given unicode and emoji then safely redirects', () => {
      // Given
      const initialPath = TEST_PATHS.UNICODE_PATH;

      // When
      renderCountryGuardWithStore(initialPath);

      // Then - Should handle unicode safely
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given extremely long string (buffer overflow attempt) then safely redirects', () => {
      // Given - Using a shorter string for the test to avoid memory issues
      const longString = 'x'.repeat(1000);
      const longPath = `/${longString}/test`;

      // When
      renderCountryGuardWithStore(longPath);

      // Then - Should handle long strings without buffer overflow
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });
  });

  describe('Path Preservation', () => {
    test('given invalid country with nested path then redirects to root', () => {
      // Given
      const initialPath = '/invalid/reports/123/edit';

      // When
      renderCountryGuardWithStore(initialPath);

      // Then
      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_REDIRECTS.NESTED_PATH, true);
    });

    test('given invalid country with complex path then redirects to root', () => {
      // Given
      const initialPath = '/xyz/household/person/1/income/employment';

      // When
      renderCountryGuardWithStore(initialPath);

      // Then
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });
  });

  describe('Validation Behavior', () => {
    test('given valid country allows children to render', () => {
      // Given
      const initialPath = TEST_PATHS.UK_HOUSEHOLD;

      // When
      const { queryByTestId } = renderCountryGuardWithStore(initialPath);

      // Then - Children should be rendered (CountryGuard returned <Outlet />)
      expect(queryByTestId(TEST_IDS.PROTECTED_CONTENT)).not.toBeNull();
    });

    test('given invalid country prevents children from rendering', () => {
      // Given
      const initialPath = TEST_PATHS.INVALID_SIMPLE;

      // When
      const { queryByTestId } = renderCountryGuardWithStore(initialPath);

      // Then - Children should not be rendered (CountryGuard returned <Navigate />)
      expect(queryByTestId(TEST_IDS.PROTECTED_CONTENT)).toBeNull();
    });
  });

  describe('All Supported Countries', () => {
    test('given each valid country then validates correctly', () => {
      // Test all countries in countryIds array
      const testCases = [
        { path: '/us/test', country: VALID_COUNTRIES.US },
        { path: '/uk/test', country: VALID_COUNTRIES.UK },
        { path: '/ca/test', country: VALID_COUNTRIES.CA },
        { path: '/ng/test', country: VALID_COUNTRIES.NG },
        { path: '/il/test', country: VALID_COUNTRIES.IL },
      ];

      testCases.forEach(({ path }) => {
        vi.clearAllMocks();
        const { getByTestId, unmount } = renderCountryGuardWithStore(path);
        expect(getByTestId(TEST_IDS.PROTECTED_CONTENT)).toBeDefined();
        expect(mockNavigate).not.toHaveBeenCalled();
        unmount(); // Clean up between iterations
      });
    });
  });
});
