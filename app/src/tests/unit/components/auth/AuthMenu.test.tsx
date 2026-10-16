import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import AuthMenu from '@/components/auth/AuthMenu';
import FlagshipTopBar from '@/components/flagship/FlagshipTopBar';
import HeaderActionButtons from '@/components/homeHeader/HeaderActionButtons';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import {
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
  TEST_PROFILE,
} from '@/tests/fixtures/libs/auth/authMocks';

function renderMenu(auth: AuthContextValue, countryId = 'us') {
  return render(
    <AuthTestProvider value={auth}>
      <AuthMenu />
    </AuthTestProvider>,
    countryId
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

  test('given a country without accounts then nothing is shown, signed in or out', () => {
    // When
    renderMenu(makeAuthValue(), 'ca');

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
});
