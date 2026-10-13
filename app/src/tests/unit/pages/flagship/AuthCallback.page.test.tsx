import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LocalStorageReformStore } from '@/api/reformStore';
import AccountImportNotice from '@/components/auth/AccountImportNotice';
import { MOCK_USER_ID } from '@/constants';
import { NavigationProvider } from '@/contexts/NavigationContext';
import { dismissAccountImportNotice } from '@/libs/auth/accountImport';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { takeSignInReturnTo } from '@/libs/auth/AuthProvider';
import AuthCallbackPage from '@/pages/flagship/AuthCallback.page';
import { errorResponse, okResponse } from '@/tests/fixtures/api/v2UserMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

vi.mock('@/libs/auth/AuthProvider', () => ({
  takeSignInReturnTo: vi.fn(),
}));

const fetchMock = vi.fn();
const navigation = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };

function renderCallback(auth: AuthContextValue) {
  return render(
    <NavigationProvider value={navigation}>
      <AuthTestProvider value={auth}>
        <AuthCallbackPage />
        <AccountImportNotice />
      </AuthTestProvider>
    </NavigationProvider>
  );
}

function requestPaths(): string[] {
  return fetchMock.mock.calls.map(([url]) => new URL(String(url)).pathname);
}

/** Answers imports with every reform added, or with a failure. */
function answerImports(imports: 'accept' | 'fail') {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    if (new URL(url).pathname !== '/v2/me/imports') {
      return new Response('', { status: 404 });
    }
    if (imports === 'fail') {
      return errorResponse(503, 'Saved work is temporarily unavailable.');
    }
    const body = JSON.parse(String(init.body));
    return okResponse({
      id_map: Object.fromEntries(
        (body.policies ?? []).map((item: { client_ref: string }) => [item.client_ref, 'uuid-1'])
      ),
      skipped: [],
    });
  });
}

const browserReformCount = () => JSON.parse(localStorage.getItem('reforms') ?? '[]').length;

beforeEach(async () => {
  localStorage.clear();
  vi.clearAllMocks();
  vi.stubGlobal('fetch', fetchMock);
  vi.mocked(takeSignInReturnTo).mockReturnValue('/us/reforms');
  dismissAccountImportNotice();
  // A reform saved on this browser while signed out, with its v1 policy.
  await new LocalStorageReformStore().create({
    userId: MOCK_USER_ID,
    countryId: 'us',
    label: 'CTC expansion',
    policyId: '95762',
    parameters: [],
    baseline: 'current-law',
    provenance: { source: 'manual' },
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('AuthCallbackPage', () => {
  test('given work saved on this browser then it moves to the account, then it returns', async () => {
    // Given
    answerImports('accept');

    // When
    renderCallback(signedInAuthValue());

    // Then
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(requestPaths()).toEqual(['/v2/me/imports']);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Moved 1 reform and 0 reports from this browser to your account.'
    );
    expect(browserReformCount()).toBe(0);
  });

  test('given nothing saved on this browser then nothing is called', async () => {
    // Given
    localStorage.clear();
    answerImports('accept');

    // When
    renderCallback(signedInAuthValue());

    // Then
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given the import fails then the work stays, and Try again moves it', async () => {
    // Given
    answerImports('fail');
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    renderCallback(signedInAuthValue());
    expect(await screen.findByRole('alert')).toHaveTextContent(/still on this browser/);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(browserReformCount()).toBe(1);

    // When
    answerImports('accept');
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then
    expect(await screen.findByText(/^Moved 1 reform/)).toBeInTheDocument();
    expect(requestPaths()).toEqual(['/v2/me/imports', '/v2/me/imports']);
    expect(browserReformCount()).toBe(0);
  });

  test('given sign-in did not complete then the error shows and nothing is called', () => {
    // When
    renderCallback(makeAuthValue({ error: new Error('access_denied') }));

    // Then
    expect(screen.getByText('Sign-in did not complete')).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(navigation.replace).not.toHaveBeenCalled();
  });
});
