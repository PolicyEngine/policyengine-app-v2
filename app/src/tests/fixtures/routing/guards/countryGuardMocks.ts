/**
 * Test fixtures for CountryGuard component tests
 *
 * Includes edge cases, security test patterns, and malicious input examples
 */

// Valid countries
export const VALID_COUNTRIES = {
  US: 'us',
  UK: 'uk',
  CA: 'ca',
  NG: 'ng',
  IL: 'il',
} as const;

// Invalid country examples
export const INVALID_COUNTRIES = {
  SIMPLE: 'invalid',
  NUMERIC: '123',
  EMPTY: '',
  UNDEFINED: undefined,
} as const;

// Security test patterns - testing guard's resilience
export const MALICIOUS_INPUTS = {
  // SQL injection attempts
  SQL_INJECTION: "'; DROP TABLE users; --",
  SQL_UNION: "1' UNION SELECT * FROM users--",

  // XSS attempts
  XSS_SCRIPT: '<script>alert("xss")</script>',
  XSS_IMG: '<img src=x onerror=alert("xss")>',
  XSS_ENCODED: '%3Cscript%3Ealert(%22xss%22)%3C/script%3E',

  // Path traversal attempts
  PATH_TRAVERSAL: '../../../etc/passwd',
  PATH_WINDOWS: '..\\..\\..\\windows\\system32',

  // Special characters and garbage
  SPECIAL_CHARS: '@#$%^&*()_+={}[]|\\:";\'<>?,.',
  UNICODE: '🇬🇧😀مرحبا你好',
  NULL_BYTE: 'us\x00.txt',

  // Buffer overflow attempts
  LONG_STRING: 'a'.repeat(10000),

  // Command injection attempts
  COMMAND_INJECTION: '; ls -la',
  PIPE_COMMAND: '| cat /etc/passwd',
} as const;

// Test paths with various patterns
export const TEST_PATHS = {
  // Valid paths
  US_POLICIES: '/us/policies',
  UK_HOUSEHOLD: '/uk/household/123',
  CA_REPORTS: '/ca/reports/annual/2024',

  // Invalid country paths
  INVALID_SIMPLE: '/invalid/policies',
  GARBAGE_PATH: `/${MALICIOUS_INPUTS.SPECIAL_CHARS}/policies`,
  SQL_PATH: `/${MALICIOUS_INPUTS.SQL_INJECTION}/household`,
  XSS_PATH: `/${MALICIOUS_INPUTS.XSS_SCRIPT}/reports`,
  TRAVERSAL_PATH: `/${MALICIOUS_INPUTS.PATH_TRAVERSAL}/configurations`,
  UNICODE_PATH: `/${MALICIOUS_INPUTS.UNICODE}/about`,
  LONG_PATH: `/${MALICIOUS_INPUTS.LONG_STRING}/test`,

  // Edge cases
  ROOT: '/',
  DOUBLE_SLASH: '//policies',
  TRAILING_SLASH: '/us/policies/',
  QUERY_PARAMS: '/invalid/policies?filter=active&sort=date',
  HASH_FRAGMENT: '/invalid/policies#section',
} as const;

// Expected redirect paths
// NOTE: After simplification, CountryGuard now redirects to '/' for all invalid countries,
// letting the root route handler decide the country (instead of preserving paths)
export const EXPECTED_REDIRECTS = {
  DEFAULT_COUNTRY: 'us',

  // All invalid countries now redirect to root
  POLICIES: '/',
  HOUSEHOLD: '/',
  REPORTS: '/',
  ROOT_REDIRECT: '/',

  // Complex paths also redirect to root (no path preservation)
  NESTED_PATH: '/',
  WITH_QUERY: '/',
  WITH_HASH: '/',
} as const;

// Helper function to create mock Navigate tracking
export function createNavigateMock() {
  const navigateCalls: Array<{ to: string; replace?: boolean }> = [];

  const MockNavigate = ({ to, replace }: { to: string; replace?: boolean }) => {
    navigateCalls.push({ to, replace });
    return null;
  };

  return {
    MockNavigate,
    navigateCalls,
    getLastCall: () => navigateCalls[navigateCalls.length - 1],
    wasCalledWith: (to: string, replace = true) =>
      navigateCalls.some((call) => call.to === to && call.replace === replace),
  };
}
