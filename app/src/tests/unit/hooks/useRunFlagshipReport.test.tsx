import { act, renderHook } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { CountryProvider } from '@/contexts/CountryContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useFlagshipReportStore } from '@/hooks/useFlagshipStores';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import {
  ACCOUNT_UNAVAILABLE_MESSAGE,
  AccountUnavailableError,
} from '@/libs/auth/useAssociationBackend';
import { runFlagshipReport, type RunReportProvision } from '@/libs/flagship/runReport';
import { store } from '@/store';

vi.mock('@/hooks/useFlagshipStores', () => ({
  useFlagshipReportStore: vi.fn(),
}));

vi.mock('@/libs/flagship/runReport', () => ({
  runFlagshipReport: vi.fn(),
}));

vi.mock('react-redux', async () => {
  const actual = await vi.importActual<typeof import('react-redux')>('react-redux');
  return { ...actual, useSelector: vi.fn(() => 2) };
});

const PROVISIONS: RunReportProvision[] = [
  {
    path: 'gov.irs.credits.ctc.amount',
    breadcrumb: 'CTC',
    unit: null,
    baselineValue: 2000,
    value: 3000,
  },
];

function wrapper({ children }: { children: React.ReactNode }) {
  return (
    <ReduxProvider store={store}>
      <CountryProvider value="us">
        <NavigationProvider value={{ push: vi.fn(), replace: vi.fn(), back: vi.fn() }}>
          {children}
        </NavigationProvider>
      </CountryProvider>
    </ReduxProvider>
  );
}

function selection(overrides: Partial<ReturnType<typeof useFlagshipReportStore>> = {}) {
  return {
    store: {} as ReturnType<typeof useFlagshipReportStore>['store'],
    isAccount: true,
    userId: 'account-unavailable',
    ready: true,
    accountError: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useRunFlagshipReport', () => {
  test('given the account could not be loaded then the run is refused before anything is created', async () => {
    // Given
    vi.mocked(useFlagshipReportStore).mockReturnValue(
      selection({ accountError: new AccountUnavailableError() })
    );
    const { result } = renderHook(() => useRunFlagshipReport(), { wrapper });

    // When
    await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

    // Then
    expect(runFlagshipReport).not.toHaveBeenCalled();
    expect(result.current.error).toBe(ACCOUNT_UNAVAILABLE_MESSAGE);
  });

  test('given the session is still being restored then the run waits instead of saving locally', async () => {
    // Given
    vi.mocked(useFlagshipReportStore).mockReturnValue(
      selection({ isAccount: false, ready: false })
    );
    const { result } = renderHook(() => useRunFlagshipReport(), { wrapper });

    // When
    await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

    // Then
    expect(runFlagshipReport).not.toHaveBeenCalled();
    expect(result.current.error).toMatch(/still checking your sign-in/i);
  });
});
