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
import {
  errorResponse,
  itemResponse,
  mockMeItem,
  okResponse,
} from '@/tests/fixtures/api/v2UserMocks';
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

/** Answers /v2/me with `accountCreated`, and imports with everything added. */
function answer({
  accountCreated,
  imports = 'accept',
}: {
  accountCreated: boolean;
  imports?: 'accept' | 'fail';
}) {
  fetchMock.mockImplementation(async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname;
    if (path === '/v2/me') {
      return itemResponse({ ...mockMeItem, account_created: accountCreated });
    }
    if (path === '/v2/me/imports') {
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
    }
    return new Response('', { status: 404 });
  });
}

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
  test("given the sign-in created the account then this browser's v3 work is imported, then it returns", async () => {
    // Given
    answer({ accountCreated: true });

    // When
    renderCallback(signedInAuthValue());

    // Then
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(requestPaths()).toEqual(['/v2/me', '/v2/me/imports']);
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Added 1 reform and 0 reports saved on this browser to your account.'
    );
  });

  test('given an existing account signs in then nothing is imported', async () => {
    // Given
    answer({ accountCreated: false });

    // When
    renderCallback(signedInAuthValue());

    // Then
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(requestPaths()).toEqual(['/v2/me']);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  test('given the import fails then the notice says the work is still here, with one Try again', async () => {
    // Given
    answer({ accountCreated: true, imports: 'fail' });
    const user = userEvent.setup();
    renderCallback(signedInAuthValue());
    expect(await screen.findByRole('alert')).toHaveTextContent(/still on this browser/);
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));

    // When
    answer({ accountCreated: false });
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    // Then: the retry imports again; /v2/me is not asked again
    expect(await screen.findByText(/^Added 1 reform/)).toBeInTheDocument();
    expect(requestPaths().filter((path) => path === '/v2/me')).toHaveLength(1);
    expect(requestPaths().filter((path) => path === '/v2/me/imports')).toHaveLength(2);
  });

  test('given /v2/me fails then it still returns, without an import', async () => {
    // Given
    fetchMock.mockResolvedValue(errorResponse(503, 'Saved work is temporarily unavailable.'));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // When
    renderCallback(signedInAuthValue());

    // Then
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith('/us/reforms'));
    expect(requestPaths()).toEqual(['/v2/me']);
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
