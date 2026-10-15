import { act, renderHook, waitFor } from '@testing-library/react';
import { Provider as ReduxProvider } from 'react-redux';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { ApiFlagshipReportStore } from '@/api/flagshipReportStore';
import { CountryProvider } from '@/contexts/CountryContext';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { useRunFlagshipReport } from '@/hooks/useRunFlagshipReport';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { runFlagshipReport, type RunReportProvision } from '@/libs/flagship/runReport';
import { store } from '@/store';
import {
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

function renderRun(auth: AuthContextValue, push = vi.fn()) {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <ReduxProvider store={store}>
      <CountryProvider value="us">
        <AuthTestProvider value={auth}>
          <NavigationProvider value={{ push, replace: vi.fn(), back: vi.fn() }}>
            {children}
          </NavigationProvider>
        </AuthTestProvider>
      </CountryProvider>
    </ReduxProvider>
  );
  return renderHook(() => useRunFlagshipReport(), { wrapper });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(runFlagshipReport).mockResolvedValue('56');
});

describe('useRunFlagshipReport', () => {
  test('given a signed-in session then the run records in the account', async () => {
    // Given
    const { result } = renderRun(signedInAuthValue());

    // When
    await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

    // Then
    expect(runFlagshipReport).toHaveBeenCalledTimes(1);
    const { accountReportStore } = vi.mocked(runFlagshipReport).mock.calls[0][0];
    expect(accountReportStore).toBeInstanceOf(ApiFlagshipReportStore);
  });

  test("given a signed-out session then the run records as this browser's user in the API", async () => {
    // Given
    const { result } = renderRun(makeAuthValue());

    // When
    await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

    // Then
    const { accountReportStore } = vi.mocked(runFlagshipReport).mock.calls[0][0];
    expect(accountReportStore).toBeInstanceOf(ApiFlagshipReportStore);
  });

  test('given sign-in off then the run records in this browser', async () => {
    // Given
    const { result } = renderRun(makeAuthValue({ status: 'disabled' }));

    // When
    await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

    // Then
    await waitFor(() => expect(runFlagshipReport).toHaveBeenCalledTimes(1));
    expect(vi.mocked(runFlagshipReport).mock.calls[0][0].accountReportStore).toBeNull();
    expect(result.current.error).toBeNull();
  });

  test("given a signed-in run then the report opens at its saved report's link", async () => {
    // Given: the run answers the account row's ID, which anyone can open
    const reportRowId = '44444444-4444-4444-8444-444444444444';
    vi.mocked(runFlagshipReport).mockResolvedValue(reportRowId);
    const push = vi.fn();
    const { result } = renderRun(signedInAuthValue(), push);

    // When
    await act(() => result.current.run('CTC expansion', 'Hand-built draft', PROVISIONS));

    // Then
    expect(push).toHaveBeenCalledWith(`/us/report/${reportRowId}`);
  });
});
