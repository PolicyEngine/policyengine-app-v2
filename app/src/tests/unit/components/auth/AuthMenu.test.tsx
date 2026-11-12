import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, userEvent, waitFor } from '@test-utils';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import AuthMenu from '@/components/auth/AuthMenu';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';
import HeaderActionButtons from '@/components/homeHeader/HeaderActionButtons';
import { NavigationProvider } from '@/contexts/NavigationContext';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { publicApiPathOf } from '@/tests/fixtures/api/publicApiRouteMocks';
import {
  answerMe,
  deferredResponse,
  itemResponse,
  meItemOfType,
} from '@/tests/fixtures/api/v2UserMocks';
import { createTestQueryClient, MeStatusProbe } from '@/tests/fixtures/hooks/useMeMocks';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
  TEST_PROFILE,
} from '@/tests/fixtures/libs/auth/authMocks';
import { accountStorage } from '@/tests/fixtures/types/v2UserMocks';

vi.mock('@/types/v2User', async (importOriginal) => {
  const { withSwitchableAccountStorage } = await import('@/tests/fixtures/types/v2UserMocks');
  return withSwitchableAccountStorage(await importOriginal());
});

const fetchMock = vi.fn();

/** Where the menu's items navigate to. */
const navigation = { push: vi.fn(), replace: vi.fn(), back: vi.fn() };

beforeEach(() => {
  fetchMock.mockReset();
  answerMe(fetchMock);
  vi.stubGlobal('fetch', fetchMock);
  navigation.push.mockReset();
});

afterEach(() => {
  accountStorage.withoutAccountStorage = false;
});

/**
 * Renders the menu for `auth`. `GET /v2/me` answers with a standard user
 * unless a test answers it otherwise; `showMeStatus` also shows that
 * request's status, so a test can wait until it has answered.
 */
function renderMenu(
  auth: AuthContextValue,
  countryId = 'us',
  { showMeStatus = false }: { showMeStatus?: boolean } = {}
) {
  return render(
    <QueryClientProvider client={createTestQueryClient()}>
      <NavigationProvider value={navigation}>
        <AuthTestProvider value={auth}>
          <AuthMenu />
          {showMeStatus && <MeStatusProbe />}
        </AuthTestProvider>
      </NavigationProvider>
    </QueryClientProvider>,
    countryId
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: /account menu for ada lovelace/i }));
}

/** The `GET /v2/me` requests sent so far. */
function meReads() {
  return fetchMock.mock.calls.filter(
    ([url, init]) => publicApiPathOf(url) === '/v2/me' && (init?.method ?? 'GET') === 'GET'
  );
}

describe('legacy calculator pages', () => {
  test('given the legacy header then it has no sign-in control', () => {
    // When
    render(<HeaderActionButtons />);

    // Then
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /account menu/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /country selector/i })).toBeInTheDocument();
  });

  test('given the v3 top bar outside the workspace (no auth provider) then it has no sign-in control', () => {
    // When
    render(<FlagshipTopBar />);

    // Then
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /account menu/i })).not.toBeInTheDocument();
  });
});

