import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiFlagshipReportStore } from '@/api/flagshipReportStore';
import { CountryProvider } from '@/contexts/CountryContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { ACCOUNT_UNAVAILABLE_MESSAGE } from '@/libs/auth/useAssociationBackend';
import { runFlagshipReport, type RunReportProvision } from '@/libs/flagship/runReport';
import { store } from '@/store';
import { PE_USER_ID } from '@/tests/fixtures/api/v2UserMocks';
import {
  accountErrorAuthValue,
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

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

function renderRun(initialAuth: AuthContextValue) {
  let auth = initialAuth;
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ReduxProvider store={store}>
      <CountryProvider value="us">
        <AuthTestProvider value={auth}>
          <NavigationProvider value={{ push: vi.fn(), replace: vi.fn(), back: vi.fn() }}>
            {children}
          </NavigationProvider>
        </AuthTestProvider>
      </CountryProvider>
    </ReduxProvider>
  );
  const rendered = renderHook(() => useRunFlagshipReport(), { wrapper });
  return {
    ...rendered,
    settle: (next: AuthContextValue) => {
      auth = next;
      rendered.rerender();
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(runFlagshipReport).mockResolvedValue('56');
});

describe('useRunFlagshipReport', () => {
  test('given the account could not be loaded then the run is refused before anything is created', async () => {
    // Given
    const { result } = renderRun(accountErrorAuthValue());

    // When
    await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

    // Then
    expect(runFlagshipReport).not.toHaveBeenCalled();
    expect(result.current.error).toBe(ACCOUNT_UNAVAILABLE_MESSAGE);
    expect(result.current.isRunning).toBe(false);
  });

  test('given a run started while signing in then it is recorded in the account once signed in', async () => {
    // Given
    const { result, settle } = renderRun(makeAuthValue({ status: 'loading' }));
    let running: Promise<void> | undefined;
    act(() => {
      running = result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS);
    });
    expect(runFlagshipReport).not.toHaveBeenCalled();

    // When
    act(() => settle(signedInAuthValue()));
    await act(() => running!);

    // Then
    expect(runFlagshipReport).toHaveBeenCalledTimes(1);
    const { account } = vi.mocked(runFlagshipReport).mock.calls[0][0];
    expect(account?.userId).toBe(PE_USER_ID);
    expect(account?.reportStore).toBeInstanceOf(ApiFlagshipReportStore);
  });

  test('given a run started while the session restores then a signed-out visitor runs locally without an error', async () => {
    // Given
    const { result, settle } = renderRun(makeAuthValue({ status: 'loading' }));
    let running: Promise<void> | undefined;
    act(() => {
      running = result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS);
    });

    // When
    act(() => settle(makeAuthValue({ status: 'anonymous' })));
    await act(() => running!);

    // Then
    await waitFor(() => expect(runFlagshipReport).toHaveBeenCalledTimes(1));
    expect(vi.mocked(runFlagshipReport).mock.calls[0][0].account).toBeNull();
    expect(result.current.error).toBeNull();
  });
});
