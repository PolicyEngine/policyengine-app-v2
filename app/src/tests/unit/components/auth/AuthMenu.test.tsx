import { render, screen, userEvent } from '@test-utils';
import { describe, expect, test } from 'vitest';
import AuthMenu from '@/components/auth/AuthMenu';
import HeaderActionButtons from '@/components/homeHeader/HeaderActionButtons';
import type { AuthContextValue } from '@/libs/auth/AuthContext';
import { mockMeItem } from '@/tests/fixtures/api/v2UserMocks';
import {
  accountErrorAuthValue,
  AuthTestProvider,
  makeAuthValue,
  signedInAuthValue,
} from '@/tests/fixtures/libs/auth/authMocks';

function renderMenu(auth: AuthContextValue) {
  return render(
    <AuthTestProvider value={auth}>
      <AuthMenu />
    </AuthTestProvider>
  );
}

describe('AuthMenu', () => {
  test('given sign-in is disabled then the header shows no sign-in control', () => {
    // When
    render(<HeaderActionButtons />);

    // Then
    expect(screen.queryByRole('button', { name: /sign in/i })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /country selector/i })).toBeInTheDocument();
  });

  test('given the session is loading then nothing is shown', () => {
    // When
    renderMenu(makeAuthValue({ status: 'loading' }));

    // Then
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  test('given a signed-out visitor then "Sign in" starts sign-in', async () => {
    // Given
    const user = userEvent.setup();
    const auth = makeAuthValue({ status: 'anonymous' });
    renderMenu(auth);

    // When
    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    // Then
    expect(auth.signIn).toHaveBeenCalled();
  });

  test('given a signed-in user then the menu offers My account and Sign out', async () => {
    // Given
    const user = userEvent.setup();
    const auth = signedInAuthValue();
    renderMenu(auth);

    // When
    await user.click(screen.getByRole('button', { name: /account menu for ada lovelace/i }));

    // Then
    expect(screen.getByText(mockMeItem.email!)).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /my account/i })).toBeInTheDocument();
    await user.click(screen.getByRole('menuitem', { name: /sign out/i }));
    expect(auth.signOut).toHaveBeenCalled();
  });

  test('given the account could not be loaded then the menu says so and offers Try again', async () => {
    // Given
    const user = userEvent.setup();
    const auth = accountErrorAuthValue();
    renderMenu(auth);

    // When
    await user.click(
      screen.getByRole('button', { name: /account menu for ada lovelace \(account not loaded\)/i })
    );

    // Then
    expect(screen.getByRole('alert')).toHaveTextContent(/could not load your account/i);
    await user.click(screen.getByRole('menuitem', { name: /try again/i }));
    expect(auth.retryAccount).toHaveBeenCalled();
  });

  test('given the account could not be loaded then Sign out is still offered', async () => {
    // Given
    const user = userEvent.setup();
    const auth = accountErrorAuthValue();
    renderMenu(auth);

    // When
    await user.click(screen.getByRole('button', { name: /account menu for/i }));
    await user.click(screen.getByRole('menuitem', { name: /sign out/i }));

    // Then
    expect(auth.signOut).toHaveBeenCalled();
  });
});
