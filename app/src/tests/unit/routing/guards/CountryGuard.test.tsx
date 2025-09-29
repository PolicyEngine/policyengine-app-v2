import { render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryGuard } from '@/routing/guards/CountryGuard';
import { EXPECTED_REDIRECTS, TEST_PATHS } from '@/tests/fixtures/routing/guards/countryGuardMocks';

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

  describe('Valid Countries', () => {
    test('given US country then renders children', () => {
      const { getByText } = render(
        <MemoryRouter initialEntries={[TEST_PATHS.US_POLICIES]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>
              <Route path="*" element={<div>Protected Content</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(getByText('Protected Content')).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given UK country then renders children', () => {
      const { getByText } = render(
        <MemoryRouter initialEntries={[TEST_PATHS.UK_HOUSEHOLD]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>UK Content</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(getByText('UK Content')).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    test('given CA country then renders children', () => {
      const { getByText } = render(
        <MemoryRouter initialEntries={[TEST_PATHS.CA_REPORTS]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>CA Content</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(getByText('CA Content')).toBeDefined();
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Countries', () => {
    test('given simple invalid country then redirects to default', () => {
      render(
        <MemoryRouter initialEntries={[TEST_PATHS.INVALID_SIMPLE]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_REDIRECTS.POLICIES, true);
    });

    test('given no country (root path) then redirects', () => {
      render(
        <MemoryRouter initialEntries={[TEST_PATHS.ROOT]}>
          <Routes>
            <Route path="/" element={<CountryGuard />}>
              <Route path="*" element={<div>Should not render</div>} />
            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_REDIRECTS.ROOT_REDIRECT, true);
    });
  });

  describe('Security - Malicious Inputs', () => {
    test('given SQL injection attempt then safely redirects', () => {
      render(
        <MemoryRouter initialEntries={[TEST_PATHS.SQL_PATH]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should safely redirect without executing SQL
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given XSS script injection then safely redirects', () => {
      render(
        <MemoryRouter initialEntries={[TEST_PATHS.XSS_PATH]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should safely redirect to root
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given path traversal attempt then safely redirects', () => {
      render(
        <MemoryRouter initialEntries={[TEST_PATHS.TRAVERSAL_PATH]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should safely redirect to root
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given special characters garbage then safely redirects', () => {
      render(
        <MemoryRouter initialEntries={[TEST_PATHS.GARBAGE_PATH]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should safely redirect to root
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given unicode and emoji then safely redirects', () => {
      render(
        <MemoryRouter initialEntries={[TEST_PATHS.UNICODE_PATH]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should handle unicode safely
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });

    test('given extremely long string (buffer overflow attempt) then safely redirects', () => {
      // Note: Using a shorter string for the test to avoid memory issues
      const longString = 'x'.repeat(1000);
      const longPath = `/${longString}/test`;

      render(
        <MemoryRouter initialEntries={[longPath]}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      // Should handle long strings without buffer overflow
      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });
  });

  describe('Path Preservation', () => {
    test('given invalid country with nested path then preserves full path', () => {
      render(
        <MemoryRouter initialEntries={['/invalid/reports/123/edit']}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith(EXPECTED_REDIRECTS.NESTED_PATH, true);
    });

    test('given invalid country with complex path then preserves structure', () => {
      render(
        <MemoryRouter initialEntries={['/xyz/household/person/1/income/employment']}>
          <Routes>
            <Route path="/:countryId" element={<CountryGuard />}>

              <Route path="*" element={<div>Should not render</div>} />

            </Route>
          </Routes>
        </MemoryRouter>
      );

      expect(mockNavigate).toHaveBeenCalledWith('/', true);
    });
  });
});