describe('AuthMenu', () => {
  test('given sign-in is disabled then nothing is shown', () => {
    // When
    renderMenu(makeAuthValue({ status: 'disabled' }));

    // Then
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test.each([
    ['signed out', makeAuthValue()],
    ['signed in', signedInAuthValue()],
  ])('given a country without account storage then nothing is shown, %s', (_, auth) => {
    // Given
    accountStorage.withoutAccountStorage = true;

    // When
    renderMenu(auth);

    // Then
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('given a signed-out visitor then "Sign in" starts sign-in', async () => {
    // Given
    const user = userEvent.setup();
    const auth = makeAuthValue();
    renderMenu(auth);

    // When
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Then
    expect(auth.signIn).toHaveBeenCalled();
    expect(screen.queryByText(/your session ended/i)).not.toBeInTheDocument();
  });

  test('given the session ended on its own then the menu invites signing in again', () => {
    // When
    renderMenu(makeAuthValue({ sessionEnded: true }));

    // Then
    expect(screen.getByText(/your session ended/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeInTheDocument();
  });

  test('given a signed-in user then the menu shows the ID-token identity, My account and Sign out', async () => {
    // Given
    const user = userEvent.setup();
    const auth = signedInAuthValue();
    renderMenu(auth);

    // When
    await user.click(screen.getByRole('button', { name: /account menu for ada lovelace/i }));

    // Then
    expect(screen.getByText(TEST_PROFILE.email)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /my account/i })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: /sign out/i }));
    expect(auth.signOut).toHaveBeenCalled();
  });

  test.each(['us', 'uk'])(
    'given an admin in %s then "Admin" is in the menu as it opens, and opens the users page',
    async (countryId) => {
      // Given: the header reads the user's type before the menu is opened.
      const user = userEvent.setup();
      answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType('admin')) });
      renderMenu(signedInAuthValue(), countryId, { showMeStatus: true });
      await screen.findByText('/v2/me status: success');

      // When
      await openMenu(user);
      await user.click(screen.getByRole('menuitem', { name: 'Admin' }));

      // Then
      expect(navigation.push).toHaveBeenCalledWith(`/${countryId}/admin/users`);
      expect(meReads()).toHaveLength(1);
    }
  );

  test('given /v2/me has not answered then the menu has no "Admin"', async () => {
    // Given
    const user = userEvent.setup();
    const pendingMe = deferredResponse();
    answerMe(fetchMock, { meResponse: () => pendingMe.response });
    renderMenu(signedInAuthValue());
    await waitFor(() => expect(meReads()).toHaveLength(1));

    // When
    await openMenu(user);

    // Then
    expect(screen.getByRole('menuitem', { name: /my account/i })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Admin' })).not.toBeInTheDocument();
  });

  test('given /v2/me answers "admin" while the menu is open then the open menu keeps its items, and the next opening has "Admin"', async () => {
    // Given
    const user = userEvent.setup();
    const pendingMe = deferredResponse();
    answerMe(fetchMock, { meResponse: () => pendingMe.response });
    renderMenu(signedInAuthValue(), 'us', { showMeStatus: true });
    await waitFor(() => expect(meReads()).toHaveLength(1));
    await openMenu(user);

    // When
    pendingMe.answer(itemResponse(meItemOfType('admin')));
    await screen.findByText('/v2/me status: success');

    // Then: no item is added under the pointer while the menu is open.
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'My account',
      'Sign out',
    ]);
    await user.keyboard('{Escape}');
    await openMenu(user);
    expect(screen.getAllByRole('menuitem').map((item) => item.textContent)).toEqual([
      'My account',
      'Admin',
      'Sign out',
    ]);
  });

  test('given /v2/me answers "admin" while the menu is open then closing it by choosing an item and opening it by keyboard shows "Admin"', async () => {
    // Given
    const user = userEvent.setup();
    const pendingMe = deferredResponse();
    answerMe(fetchMock, { meResponse: () => pendingMe.response });
    renderMenu(signedInAuthValue(), 'us', { showMeStatus: true });
    await waitFor(() => expect(meReads()).toHaveLength(1));
    await openMenu(user);
    pendingMe.answer(itemResponse(meItemOfType('admin')));
    await screen.findByText('/v2/me status: success');

    // When
    await user.click(screen.getByRole('menuitem', { name: /my account/i }));
    screen.getByRole('button', { name: /account menu for ada lovelace/i }).focus();
    await user.keyboard('{Enter}');

    // Then
    expect(navigation.push).toHaveBeenCalledWith('/us/account');
    expect(await screen.findByRole('menuitem', { name: 'Admin' })).toBeInTheDocument();
  });

  test('given an admin then every item in the account menu shows a pointer', async () => {
    // Given
    const user = userEvent.setup();
    answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType('admin')) });
    renderMenu(signedInAuthValue(), 'us', { showMeStatus: true });
    await screen.findByText('/v2/me status: success');

    // When
    await openMenu(user);

    // Then
    const items = screen.getAllByRole('menuitem');
    expect(items).toHaveLength(3);
    for (const item of items) {
      expect(item).toHaveClass('tw:cursor-pointer');
      expect(item).not.toHaveClass('tw:cursor-default');
    }
  });

  test.each(['standard', 'author'] as const)(
    'given a user of type %s then the menu has no "Admin"',
    async (userType) => {
      // Given
      const user = userEvent.setup();
      answerMe(fetchMock, { meResponse: () => itemResponse(meItemOfType(userType)) });
      renderMenu(signedInAuthValue(), 'us', { showMeStatus: true });
      await screen.findByText('/v2/me status: success');

      // When
      await openMenu(user);

      // Then
      expect(screen.getByRole('menuitem', { name: /my account/i })).toBeInTheDocument();
      expect(screen.queryByRole('menuitem', { name: 'Admin' })).not.toBeInTheDocument();
    }
  );
});
